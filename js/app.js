(function () {
  const roleAr = { IT: "تقنية المعلومات", FNS: "المالية", SNS: "SNS", CEO: "الإدارة العليا" };
  const statusAr = { Paid: "تم الصرف", NotPaid: "لم يُصرف", Pending: "قيد الانتظار", Approved: "موافق عليه", Rejected: "مرفوض" };

  let currentUser = null;
  let requests = [];
  let logs = [];
  const notify = () => window.dispatchEvent(new Event("altadamun:data"));
  const getCurrentUser = () => currentUser;
  const getRequests = () => requests;
  const getLogs = () => logs;
  const note = event => IRSCloud.note(event).catch(console.error);

  function showDataError(error) {
    console.error(error);
    const content = document.querySelector(".content-wrap");
    if (!content) return;
    if (document.getElementById("firebaseDataError")) return;
    const message = document.createElement("p");
    message.id = "firebaseDataError";
    message.className = "error-text";
    message.setAttribute("role", "alert");
    message.textContent = "تعذر تحميل البيانات من Firebase. تحقق من الاتصال وحاول إعادة فتح الصفحة.";
    content.hidden = true;
    content.before(message);
  }

  async function loadData() {
    const user = currentUser;
    try {
      [requests, logs] = await Promise.all([
        user.role === "SNS" ? [] : IRSCloud.readRequests(user.role),
        user.role === "IT" ? IRSCloud.readLogs() : []
      ]);
      if (currentUser !== user) return false;
      if (user.role !== "SNS") IRSCloud.watchRequests(user.role, rows => {
        if (currentUser !== user) return;
        requests = rows;
        document.getElementById("firebaseDataError")?.remove();
        const content = document.querySelector(".content-wrap");
        if (content) content.hidden = false;
        notify();
      }, showDataError);
      const content = document.querySelector(".content-wrap");
      if (content && !document.getElementById("firebaseDataError")) content.hidden = false;
      return true;
    } catch (error) {
      showDataError(error);
      return false;
    }
  }

  async function mutateRequest(record, event, prior) {
    try {
      await IRSCloud.mutate(record, event, prior);
    } catch (error) {
      console.error(error);
      showToast("تعذر حفظ الطلب. تحقق من الاتصال والصلاحيات وحاول مرة أخرى.", "error");
      return false;
    }
    if (currentUser?.role === "IT") {
      IRSCloud.readLogs().then(rows => { logs = rows; notify(); }).catch(console.error);
    }
    return true;
  }

  function formatDate(iso) { return new Date(iso).toLocaleString("ar-IQ"); }

  function escapeHtml(t) {
    return String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function highlightText(text, query) {
    const clean = escapeHtml(text || "");
    if (!query) return clean;
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return clean.replace(new RegExp(`(${q})`, "ig"), "<mark>$1</mark>");
  }

  function showToast(message, type = "success") {
    const c = document.getElementById("toastContainer");
    if (!c) return;
    const n = document.createElement("div");
    n.className = `toast ${type}`;
    n.textContent = message;
    c.appendChild(n);
    setTimeout(() => n.remove(), 2500);
  }

  function getNavItems(role) {
    if (role === "SNS") return [{ href: "create.html", label: "رفع طلب" }];
    const common = [{ href: "dashboard.html", label: "لوحة التحكم" }, { href: "requests.html", label: "الطلبات" }, { href: "reports.html", label: "التقارير" }];
    if (role === "IT") common.push({ href: "hris/", label: "الموارد البشرية" });
    if (role === "IT") common.push({ href: "create.html", label: "إنشاء طلب" });
    if (role === "CEO" || role === "FNS" || role === "IT") common.push({ href: "approvals.html", label: "الموافقات" });
    if (role === "IT") common.push({ href: "logs.html", label: "السجلات" });
    return common;
  }

  function renderShell() {
    const user = getCurrentUser();
    const sidebar = document.getElementById("sidebar");
    const topbar = document.getElementById("topbar");
    if (!user || !sidebar || !topbar) return;
    const currentPage = location.pathname.split("/").pop();
  sidebar.innerHTML = `<div class="sidebar-brand"><img src="css/altadamun.svg" alt="" class="sidebar-logo" /><div>شركة التضامن للتامين التجاري</div></div>${getNavItems(user.role).map((n) => `<a class="nav-link ${currentPage === n.href ? "active" : ""}" href="${n.href}">${n.label}</a>`).join("")}`;
    topbar.innerHTML = `<div><strong>بوابة ${roleAr[user.role] || user.role}</strong><div style="color: var(--muted); font-size: .85rem;">مرحبًا، ${escapeHtml(user.username.replace(/@altadamun-accounts\.firebaseapp\.com$/, ""))}</div></div><button id="logoutBtn" class="btn btn-ghost">تسجيل الخروج</button>`;
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      note("logout");
      IRSCloud.signOut()
        .then(() => location.replace("index.html"))
        .catch(() => showToast("تعذر تسجيل الخروج", "error"));
    });
  }

  window.IRS = {
    getCurrentUser, getRequests, getLogs, note, mutateRequest, loadData, showDataError,
    setUser: user => {
      currentUser = user;
      if (!user) {
        requests = [];
        logs = [];
        const content = document.querySelector(".content-wrap");
        if (content) content.hidden = true;
      }
    },
    formatDate, escapeHtml, highlightText, showToast, renderShell,
    statusAr: status => statusAr[status] || status
  };
})();

window.altadamunReady.then((ready) => {
  if (!ready) return;
  const approvalRoute = ["CEO", "FNS"];
  const actionLabels = { Approve: "موافقة أولية", Reject: "رفض الطلب", Paid: "تم الصرف", NotPaid: "لم يُصرف" };

  function getCurrentApproverRole(request) {
    return request.financeVisible === true ? "FNS" : "CEO";
  }

  function canUserActOnRequest(user, request) {
    if (!user || !request) return false;
    return request.status === "Pending" && (user.role === "IT" || getCurrentApproverRole(request) === user.role);
  }

  function getVisibleRequests() {
    const user = IRS.getCurrentUser();
    const requests = IRS.getRequests();
    if (!user) return [];
    if (user.role === "FNS") return requests;
    return requests;
  }

  function formatAmount(amount, currency) {
    if (amount === undefined || amount === null || amount === "") return "-";
    const val = Number(amount);
    if (Number.isNaN(val)) return "-";
    if (currency === "IQD") return `${val.toLocaleString("ar-IQ")} د.ع`;
    return `$${val.toLocaleString("en-US")}`;
  }

  function statusText(status) {
    return IRS.statusAr(status);
  }

  function drawBarChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const labels = ["قيد الانتظار", "تم الصرف", "لم يُصرف", "مرفوض"];
    const colors = ["#bc8a00", "#4e9644", "#6f786a", "#d63649"];
    const max = Math.max(...data, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const h = canvas.height;
    const margin = 28;
    const barWidth = 64;
    const gap = 34;
    data.forEach((val, i) => {
      const x = margin + i * (barWidth + gap);
      const bh = ((h - 85) * val) / max;
      const y = h - 42 - bh;
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, y, barWidth, bh);
      ctx.fillStyle = "#27401c";
      ctx.font = "12px Cairo";
      ctx.fillText(labels[i], x, h - 18);
      ctx.fillText(String(val), x + 26, y - 8);
    });
  }

  function drawPieChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const total = data.reduce((sum, x) => sum + x, 0);
    const colors = ["#bc8a00", "#4e9644", "#6f786a", "#d63649"];
    const labels = ["قيد الانتظار", "تم الصرف", "لم يُصرف", "مرفوض"];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!total) {
      ctx.fillStyle = "#76906b";
      ctx.font = "14px Cairo";
      ctx.fillText("لا توجد بيانات بعد", 150, 120);
      return;
    }
    let start = -Math.PI / 2;
    data.forEach((val, i) => {
      const slice = (val / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(130, 120);
      ctx.arc(130, 120, 82, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      start += slice;
    });
    labels.forEach((label, i) => {
      ctx.fillStyle = colors[i];
      ctx.fillRect(245, 70 + i * 26, 12, 12);
      ctx.fillStyle = "#27401c";
      ctx.font = "12px Cairo";
      ctx.fillText(`${label} (${data[i]})`, 265, 80 + i * 26);
    });
  }

  function setupDashboardCardLinks() {
    document.querySelectorAll(".kpi-link").forEach((card) => {
      card.style.cursor = "pointer";
      card.title = "عرض الطلبات";
      card.addEventListener("click", () => {
        const status = card.getAttribute("data-status") || "all";
        location.href = `requests.html?status=${encodeURIComponent(status)}`;
      });
    });
  }

  function renderDashboard() {
    const k = document.getElementById("kpiGrid");
    if (!k) return;
    const v = getVisibleRequests();
    const pending = v.filter((r) => r.status === "Pending").length;
    const paid = v.filter((r) => r.status === "Paid").length;
    const notPaid = v.filter((r) => r.status === "NotPaid").length;
    const rejected = v.filter((r) => r.status === "Rejected").length;
    k.innerHTML = `<article class="kpi-card kpi-link" data-status="all"><div>إجمالي الطلبات</div><div class="kpi-value">${v.length}</div></article><article class="kpi-card kpi-link" data-status="Pending"><div>قيد الانتظار</div><div class="kpi-value">${pending}</div></article><article class="kpi-card kpi-link" data-status="Paid"><div>تم الصرف</div><div class="kpi-value">${paid}</div></article><article class="kpi-card kpi-link" data-status="NotPaid"><div>لم يُصرف</div><div class="kpi-value">${notPaid}</div></article><article class="kpi-card kpi-link" data-status="Rejected"><div>مرفوض</div><div class="kpi-value">${rejected}</div></article>`;

    const amountGrid = document.getElementById("amountGrid");
    if (amountGrid) {
      const paidOnly = v.filter((r) => r.status === "Paid");
      const usdTotal = paidOnly.filter((r) => r.currency === "USD").reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const iqdTotal = paidOnly.filter((r) => r.currency === "IQD").reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      amountGrid.innerHTML = `
        <article class="amount-card usd"><div class="amount-label">إجمالي مبالغ الدولار المصروفة (USD)</div><div class="amount-value">$${usdTotal.toLocaleString("en-US")}</div></article>
        <article class="amount-card iqd"><div class="amount-label">إجمالي مبالغ الدينار المصروفة (IQD)</div><div class="amount-value">${iqdTotal.toLocaleString("ar-IQ")} د.ع</div></article>
      `;
    }

    drawBarChart("barChart", [pending, paid, notPaid, rejected]);
    drawPieChart("pieChart", [pending, paid, notPaid, rejected]);
    setupDashboardCardLinks();

    const host = document.getElementById("recentActivity");
    if (!host) return;
    const recent = IRS.getLogs().slice(0, 6);
    host.innerHTML = recent.length
      ? recent.map((log) => `<div class="activity-item"><strong>${IRS.escapeHtml(log.user)}</strong> - ${IRS.escapeHtml(log.action)}<br><small>${IRS.formatDate(log.timestamp)}</small></div>`).join("")
      : "<div class='activity-item'>لا توجد أنشطة حتى الآن.</div>";
  }

  async function fileToDataUrl(path) {
    const res = await fetch(path);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function exportDecisionPdf(request) {
    if (!window.html2canvas || !window.jspdf) throw new Error("pdf libs missing");
    const { jsPDF } = window.jspdf;
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-99999px";
    wrapper.style.top = "0";
    wrapper.style.width = "900px";
    wrapper.style.background = "#fff";
    wrapper.style.padding = "30px";
    wrapper.style.direction = "rtl";
    wrapper.style.fontFamily = "Cairo, sans-serif";
    let logoHtml = "";
    try {
      const logoData = await fileToDataUrl("css/altadamun.svg");
      logoHtml = `<img src="${logoData}" style="width:120px;height:auto;object-fit:contain;" />`;
    } catch {
      logoHtml = `<div style="width:120px;height:70px;border:1px dashed #999;display:flex;align-items:center;justify-content:center;font-size:12px;">LOGO</div>`;
    }
    const decisionColor = request.status === "Rejected" ? "#d63649" : ["Paid", "Approved"].includes(request.status) ? "#2d6834" : "#12200b";
    wrapper.innerHTML = `
      <div style="border:2px solid #285c20;border-radius:12px;padding:22px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2ffd9;padding-bottom:14px;margin-bottom:18px;">
          <div>${logoHtml}</div>
          <div style="text-align:left"><h2 style="margin:0;color:#285c20;">شركة التضامن للتامين التجاري</h2><div style="font-size:14px;margin-top:6px;">مستند داخلي</div></div>
        </div>
        <h3 style="margin:0 0 14px 0;color:${decisionColor};">قرار الطلب: ${statusText(request.status)}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>رقم الطلب</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">#${request.id}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>نوع الطلب</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.requestType || "-")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>اسم الموظف</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.employeeName || "-")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>اسم مقدم الطلب</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.requesterName || "-")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>القسم</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.department || "-")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>المبلغ</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${formatAmount(request.amount, request.currency)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>تاريخ الإنشاء</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.formatDate(request.date)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>آخر تحديث</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.formatDate(request.updatedAt || request.date)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>تفاصيل الطلب</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.requestDetails || "-")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>الملاحظات</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.notes || "-")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e7ebe5;"><strong>ملاحظة القرار</strong></td><td style="padding:8px;border:1px solid #e7ebe5;">${IRS.escapeHtml(request.decisionNote || "-")}</td></tr>
        </table>
      </div>`;
    document.body.appendChild(wrapper);
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff" });
    wrapper.remove();
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const imgW = pageW - 12;
    const imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 6, 6, imgW, imgH);
    const statusName = statusText(request.status);
    pdf.save(`طلب-${request.id}-${statusName}.pdf`);
  }

  function canDeleteRequest(request) {
    const user = IRS.getCurrentUser();
    if (!user || !request) return false;
    if (user.role === "IT") return true;
    return false;
  }

  function renderRequestsTable() {
    const body = document.getElementById("requestsTableBody");
    if (!body) return;
    const search = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
    const status = document.getElementById("statusFilter")?.value || "all";
    let rows = getVisibleRequests();
    if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (search) {
      rows = rows.filter((r) =>
        String(r.requestType || "").toLowerCase().includes(search) ||
        String(r.requestDetails || "").toLowerCase().includes(search) ||
        String(r.employeeName || "").toLowerCase().includes(search) ||
        String(r.requesterName || "").toLowerCase().includes(search) ||
        String(r.department || "").toLowerCase().includes(search)
      );
    }

    body.innerHTML = rows.length
      ? rows.map((r) => {
        const exportBtn = `<button class="btn btn-sm btn-ghost js-export" data-id="${r.id}">PDF</button>`;
        const deleteBtn = canDeleteRequest(r) ? `<button class="btn btn-sm btn-danger js-delete" data-id="${r.id}">حذف</button>` : "";
        return `<tr><td>#${r.id}</td><td>${IRS.highlightText(r.requestType || "-", search)}</td><td>${IRS.highlightText(r.employeeName || "-", search)}</td><td>${IRS.highlightText(r.requesterName || "-", search)}</td><td>${IRS.highlightText(r.department || "-", search)}</td><td>${formatAmount(r.amount, r.currency)}</td><td><span class="badge ${r.status}">${IRS.statusAr(r.status)}</span></td><td>${IRS.highlightText(r.decisionNote || "-", search)}</td><td>${IRS.formatDate(r.date)}</td><td>${IRS.formatDate(r.updatedAt || r.date)}</td><td style="display:flex;gap:6px;white-space:nowrap;">${exportBtn}${deleteBtn}</td></tr>`;
      }).join("")
      : `<tr><td colspan="11">لا توجد نتائج.</td></tr>`;

    body.querySelectorAll(".js-export").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        const req = IRS.getRequests().find((x) => x.id === id);
        if (!req) return;
        try {
          await exportDecisionPdf(req);
          IRS.showToast(`تم تصدير الطلب #${id}`);
          const user = IRS.getCurrentUser();
          if (user) IRS.note("pdf_export");
        } catch {
          IRS.showToast("تعذر تصدير PDF", "error");
        }
      });
    });
    body.querySelectorAll(".js-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        const all = IRS.getRequests();
        const req = all.find((x) => x.id === id);
        if (!req || !canDeleteRequest(req)) return;
        if (!window.confirm(`هل تريد حذف الطلب #${id}؟`)) return;
        if (await IRS.mutateRequest({ ...req, deleted: true, updatedAt: new Date().toISOString() }, "deleted", req)) {
          IRS.showToast("تم حذف الطلب");
        }
      });
    });
  }

  function setupFilters() {
    const params = new URLSearchParams(location.search);
    const statusFromUrl = params.get("status");
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter && statusFromUrl && ["all", "Pending", "Approved", "Rejected", "Paid", "NotPaid"].includes(statusFromUrl)) {
      statusFilter.value = statusFromUrl;
    }
    document.getElementById("searchInput")?.addEventListener("input", renderRequestsTable);
    document.getElementById("statusFilter")?.addEventListener("change", renderRequestsTable);
  }

  function setupCreateRequest() {
    const form = document.getElementById("createRequestForm");
    if (!form) return;
    const reqNoInput = document.getElementById("requestNo");
    const statusInput = document.getElementById("status");
    const createdAtInput = document.getElementById("createdAt");
    const updatedAtInput = document.getElementById("updatedAt");
    function refreshMeta() {
      const now = new Date().toISOString();
      if (reqNoInput) reqNoInput.value = "يُحدد عند الحفظ";
      if (statusInput) statusInput.value = "\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631";
      if (createdAtInput) createdAtInput.value = IRS.formatDate(now);
      if (updatedAtInput) updatedAtInput.value = IRS.formatDate(now);
    }

    function normalizeWhatsappNumber(raw) {
      const cleaned = String(raw || "").replace(/[^\d+]/g, "");
      if (!cleaned) return "";
      if (cleaned.startsWith("+")) return cleaned.slice(1);
      if (cleaned.startsWith("00")) return cleaned.slice(2);
      return cleaned;
    }

    function buildWhatsappMessage(request) {
      return [
        "تم إنشاء طلب جديد في نظام شركة التضامن للتامين التجاري",
        `\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: #${request.id}`,
        `\u0646\u0648\u0639 \u0627\u0644\u0637\u0644\u0628: ${request.requestType}`,
        `\u0645\u0642\u062f\u0645 \u0627\u0644\u0637\u0644\u0628: ${request.requesterName}`,
        `\u0627\u0644\u0642\u0633\u0645: ${request.department}`,
        `\u0627\u0644\u062d\u0627\u0644\u0629: ${IRS.statusAr(request.status)}`
      ].join("\n");
    }

    function showWhatsappLink(phoneNumber, request) {
      const link = document.createElement("a");
      link.href = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(buildWhatsappMessage(request));
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "btn btn-ghost";
      link.textContent = "فتح واتساب لإرسال الإشعار";
      document.getElementById("whatsappAction")?.replaceChildren(link);
    }

    refreshMeta();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = IRS.getCurrentUser();
      const requestType = document.getElementById("requestType").value.trim();
      const receiptNo = document.getElementById("receiptNo").value.trim();
      const employeeName = document.getElementById("employeeName").value.trim();
      const requesterName = document.getElementById("requesterName").value.trim();
      const department = document.getElementById("department").value.trim();
      const amount = document.getElementById("amount").value.trim();
      const currency = document.getElementById("currency").value;
      const priority = document.getElementById("priority").value;
      const requestDetails = document.getElementById("requestDetails").value.trim();
      const notes = document.getElementById("notes").value.trim();
      const whatsappNumberRaw = document.getElementById("whatsappNumber")?.value.trim() || "";
      const sendWhatsapp = Boolean(document.getElementById("sendWhatsapp")?.checked);
      const requesterSignature = document.getElementById("requesterSignature").value.trim();
      const managerSignature = document.getElementById("managerSignature").value.trim();
      const files = Array.from(document.getElementById("attachments").files || []);
      const attachments = files.map(f => f.name);
      const whatsappNumber = normalizeWhatsappNumber(whatsappNumberRaw);
      const error = document.getElementById("createError");
      const btn = document.getElementById("createBtn");

      error.textContent = "";
      document.getElementById("whatsappAction")?.replaceChildren();
      if (!requestType || !employeeName || !requesterName || !department || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !currency || !priority || !requestDetails) {
        error.textContent = "\u064a\u0631\u062c\u0649 \u0625\u0643\u0645\u0627\u0644 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u0627\u0644\u0625\u0644\u0632\u0627\u0645\u064a\u0629.";
        return;
      }
      if (sendWhatsapp && !/^[0-9]{6,20}$/.test(whatsappNumber)) {
        error.textContent = "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0631\u0642\u0645 \u0648\u0627\u062a\u0633\u0627\u0628 \u0635\u062d\u064a\u062d \u0623\u0648 \u0625\u0644\u063a\u0627\u0621 \u062e\u064a\u0627\u0631 \u0627\u0644\u0625\u0634\u0639\u0627\u0631.";
        return;
      }

      if (files.length > 10 || new Set(attachments).size !== files.length || files.some(file => file.name.includes("/") || file.name.length > 200 || file.size > 10 * 1024 * 1024 || !["application/pdf", "image/png", "image/jpeg"].includes(file.type))) {
        error.textContent = "أرفق حتى 10 ملفات PDF أو صور PNG وJPEG بأسماء مختلفة، وبحجم لا يتجاوز 10 ميغابايت لكل ملف.";
        return;
      }
      btn.disabled = true;
      btn.textContent = "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644...";

      const now = new Date().toISOString();
      const random = crypto.getRandomValues(new Uint32Array(2));
      const id = (random[0] & 0xfffff) * 0x100000000 + random[1] + 1;
      const newRequest = {
        id,
        requestType,
        receiptNo,
        employeeName,
        requesterName,
        department,
        amount: Number(amount),
        currency,
        priority,
        requestDetails,
        notes,
        attachments,
        requesterSignature,
        managerSignature,
        title: requestType,
        description: requestDetails,
        createdBy: user.username,
        createdUid: user.uid,
        createdRole: user.role,
        financeVisible: false,
        approvalRoute,
        currentApprovalIndex: 0,
        approvalHistory: [],
        status: "Pending",
        date: now,
        updatedAt: now,
        whatsappNumber: whatsappNumber || null
      };

      let rollback;
      try {
        rollback = await IRSCloud.uploadFiles(files, id);
      } catch (failure) {
        console.error(failure);
        error.textContent = "تعذر رفع المرفقات. تحقق من الاتصال وخدمة التخزين.";
        btn.disabled = false;
        btn.textContent = "إرسال الطلب";
        return;
      }
      if (!await IRS.mutateRequest(newRequest, "created")) {
        await rollback();
        btn.disabled = false;
        btn.textContent = "إرسال الطلب";
        return;
      }
      IRS.showToast("تم إرسال الطلب بنجاح");
      if (sendWhatsapp) showWhatsappLink(whatsappNumber, newRequest);
      form.reset();
      refreshMeta();
      btn.disabled = false;
      btn.textContent = "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628";
    });
  }

  let modalState = { id: null, action: null };
  function setupApprovals() {
    const host = document.getElementById("approvalsList");
    if (!host) return;
    const modal = document.getElementById("confirmModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const detailsModal = document.getElementById("detailsModal");
    const detailsBody = document.getElementById("detailsBody");
    function openModal(id, action, title) {
      modalState = { id, action };
      const decisionNoteInput = document.getElementById("decisionNote");
      modalTitle.textContent = "تأكيد " + actionLabels[action];
      modalMessage.textContent = actionLabels[action] + " للطلب «" + title + "»؟";
      if (decisionNoteInput) decisionNoteInput.value = "";
      modal.classList.remove("hidden");
    }
    function closeModal() { modal.classList.add("hidden"); modalState = { id: null, action: null }; }
    function closeDetailsModal() { detailsModal?.classList.add("hidden"); }
    function openDetailsModal(req) {
      if (!detailsModal || !detailsBody) return;
      detailsBody.innerHTML = `<div class="details-grid"><div class="details-item"><strong>رقم الطلب</strong><span>#${req.id}</span></div><div class="details-item"><strong>الحالة</strong><span>${IRS.statusAr(req.status)}</span></div><div class="details-item"><strong>نوع الطلب</strong><span>${IRS.escapeHtml(req.requestType || "-")}</span></div><div class="details-item"><strong>الأولوية</strong><span>${IRS.escapeHtml(req.priority || "-")}</span></div><div class="details-item"><strong>اسم الموظف</strong><span>${IRS.escapeHtml(req.employeeName || "-")}</span></div><div class="details-item"><strong>اسم مقدم الطلب</strong><span>${IRS.escapeHtml(req.requesterName || "-")}</span></div><div class="details-item"><strong>القسم</strong><span>${IRS.escapeHtml(req.department || "-")}</span></div><div class="details-item"><strong>المبلغ</strong><span>${formatAmount(req.amount, req.currency)}</span></div><div class="details-item"><strong>تاريخ الإنشاء</strong><span>${IRS.formatDate(req.date)}</span></div><div class="details-item"><strong>آخر تحديث</strong><span>${IRS.formatDate(req.updatedAt || req.date)}</span></div></div><div class="details-item"><strong>تفاصيل الطلب</strong><span>${IRS.escapeHtml(req.requestDetails || "-")}</span></div><div class="details-item"><strong>الملاحظات</strong><span>${IRS.escapeHtml(req.notes || "-")}</span></div><div class="details-item"><strong>ملاحظة القرار</strong><span>${IRS.escapeHtml(req.decisionNote || "-")}</span></div><div class="details-grid"><div class="details-item"><strong>توقيع مقدم الطلب</strong><span>${IRS.escapeHtml(req.requesterSignature || "-")}</span></div><div class="details-item"><strong>توقيع المدير المفوض</strong><span>${IRS.escapeHtml(req.managerSignature || "-")}</span></div></div><div class="details-item"><strong>المرفقات</strong><span>${req.attachments.length ? "" : "-"}</span></div>`;
      for (const name of req.attachments) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-sm btn-ghost";
        button.textContent = name;
        button.addEventListener("click", async () => {
          try {
            const url = URL.createObjectURL(await IRSCloud.downloadFile(req, name));
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          } catch {
            IRS.showToast("تعذر تنزيل المرفق", "error");
          }
        });
        detailsBody.lastElementChild.append(button);
      }
      detailsModal.classList.remove("hidden");
    }
    async function applyDecision(withNote) {
      const { id, action } = modalState;
      if (!id || !action) return;
      const user = IRS.getCurrentUser();
      const reqs = IRS.getRequests();
      const prior = reqs.find((r) => r.id === id);
      const req = prior && { ...prior, approvalHistory: [...prior.approvalHistory] };
      if (!req) return closeModal();
      if (!canUserActOnRequest(user, req)) {
        IRS.showToast("You are not allowed to act on this request", "error");
        return closeModal();
      }
      const decisionNoteInput = document.getElementById("decisionNote");
      const decisionNote = withNote && decisionNoteInput ? decisionNoteInput.value.trim() : "";
      const currentRole = getCurrentApproverRole(req);
      const finance = currentRole === "FNS";
      if (!(finance ? ["Paid", "NotPaid"] : ["Approve", "Reject"]).includes(action)) return closeModal();
      req.approvalHistory.push({ role: currentRole, user: user.username, action, note: decisionNote, at: new Date().toISOString() });
      req.approvalRoute = approvalRoute;
      req.financeVisible = finance || action === "Approve";
      req.currentApprovalIndex = req.financeVisible ? 1 : 0;
      req.status = finance ? action : action === "Approve" ? "Pending" : "Rejected";
      req.decisionNote = decisionNote || req.decisionNote || "";
      const event = { Approve: "preapproved", Reject: "rejected", Paid: "paid", NotPaid: "not_paid" }[action];
      closeModal();
      if (!await IRS.mutateRequest(req, event, prior)) return;
      IRS.showToast(action === "Approve" ? "تمت الموافقة الأولية وأُرسل الطلب للمالية" : "أُغلق الطلب: " + actionLabels[action]);
      if (action !== "Approve") exportDecisionPdf(req).catch(() => IRS.showToast("تعذر تصدير PDF", "error"));
      renderApprovals();
      renderRequestsTable();
    }

    document.getElementById("modalCancel")?.addEventListener("click", closeModal);
    document.getElementById("modalSkip")?.addEventListener("click", () => applyDecision(false));
    document.getElementById("detailsClose")?.addEventListener("click", closeDetailsModal);
    detailsModal?.addEventListener("click", (e) => { if (e.target === detailsModal) closeDetailsModal(); });
    document.getElementById("modalConfirm")?.addEventListener("click", () => applyDecision(true));
    function renderApprovals() {
      const user = IRS.getCurrentUser();
      const allItems = IRS.getRequests();
      const items = allItems.filter((r) => {
        if (!user) return false;
        if (user.role === "IT") return true;
        if (r.status !== "Pending") return false;
        return getCurrentApproverRole(r) === user.role;
      });
      host.innerHTML = items.length
        ? items.map((r) => {
          const currentRole = getCurrentApproverRole(r);
          const stageLabel = r.status === "Pending" ? " | بانتظار " + (currentRole === "FNS" ? "المالية" : "موافقة الإدارة") : "";
          const actions = currentRole === "FNS" ? ["Paid", "NotPaid"] : ["Approve", "Reject"];
          const buttons = actions.map((action, i) => `<button class="btn btn-sm btn-${i ? "danger" : "success"}" data-id="${r.id}" data-title="${IRS.escapeHtml(r.requestType || "طلب")}" data-action="${action}">${actionLabels[action]}</button>`).join("");
          return `<div class="approval-item" data-open-id="${r.id}" style="cursor:pointer;"><strong>#${r.id} ${IRS.escapeHtml(r.requestType || "-")}</strong><div>${IRS.escapeHtml(r.requestDetails || "-")}</div><small>الموظف: ${IRS.escapeHtml(r.employeeName || "-")} | مقدّم الطلب: ${IRS.escapeHtml(r.requesterName || r.createdBy)} | القسم: ${IRS.escapeHtml(r.department || "-")} | المبلغ: ${formatAmount(r.amount, r.currency)} | الأولوية: ${IRS.escapeHtml(r.priority || "N/A")} | ${IRS.formatDate(r.date)}${stageLabel}${r.decisionNote ? ` | ملاحظة القرار: ${IRS.escapeHtml(r.decisionNote)}` : ""}</small><div style="margin-top:8px;"><span class="badge ${r.status}">${IRS.statusAr(r.status)}</span></div>${r.status === "Pending" ? `<div class="approval-actions">${buttons}</div>` : ""}</div>`;
        }).join("")
        : `<div class="approval-item">لا توجد طلبات بانتظار القرار.</div>`;
      host.querySelectorAll("button[data-id]").forEach((btn) => btn.addEventListener("click", () => openModal(Number(btn.dataset.id), btn.dataset.action, btn.dataset.title)));
      host.querySelectorAll("[data-open-id]").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          const id = Number(card.getAttribute("data-open-id"));
          const req = allItems.find((x) => x.id === id);
          if (req) openDetailsModal(req);
        });
      });
    }

    renderApprovals();
    window.addEventListener("altadamun:data", renderApprovals);
  }

  window.addEventListener("altadamun:data", () => { renderDashboard(); renderRequestsTable(); });
  renderDashboard();
  setupFilters();
  renderRequestsTable();
  setupCreateRequest();
  setupApprovals();
});

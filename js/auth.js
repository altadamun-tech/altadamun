(function () {
  const access = {
    "dashboard.html": ["IT", "FNS", "CEO"],
    "requests.html": ["IT", "FNS", "CEO"],
    "reports.html": ["IT", "FNS", "CEO"],
    "create.html": ["IT", "SNS"],
    "approvals.html": ["IT", "FNS", "CEO"],
    "logs.html": ["IT"]
  };
  const home = role => role === "SNS" ? "create.html" : role === "FNS" ? "approvals.html" : "dashboard.html";
  const form = document.getElementById("loginForm");
  const error = document.getElementById("loginError");
  const button = document.getElementById("loginBtn");
  if (button) button.disabled = true;

  function showLoginFailure(failure) {
    if (failure.code === "permission-denied") {
      error.textContent = "قواعد Firestore تمنع قراءة صلاحيات الحساب. تواصل مع مسؤول النظام.";
    } else if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-email"].includes(failure.code)) {
      error.textContent = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    } else {
      error.textContent = "تعذر الاتصال بخدمة المصادقة أو التحقق من الحساب.";
    }
  }

  async function enter(user) {
    const profile = await IRSCloud.profile(user);
    if (user && !profile) {
      await IRSCloud.signOut();
      if (error) error.textContent = "الحساب غير مفعّل أو لم تُعيّن له صلاحية.";
    }
    return profile;
  }

  window.altadamunReady = (async () => {
    try {
      if (!window.IRSCloud) throw new Error("Firebase unavailable");
      const user = await enter(await IRSCloud.firstUser());
      if (form) {
        if (user) {
          location.replace(home(user.role));
          return false;
        }
        button.disabled = false;
        form.addEventListener("submit", async event => {
          event.preventDefault();
          const email = globalThis.ALTADAMUN_LOGIN_EMAIL(document.getElementById("username").value);
          const password = document.getElementById("password").value;
          error.textContent = "";
          button.disabled = true;
          try {
            const credential = await IRSCloud.signIn(email, password);
            const user = await enter(credential.user);
            if (user) {
              IRS.note("login");
              location.replace(home(user.role));
            }
          } catch (failure) {
            showLoginFailure(failure);
          } finally {
            button.disabled = false;
          }
        });
        return false;
      }
      if (!user) {
        location.replace("index.html");
        return false;
      }
      const page = location.pathname.split("/").pop();
      if (!access[page]?.includes(user.role)) {
        location.replace(home(user.role));
        return false;
      }
      IRS.setUser(user);
      IRS.renderShell();
      IRSCloud.watchSession(active => {
        if (active?.uid !== user.uid) {
          IRS.setUser(null);
          location.replace("index.html");
        }
      });
      IRSCloud.watchProfile(user.uid, role => {
        if (role !== user.role) {
          IRS.setUser(null);
          location.replace("index.html");
        }
      }, IRS.showDataError);
      return IRS.loadData();
    } catch (failure) {
      if (error) showLoginFailure(failure);
      else IRS.showDataError(failure);
      return false;
    }
  })();
})();

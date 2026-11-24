window.altadamunReady.then((ready) => {
  if (!ready) return;
  const body = document.getElementById("logsTableBody");
  const clearBtn = document.getElementById("clearLogsBtn");
  const user = IRS.getCurrentUser();

  function renderLogs() {
    if (!body) return;
    const logs = IRS.getLogs();
    body.innerHTML = logs.length
      ? logs.map((log) => `<tr><td>${IRS.formatDate(log.timestamp)}</td><td>${IRS.escapeHtml(log.user)}</td><td>${IRS.escapeHtml(log.action)}</td></tr>`).join("")
      : `<tr><td colspan="3">لا توجد سجلات متاحة.</td></tr>`;
  }

  if (clearBtn) clearBtn.hidden = true;
  window.addEventListener("altadamun:data", renderLogs);
  renderLogs();
});

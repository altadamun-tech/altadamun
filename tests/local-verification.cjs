const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = name => fs.readFileSync(path.join(root, name), "utf8");
const run = (name, context) => vm.runInNewContext(source(name), context);
const html = () => ({ innerHTML: "", addEventListener() {} });

test("deployment contains every relative page dependency and excludes private sources", () => {
  const artifact = path.join(root, "dist", "pages");
  for (const dir of [".git", ".local-backup", "node_modules", "firestore.rules", "firebase.json"])
    assert.equal(fs.existsSync(path.join(artifact, dir)), false);
  for (const file of ["index.html", "dashboard.html", "create.html", "requests.html", "approvals.html",
    "reports.html", "logs.html", "hris/index.html"]) {
    const page = fs.readFileSync(path.join(artifact, file), "utf8");
    for (const [, url] of page.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^https?:/.test(url)) continue;
      assert.equal(url.startsWith("/"), false, file + " " + url);
      assert.ok(fs.existsSync(path.resolve(artifact, path.dirname(file), url)), file + " " + url);
    }
  }
});

test("empty database renders zero totals, with paid amounts separated by currency", async () => {
  const nodes = { kpiGrid: html(), amountGrid: html(), recentActivity: html() };
  let records = [];
  const listeners = {};
  const context = {
    window: { altadamunReady: Promise.resolve(true), addEventListener: (event, listener) => { listeners[event] = listener; } },
    document: { getElementById: id => nodes[id], querySelectorAll: () => [] },
    location: { search: "" }, URLSearchParams,
    IRS: { getCurrentUser: () => ({ role: "IT" }), getRequests: () => records, getLogs: () => [] }
  };
  await run("js/requests.js", context);
  assert.equal((nodes.kpiGrid.innerHTML.match(/>0</g) || []).length, 5);
  assert.match(nodes.amountGrid.innerHTML, /\$0/);
  assert.match(nodes.amountGrid.innerHTML, /[٠0] د\.ع/);
  records = [
    { status: "Paid", currency: "USD", amount: 55 },
    { status: "Pending", currency: "USD", amount: 77 },
    { status: "NotPaid", currency: "IQD", amount: 88 },
    { status: "Approved", currency: "USD", amount: 91 }
  ];
  listeners["altadamun:data"]();
  assert.match(nodes.amountGrid.innerHTML, /\$55/);
  assert.doesNotMatch(nodes.amountGrid.innerHTML, /77|88|91/);
});

test("account reads never consult legacy local caches and failures show an error", async () => {
  const content = { before(node) { this.message = node.textContent; } };
  const context = {
    window: {}, console: { error() {} },
    document: { getElementById: () => null, querySelector: () => content, createElement: () => ({ setAttribute() {} }) },
    localStorage: new Proxy({}, { get() { throw Error("Unexpected localStorage read"); } }),
    IRSCloud: { readRequests: async () => { throw Error("offline"); }, readLogs: async () => [] }
  };
  run("js/app.js", context);
  context.window.IRS.setUser({ role: "IT" });
  assert.equal(await context.window.IRS.loadData(), false);
  assert.match(content.message, /Firebase/);
});
test("financial reports apply status filters and escape labels", async () => {
  const nodes = {
    reportKpis: html(), deptBody: html(), typeBody: html(),
    statusSel: { ...html(), value: "Paid" }
  };
  const records = [
    { status: "Paid", currency: "USD", amount: 31, department: "<b>test</b>", date: "2026-11-24" },
    { status: "Pending", currency: "USD", amount: 99, department: "pending", date: "2026-11-24" }
  ];
  await run("js/reports.js", {
    window: { altadamunReady: Promise.resolve(true), addEventListener() {} },
    document: { getElementById: id => nodes[id] },
    IRS: { getRequests: () => records, escapeHtml: value => value.replaceAll("<", "&lt;") }
  });
  assert.match(nodes.reportKpis.innerHTML, /\$31/);
  assert.doesNotMatch(nodes.reportKpis.innerHTML, /99/);
  assert.match(nodes.deptBody.innerHTML, /&lt;b>/);
  assert.doesNotMatch(nodes.deptBody.innerHTML, /<b>/);
});

test("protected pages require a server-verified role before loading data", async () => {
  for (const [role, pathName, result, destination] of [
    [null, "dashboard.html", false, "index.html"],
    ["SNS", "approvals.html", false, "create.html"],
    ["FNS", "create.html", false, "approvals.html"],
    ["CEO", "create.html", false, "dashboard.html"],
    ["SNS", "create.html", true, null],
    ["IT", "dashboard.html", true, null]
  ]) {
    let redirected = null;
    let loaded = false;
    const context = {
      window: {}, document: { getElementById: () => null },
      location: { pathname: "/" + pathName, replace: path => { redirected = path; } },
      IRSCloud: { firstUser: async () => role ? { uid: "account" } : null,
        profile: async user => user ? { uid: user.uid, role } : null, watchSession() {}, watchProfile() {} },
      IRS: { setUser() {}, renderShell() {}, loadData: async () => { loaded = true; return true; } }
    };
    context.window.IRSCloud = context.IRSCloud;
    run("js/auth.js", context);
    assert.equal(await context.window.altadamunReady, result);
    assert.equal(redirected, destination);
    assert.equal(loaded, result);
  }
});

test("finance workflow usernames resolve to Firebase aliases without an entered email", () => {
  const context = {};
  run("js/firebase-config.js", context);
  for (const name of ["it", "ceo", "deputy", "fns", "sns"]) {
    assert.equal(context.ALTADAMUN_LOGIN_EMAIL(name.toUpperCase()), name + "@altadamun-accounts.firebaseapp.com");
  }
  assert.equal(context.ALTADAMUN_LOGIN_EMAIL(" IT_ "), "it@altadamun-accounts.firebaseapp.com");
  assert.equal(context.ALTADAMUN_LOGIN_EMAIL("altadamun.it@gmail.com"), "altadamun.it@gmail.com");
});

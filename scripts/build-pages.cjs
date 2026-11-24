const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const published = path.join(dist, "pages");
const hris = path.join(root, "hrims", "hris", "dist");
const pages = ["index", "dashboard", "create", "requests", "approvals", "reports", "logs"];
const scripts = ["app", "auth", "firebase-config", "firebase", "logs", "reports", "requests"];
const assets = [...pages.map(name => name + ".html"), ...scripts.map(name => "js/" + name + ".js"),
  "css/style.css", "css/altadamun.svg"];
assert.ok(fs.existsSync(path.join(hris, "index.html")), "Run npm --prefix hrims/hris run build first");
fs.mkdirSync(dist, { recursive: true });
const destination = fs.mkdtempSync(path.join(dist, "pages-stage-"));
for (const name of assets) {
  const target = path.join(destination, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, name), target);
}
fs.mkdirSync(path.join(destination, "hris", "assets"), { recursive: true });
fs.copyFileSync(path.join(hris, "index.html"), path.join(destination, "hris", "index.html"));
for (const name of fs.readdirSync(path.join(hris, "assets"))) {
  fs.copyFileSync(path.join(hris, "assets", name), path.join(destination, "hris", "assets", name));
}
fs.writeFileSync(path.join(destination, ".nojekyll"), "");
if (fs.existsSync(published)) {
  const backup = path.join(root, ".local-backup", "firebase-rebuild", "generated");
  fs.mkdirSync(backup, { recursive: true });
  const previous = fs.mkdtempSync(path.join(backup, "pages-"));
  fs.renameSync(published, path.join(previous, "dist"));
}
fs.renameSync(destination, published);
console.log("GitHub Pages artifact: dist/pages");

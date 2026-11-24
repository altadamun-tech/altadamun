const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 8000);
const pages = new Set(["index", "dashboard", "create", "requests", "approvals", "reports", "logs"]);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".json": "application/json; charset=utf-8"
};

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400).end(); return; }
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/hris/" || pathname === "/hris") pathname = "/hris/index.html";

  const base = pathname.slice(1);
  const isHris = /^hris\/(?:index\.html|assets\/[\w.-]+)$/.test(base);
  const isPage = base.endsWith(".html") && pages.has(base.slice(0, -5));
  const isAsset = /^(?:css\/[a-z.-]+\.(?:css|svg)|js\/[a-z.-]+\.js)$/.test(base);
  const file = isHris ? path.join(root, "hrims", "hris", "dist", base.slice(5))
    : isPage || isAsset ? path.join(root, base) : null;
  if (!file) { res.writeHead(404).end("Not found"); return; }

  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }).end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log("Local server running at http://127.0.0.1:" + port);
});

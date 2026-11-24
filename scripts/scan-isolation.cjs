const fs = require("node:fs");
const cp = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const paths = new Set(cp.execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean));
const findings = [];
const projectIds = new Set();
for (const file of paths) {
  if (file === "scripts/scan-isolation.cjs" || /^(?:tests\/firebase-emulator\.cjs|FIREBASE_REBUILD_REPORT\.md)$/.test(file)) continue;
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) continue;
  const buffer = fs.readFileSync(absolute);
  if (buffer.includes(0)) continue;
  const contents = buffer.toString("utf8");
  for (const [, id] of contents.matchAll(/\bprojectId:\s*["']([\w-]+)["']/g)) projectIds.add(id);
  if (/hr-ab-a7348|irs_state|irs_current_user|irs_requests|\/authDomain:[^\n]*hr-ab/.test(contents)) findings.push("legacy runtime reference: " + file);
  if (/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|["']?password["']?\s*:\s*["'][^"'\r\n]{7,}["']|["']private_key["']\s*:/.test(contents))
    findings.push("possible secret: " + file);
}
if ([...projectIds].some(id => id !== "altadamun-accounts")) findings.push("unexpected configured project");
if (findings.length) { console.error(findings.join("\n")); process.exitCode = 1; }
else console.log("Checked " + paths.size + " candidate paths; project IDs: " + [...projectIds].join(", "));

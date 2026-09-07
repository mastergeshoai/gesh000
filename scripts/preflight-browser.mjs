import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const candidates = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
const executable = candidates.find(existsSync);
let libraries = "";
try { libraries = execFileSync("ldconfig", ["-p"], { encoding: "utf8" }); } catch {}
const required = ["libnspr4.so", "libnss3.so"];
const missing = required.filter((lib) => !libraries.includes(lib));
console.log(JSON.stringify({ executable: executable ?? null, missing }, null, 2));
if (!executable || missing.length) {
  console.error("Browser runtime is not ready. Build with the provided Dockerfile or install Chromium dependencies.");
  process.exit(1);
}

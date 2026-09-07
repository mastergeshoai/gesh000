import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const requiredLibraries = ["libnspr4.so", "libnss3.so"];

export type RuntimeHealth = {
  ok: boolean;
  browser: { executable: string | null; available: boolean };
  libraries: Record<string, boolean>;
  missing: string[];
  checkedAt: string;
};

export async function inspectBrowserRuntime(): Promise<RuntimeHealth> {
  const executableCandidates = [
    process.env.PLAYWRIGHT_BROWSERS_PATH ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium*/chrome-linux/chrome` : "",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter(Boolean);
  let executable: string | null = null;
  for (const candidate of executableCandidates) {
    if (!candidate.includes("*")) {
      try { await access(candidate, constants.X_OK); executable = candidate; break; } catch {}
    }
  }
  const libraries = Object.fromEntries(await Promise.all(requiredLibraries.map(async (library) => {
    try {
      const { stdout } = await execFileAsync("ldconfig", ["-p"]);
      return [library, stdout.includes(library)];
    } catch { return [library, false]; }
  })));
  const missing = Object.entries(libraries).filter(([, present]) => !present).map(([name]) => name);
  return { ok: Boolean(executable) && missing.length === 0, browser: { executable, available: Boolean(executable) }, libraries, missing, checkedAt: new Date().toISOString() };
}

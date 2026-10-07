import { defineConfig } from "@playwright/test";
import { authFilePath } from "./lib/auth-file";
import { env } from "./lib/env";

/**
 * One suite, three browsers.
 *
 * Every *.spec.ts file under tests/ runs in every browser. There are no
 * per-suite projects, no tags, and no file numbering: a new test is picked up
 * just by creating tests/<area>/<name>.spec.ts.
 *
 * Execution order (workers: 1 → strictly sequential):
 *
 *   setup-chromium → chromium → setup-firefox → firefox → setup-webkit → webkit
 *
 * Each browser project depends on the previous one, which enforces
 * Chromium → Firefox → WebKit ordering even if `workers` is ever raised.
 */
const browsers = ["chromium", "firefox", "webkit"] as const;

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html"]],
  outputDir: "test-results/",

  use: {
    baseURL: env.baseURL,
    headless: true,
    launchOptions: {
      // Pause between actions; helps against slow, AJAX-heavy JSF pages.
      // Override with SLOW_MO=0 in .env for faster local iteration.
      slowMo: env.slowMo,
    },
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
    video: { mode: "retain-on-failure", size: { width: 1280, height: 720 } },
    screenshot: { mode: "only-on-failure", fullPage: true },
  },

  projects: browsers.flatMap((browserName, i) => [
    {
      name: `setup-${browserName}`,
      testMatch: /auth\.setup\.ts/,
      use: { browserName },
    },
    {
      name: browserName,
      use: { browserName, storageState: authFilePath(browserName) },
      dependencies: [`setup-${browserName}`, ...(i > 0 ? [browsers[i - 1]] : [])],
    },
  ]),
});

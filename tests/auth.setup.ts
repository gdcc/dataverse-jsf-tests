import fs from "fs";
import path from "path";
import { test as setup } from "@playwright/test";
import { authFilePath } from "../lib/auth-file";
import { env } from "../lib/env";
import { getLoginAdapter } from "../lib/login-adapters";

/**
 * Logs in once per browser and saves the session to
 * playwright/.auth/<endpoint>-<browser>.json, which every test in that
 * browser's project then starts from (see playwright.config.ts).
 *
 * If a saved session is still valid, login (and any Duo push) is skipped.
 */
setup("Authenticate", async ({ page, browserName }) => {
  const authFile = authFilePath(browserName);
  const { username, password, fullName } = env.credentials;

  if (fs.existsSync(authFile)) {
    const saved = JSON.parse(fs.readFileSync(authFile, "utf-8"));
    await page.context().addCookies(saved.cookies);
  }

  await page.goto("/");

  // Dismiss the cookie-consent banner some installations show.
  const cookieConsent = page.locator('button[data-role="all"]');
  if (await cookieConsent.isVisible()) {
    await cookieConsent.click();
  }

  // Scoped to the navbar's user menu so the name appearing in, say, a
  // dataset title can't produce a false positive.
  const alreadyLoggedIn = await page
    .locator("#userDisplayInfoTitle")
    .getByText(fullName, { exact: false })
    .isVisible();

  if (!alreadyLoggedIn) {
    // Some installations render two "Log In" links (navbar + mega-menu).
    await page.getByRole("link", { name: "Log In", exact: true }).first().click({ force: true });
    await getLoginAdapter().login(page, { username, password });
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});

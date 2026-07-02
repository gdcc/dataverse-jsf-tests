import type { Page } from "@playwright/test";
import type { LoginAdapter, LoginCredentials } from "./types";

/**
 * BuiltinAdapter
 *
 * Logs in using Dataverse's **built-in** Username/Email form.
 *
 * Flow (on /loginpage.xhtml):
 *   1. Click the "Username/Email" button to reveal the built-in credential form
 *   2. Fill #loginForm:credentialsContainer:0:credValue  (username / email)
 *   3. Fill #loginForm:credentialsContainer:1:sCredValue (password)
 *   4. Click the "Log In" button
 *   5. Wait until the login page URL is gone
 *
 * NOTE: credentials for this adapter are not currently verified against a
 * live instance.  The selectors were provided directly from the Dataverse
 * login page source.
 */
export class BuiltinAdapter implements LoginAdapter {
  async login(page: Page, credentials: LoginCredentials): Promise<void> {
    await page.waitForURL(/loginpage/);

    // Reveal the built-in username/password form
    await page.getByRole("button", { name: "Username/Email" }).click();

    await page
      .locator("#loginForm\\:credentialsContainer\\:0\\:credValue")
      .fill(credentials.username);

    await page
      .locator("#loginForm\\:credentialsContainer\\:1\\:sCredValue")
      .fill(credentials.password);

    await page.getByRole("button", { name: "Log In" }).click();

    // Wait until we have left the login page
    await page.waitForURL((url) => !/loginpage/.test(url.href), {
      timeout: 30_000,
    });
  }
}

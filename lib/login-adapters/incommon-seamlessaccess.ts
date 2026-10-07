import type { Page } from "@playwright/test";
import { env } from "../env";
import { handleDuoMfa } from "./duo-mfa";
import { submitIdpCredentials } from "./idp-credentials";
import type { LoginAdapter, LoginCredentials } from "./types";

/**
 * InCommonSeamlessAccessAdapter
 *
 * Logs in via the InCommon / SeamlessAccess waypoint behind the Dataverse
 * login page's "Log In via Your Institution" link.
 *
 * Flow:
 *   1. Click "Log In via Your Institution"
 *   2. wayfinder.incommon.org → click the SeamlessAccess button
 *   3. service.seamlessaccess.org → search for the institution, pick it
 *   4. Submit username/password on the institution's IdP login page
 *   5. Handle an optional Duo MFA challenge
 *
 * Required env vars:
 *   INCOMMON_INSTITUTION_SEARCH  Text typed into the SeamlessAccess search box
 *   INCOMMON_INSTITUTION_LINK    Accessible name (or part of it) of the result
 */
export class InCommonSeamlessAccessAdapter implements LoginAdapter {
  async login(page: Page, credentials: LoginCredentials): Promise<void> {
    const { institutionSearch, institutionLink } = env.sso;

    await page.waitForURL(/loginpage/);
    await page.getByRole("link", { name: /Log In via Your Inst/i }).click();

    await page.waitForURL(/wayfinder\.incommon\.org/);
    await page.locator("a.d-flex.sa-button").click();

    await page.waitForURL(/service\.seamlessaccess\.org/);
    await page.locator("#searchinput").pressSequentially(institutionSearch);
    await page.getByRole("link", { name: institutionLink }).click();
    await page.waitForURL((url) => !/seamlessaccess\.org|incommon\.org/.test(url.host));

    const idpHost = await submitIdpCredentials(page, credentials);
    await handleDuoMfa(page, idpHost);
  }
}

import type { Page } from "@playwright/test";
import type { LoginCredentials } from "./types";

/**
 * Fills the username/password form on a Shibboleth identity provider's
 * login page and submits it.
 *
 * Handles both common layouts: username and password on one page, or a
 * username page with a "Next" button (#nextBtn) before the password.
 *
 * Returns the IdP's host name so callers can wait for the browser to leave it.
 */
export async function submitIdpCredentials(
  page: Page,
  credentials: LoginCredentials,
): Promise<string> {
  const username = page.locator("#username");
  await username.waitFor();
  const idpHost = new URL(page.url()).host;

  await username.fill(credentials.username);
  const next = page.locator("#nextBtn");
  if (await next.isVisible()) {
    await next.click();
  }
  await page.locator("#password").fill(credentials.password);
  await page.locator('#submitBtn, button[type="submit"], input[type="submit"]').first().click();

  return idpHost;
}

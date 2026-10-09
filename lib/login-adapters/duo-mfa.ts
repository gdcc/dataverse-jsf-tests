import type { Page } from "@playwright/test";

/**
 * Shared Duo MFA challenge handler.
 *
 * After an identity provider accepts the username and password, Duo may
 * intercept with a push/device-trust challenge. Call this from any adapter
 * whose IdP is Duo-backed. Both outcomes are handled:
 *
 *   (A) "Yes, trust this browser" appears → click it and wait
 *   (B) Device is already trusted         → Duo auto-redirects, nothing to do
 *
 * @param idpHost  Host name of the IdP login page, as returned by
 *                 submitIdpCredentials().
 */
export async function handleDuoMfa(page: Page, idpHost: string): Promise<void> {
  const awayFrom = (url: URL, ...hosts: string[]) =>
    !hosts.some((host) => url.host === host || url.host.endsWith(`.${host}`));

  await page.waitForURL((url) => awayFrom(url, idpHost), { timeout: 30_000 });

  if (!/duosecurity/.test(page.url())) return;

  const backToApp = (url: URL) => awayFrom(url, idpHost, "duosecurity.com");
  const yesBtn = page.getByText("Yes");
  const yesAppeared = await Promise.race([
    yesBtn.waitFor({ state: "visible", timeout: 30_000 }).then(() => true),
    page.waitForURL(backToApp, { timeout: 30_000 }).then(() => false),
  ]);

  if (yesAppeared) {
    await yesBtn.click();
    await page.waitForURL(backToApp, { timeout: 60_000 });
  }
}

import type { Page } from "@playwright/test";
import { env } from "../env";
import { handleDuoMfa } from "./duo-mfa";
import { submitIdpCredentials } from "./idp-credentials";
import type { LoginAdapter, LoginCredentials } from "./types";

/**
 * ShibbolethDirectAdapter
 *
 * Logs in via a Shibboleth IdP dropdown embedded on the Dataverse login page
 * itself (`#idpSelectSelector`), with no discovery-service waypoint.
 *
 * Flow:
 *   1. Pick IDP_SELECTOR_VALUE in #idpSelectSelector → Continue
 *   2. Submit username/password on the IdP's login page
 *   3. Handle an optional Duo MFA challenge
 *
 * Required env var: IDP_SELECTOR_VALUE — the <option> value (the IdP's
 * entity ID) to select.
 */
export class ShibbolethDirectAdapter implements LoginAdapter {
  async login(page: Page, credentials: LoginCredentials): Promise<void> {
    await page.locator("#idpSelectSelector").selectOption(env.sso.idpSelectorValue);
    await page.getByRole("button", { name: "Continue" }).click({ force: true });

    const idpHost = await submitIdpCredentials(page, credentials);
    await handleDuoMfa(page, idpHost);
  }
}

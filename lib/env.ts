/**
 * Single source of truth for everything the suite reads from the
 * environment. Tests and page objects import `env` instead of touching
 * `process.env` directly, so every knob is documented in one place (and in
 * .env.example) and every default is defined exactly once.
 *
 * Values are read lazily (getters) so that importing this module never throws
 * — only the code path that actually needs a missing variable fails, with a
 * message naming it.
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Add it to your .env file (see .env.example).`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function flag(name: string): boolean {
  return optional(name)?.toLowerCase() === "true";
}

/** Strips a trailing slash so `${rootCollection}/...` never doubles up. */
function normalizePath(p: string): string {
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

export const env = {
  /** The Dataverse instance under test, e.g. https://dataverse.example.edu */
  get baseURL(): string | undefined {
    return optional("BASE_URL");
  },

  /**
   * Path of the collection the suite works inside. Tests create their own
   * child collections and datasets beneath it and clean them up afterwards.
   * Defaults to a stock Dataverse install's top-level collection.
   */
  get rootCollection(): string {
    return normalizePath(optional("ROOT_DATAVERSE") ?? "/dataverse/root");
  },

  get credentials() {
    return {
      username: required("DV_USERNAME"),
      password: required("DV_PASSWORD"),
      fullName: required("DV_FULL_NAME"),
    };
  },

  get loginAdapter(): string {
    return required("LOGIN_ADAPTER");
  },

  /** Settings for the single-sign-on login adapters (see lib/login-adapters/). */
  sso: {
    /** shibboleth-direct: the <option> value to pick in #idpSelectSelector. */
    get idpSelectorValue(): string {
      return required("IDP_SELECTOR_VALUE");
    },
    /** incommon-seamlessaccess: text typed into the institution search box. */
    get institutionSearch(): string {
      return required("INCOMMON_INSTITUTION_SEARCH");
    },
    /** incommon-seamlessaccess: accessible name (or part of it) of the result to click. */
    get institutionLink(): string {
      return required("INCOMMON_INSTITUTION_LINK");
    },
  },

  /**
   * Optional features that are not present on every Dataverse deployment.
   * Tests that need one call `test.skip(!env.features.x, ...)`.
   */
  features: {
    get customLicense(): boolean {
      return flag("CUSTOM_LICENSE_ENABLED");
    },
    get locallyFair(): boolean {
      return flag("LOCALLY_FAIR_ENABLED");
    },
  },

  /** Milliseconds Playwright waits between actions. */
  get slowMo(): number {
    const raw = optional("SLOW_MO");
    return raw === undefined ? 2500 : Number(raw);
  },
};

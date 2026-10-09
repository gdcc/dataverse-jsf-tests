import { env } from "./env";

/**
 * Per-endpoint, per-browser file the logged-in session is saved to.
 *
 * Example:
 *   BASE_URL=https://dataverse.example.edu, browser="firefox"
 *   → playwright/.auth/dataverse-example-edu-firefox.json
 *
 * Switching BASE_URL between instances, or running several browsers, never
 * overwrites another session — each endpoint + browser keeps its own cookies.
 */
export function authFilePath(browser: string): string {
  const slug = (env.baseURL ?? "default")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  return `playwright/.auth/${slug}-${browser}.json`;
}

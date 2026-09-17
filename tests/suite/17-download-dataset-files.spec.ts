import { test, expect } from "@playwright/test";
const process = (globalThis as any).process;

/**
 * @tags @21cfr
 *
 * 21 CFR Part 11 — Test #15
 * Opens the first dataset in the results table, selects all files, triggers
 * a download, and verifies the downloaded filename is non-null.
 */

test(
  "21 CFR: Download dataset files",
  { tag: ["@21cfr"] },
  async ({ page }) => {
    await page.goto(process.env.ROOT_DATAVERSE ?? "/");

    await page
      .locator("#resultsTable tbody tr")
      .first()
      .locator("a")
      .first()
      .click();

    await page.locator(".ui-chkbox-all").first().click();

    // Use page.evaluate(fetch) to request the download directly from within the
    // browser — inherits auth cookies and bypasses browser-specific handling
    // (download vs. open inline vs. navigate). Works on all three browsers.
    const downloadHref = await page
      .getByRole("link", { name: "Download" })
      .getAttribute("href");
    const downloadResult = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      return {
        status: resp.status,
        disposition: resp.headers.get("content-disposition") ?? "",
      };
    }, downloadHref!);
    console.log(`Downloaded file: ${downloadResult.disposition}`);
    expect(downloadResult.status).toBe(200);
    expect(downloadResult.disposition).not.toBe("");
  },
);

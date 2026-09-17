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

    // Use waitForResponse instead of waitForEvent("download") — WebKit opens
    // files inline rather than triggering a download event. Intercepting at
    // the network layer works identically on all three browsers.
    const downloadResponsePromise = page.waitForResponse(
      async (resp) =>
        resp.status() === 200 && !!resp.headers()["content-disposition"],
      { timeout: 30000 },
    );
    await page.getByRole("link", { name: "Download" }).click();
    const downloadResponse = await downloadResponsePromise;
    const fileName = downloadResponse.headers()["content-disposition"] ?? "";
    console.log(`Downloaded file: ${fileName}`);
    expect(downloadResponse.status()).toBe(200);
  },
);

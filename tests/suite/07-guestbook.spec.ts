import { test, expect } from "@playwright/test";
const process = (globalThis as any).process;

/**
 * @tags @standard
 *
 * Standard — Dataset Guestbooks
 * Creates a guestbook with all account-info fields required and a
 * multiple-choice custom question, downloads all responses (CSV),
 * then deletes the guestbook.
 */

test(
  "Section: Dataset Guestbooks – create, download responses, delete",
  { tag: ["@standard"] },
  async ({ page }) => {
    const suffix = Date.now().toString(36);
    const guestbookName = `Playwright Test Guestbook ${suffix}`;

    await page.goto(process.env.ROOT_DATAVERSE ?? "/");
    await page.getByText("Edit").click();
    await page.getByText("Dataset Guestbooks").click();

    // ── Create ────────────────────────────────────────────────────────────
    await page.getByRole("link", { name: "Create Dataset Guestbook" }).click();

    // Name
    await page
      .locator('[id="guestbookForm:guestbookName"]')
      .fill(guestbookName);

    // Require all four account-info fields
    await page.locator('[id="guestbookForm:nameRequiredCb"]').check();
    await page.locator('[id="guestbookForm:emailRequiredCb"]').check();
    await page.locator('[id="guestbookForm:institutionRequiredCb"]').check();
    await page.locator('[id="guestbookForm:positionRequiredCb"]').check();

    // Set custom question type to Multiple Choice (triggers AJAX re-render)
    await page
      .locator('[id="guestbookForm:j_idt218:0:questionOptions"]')
      .selectOption("options");
    // Wait for the first option input to appear before continuing
    await page
      .locator('[id="guestbookForm:j_idt218:0:j_idt236:0:responseText"]')
      .waitFor();

    // Question text
    await page
      .locator('[id="guestbookForm:j_idt218:0:questionText"]')
      .fill("How did you find this dataset?");

    // First option
    await page
      .locator('[id="guestbookForm:j_idt218:0:j_idt236:0:responseText"]')
      .fill("Web Search");

    // Add second option — .nolabel-field-btn distinguishes the option-level
    // Add button from the question-level Add button (.compound-field-btn)
    await page.locator('.nolabel-field-btn[data-original-title="Add"]').click();
    await page
      .locator('[id="guestbookForm:j_idt218:0:j_idt236:1:responseText"]')
      .waitFor();

    // Second option
    await page
      .locator('[id="guestbookForm:j_idt218:0:j_idt236:1:responseText"]')
      .fill("Colleague Recommendation");

    // Submit
    await page.locator('[name="guestbookForm:j_idt260"]').click();
    await page.waitForLoadState("domcontentloaded");

    // ── Download all responses ────────────────────────────────────────────
    // Use page.evaluate(fetch) to request the CSV directly from within the
    // browser — inherits auth cookies and bypasses browser-specific handling
    // (download vs. open inline vs. navigate). Works on all three browsers.
    const tbody = page.locator(
      '[id="manageGuestbooksForm:allGuestbooks_data"]',
    );
    const guestbookRow = tbody.locator("tr").filter({
      has: page.locator('td[role="gridcell"]', { hasText: guestbookName }),
    });
    const downloadHref = await guestbookRow
      .locator('[id$="downloadResponsesByDvAndGuestbook"]')
      .getAttribute("href");
    const downloadResult = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      return {
        status: resp.status,
        disposition: resp.headers.get("content-disposition") ?? "",
      };
    }, downloadHref!);
    console.log(`Guestbook CSV: ${downloadResult.disposition}`);
    expect(downloadResult.status).toBe(200);

    // ── Delete ────────────────────────────────────────────────────────────
    await guestbookRow.locator('[data-original-title="Delete"]').click();
    await page.locator('[id="manageGuestbooksForm:j_idt251"]').click();
    await page.waitForLoadState("networkidle");
  },
);

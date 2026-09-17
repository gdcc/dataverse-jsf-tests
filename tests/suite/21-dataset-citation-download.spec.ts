import { test, expect } from "@playwright/test";
const process = (globalThis as any).process;

/**
 * @tags @standard
 *
 * Standard Suite — Test #21
 * Creates its own unpublished dataset, verifies the DOI is present in the
 * citation block, then downloads all three citation formats: EndNote XML,
 * RIS, and BibTeX.
 */

test(
  "Standard: Dataset Citation Download (DOI + EndNote + RIS + BibTeX)",
  { tag: ["@standard"] },
  async ({ page }) => {
    const suffix = Date.now().toString(36);

    // ── Step 1: Create a fresh unpublished dataset ────────────────────────────
    await page.goto(process.env.ROOT_DATAVERSE ?? "/");
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "Add Data" }).click();
    await page.getByRole("link", { name: "New Dataset" }).click();
    await page.waitForLoadState("domcontentloaded");

    await page
      .locator('[id$=":0:inputText"]')
      .first()
      .fill(`Citation Download Test ${suffix}`);
    await page
      .locator('[id$=":0:description"]')
      .first()
      .fill("Dataset for citation download test.");
    await page
      .locator(".ui-selectcheckboxmenu-multiple-container")
      .first()
      .click();
    await page
      .locator(".ui-selectcheckboxmenu-items-wrapper")
      .first()
      .getByText("Chemistry")
      .click();
    await page
      .locator(".ui-selectcheckboxmenu-multiple-container")
      .first()
      .click();

    await page.getByRole("button", { name: "Save Dataset" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByText("This dataset has been created."),
    ).toBeVisible();

    // ── Step 2: Verify DOI is present in the citation block ───────────────────
    await expect(page.getByText("https://doi.org/")).toBeVisible();

    // ── Step 3: Open Cite Dataset dropdown ───────────────────────────────────
    await page.locator("button.downloadCitation").click();

    // ── Step 4: Download EndNote XML ─────────────────────────────────────────
    // Use waitForResponse instead of waitForEvent("download") — WebKit opens
    // files inline rather than triggering a download event. Intercepting at
    // the network layer works identically on all three browsers.
    const endnoteResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes("endnote") && resp.status() === 200,
      { timeout: 30000 },
    );
    await page.locator('[id="datasetForm:endNoteLink"]').click();
    const endnoteResponse = await endnoteResponsePromise;
    const endnoteContent = await endnoteResponse.text();
    console.log(`EndNote download: ${endnoteResponse.url()}`);
    // EndNote XML must contain the XML wrapper and a dataset record
    expect(endnoteContent).toContain("<?xml");
    expect(endnoteContent).toContain("<records>");
    expect(endnoteContent).toContain("<record>");
    expect(endnoteContent).toContain("doi");

    // ── Step 5: Re-open Cite Dataset dropdown for next format ─────────────────
    await page.locator("button.downloadCitation").click();

    // ── Step 6: Download RIS ──────────────────────────────────────────────────
    const risResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes("ris") && resp.status() === 200,
      { timeout: 30000 },
    );
    await page.locator('[id="datasetForm:risLink"]').click();
    const risResponse = await risResponsePromise;
    const risContent = await risResponse.text();
    console.log(`RIS download: ${risResponse.url()}`);
    // RIS format must contain the type tag and end-of-record marker
    expect(risContent).toContain("TY  - DATA");
    expect(risContent).toContain("DO  - doi:");
    expect(risContent).toContain("ER  -");

    // ── Step 7: Re-open Cite Dataset dropdown for BibTeX ─────────────────────
    await page.locator("button.downloadCitation").click();

    // ── Step 8: BibTeX opens in a new tab ─────────────────────────────────────
    // BibTeX uses target="_blank" — intercept the new page rather than a download
    const [bibTab] = await Promise.all([
      page.context().waitForEvent("page"),
      page.locator('[id="datasetForm:bibLink"]').click(),
    ]);
    await bibTab.waitForLoadState("domcontentloaded");
    const bibContent = await bibTab.content();
    console.log(`BibTeX tab URL: ${bibTab.url()}`);
    // BibTeX must start with @data entry and contain a DOI
    expect(bibContent).toContain("@data");
    expect(bibContent).toContain("doi = {");
    expect(bibContent).toContain("url = {https://doi.org/");
    await bibTab.close();
  },
);

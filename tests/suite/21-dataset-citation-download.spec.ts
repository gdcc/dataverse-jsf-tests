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
    // Use page.evaluate(fetch) to request the file directly from within the
    // browser — this inherits auth cookies and bypasses all browser differences
    // in how files are handled (download, open inline, navigate). Works on all
    // three browsers without relying on download events or response listeners.
    const endnoteHref = await page
      .locator('[id="datasetForm:endNoteLink"]')
      .getAttribute("href");
    const endnoteResult = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      return { status: resp.status, body: await resp.text() };
    }, endnoteHref!);
    console.log(`EndNote download: status=${endnoteResult.status}`);
    expect(endnoteResult.status).toBe(200);
    // EndNote XML must contain the XML wrapper and a dataset record
    expect(endnoteResult.body).toContain("<?xml");
    expect(endnoteResult.body).toContain("<records>");
    expect(endnoteResult.body).toContain("<record>");
    expect(endnoteResult.body).toContain("doi");

    // ── Step 5: Re-open Cite Dataset dropdown for next format ─────────────────
    await page.locator("button.downloadCitation").click();

    // ── Step 6: Download RIS ──────────────────────────────────────────────────
    const risHref = await page
      .locator('[id="datasetForm:risLink"]')
      .getAttribute("href");
    const risResult = await page.evaluate(async (url) => {
      const resp = await fetch(url);
      return { status: resp.status, body: await resp.text() };
    }, risHref!);
    console.log(`RIS download: status=${risResult.status}`);
    expect(risResult.status).toBe(200);
    // RIS format must contain the type tag and end-of-record marker
    expect(risResult.body).toContain("TY  - DATA");
    expect(risResult.body).toContain("DO  - doi:");
    expect(risResult.body).toContain("ER  -");

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

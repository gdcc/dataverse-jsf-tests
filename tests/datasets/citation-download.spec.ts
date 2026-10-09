import fs from "fs";
import { expect, test, type Page } from "../../lib/fixtures";

/** Opens the Cite Dataset menu and waits for a given entry to be clickable. */
async function openCiteMenu(page: Page, entryId: string) {
  await page.locator("button.downloadCitation").click();
  await expect(page.locator(`[id="datasetForm:${entryId}"]`)).toBeVisible();
}

async function downloadCitation(page: Page, entryId: string): Promise<string> {
  await openCiteMenu(page, entryId);
  const download = page.waitForEvent("download");
  await page.locator(`[id="datasetForm:${entryId}"]`).click();
  return fs.readFileSync((await (await download).path())!, "utf-8");
}

test("Citation: DOI shown, EndNote/RIS/BibTeX downloads", async ({
  page,
  browserName,
  createDataset,
}) => {
  test.skip(browserName === "webkit", "WebKit opens XML/RIS inline instead of downloading");

  await createDataset();
  await expect(page.getByText("https://doi.org/")).toBeVisible();

  await test.step("EndNote XML", async () => {
    const xml = await downloadCitation(page, "endNoteLink");
    expect(xml).toContain("<?xml");
    expect(xml).toContain("<records>");
    expect(xml).toContain("<record>");
    expect(xml).toContain("doi");
  });

  await test.step("RIS", async () => {
    const ris = await downloadCitation(page, "risLink");
    expect(ris).toContain("TY  - DATA");
    expect(ris).toContain("DO  - doi:");
    expect(ris).toContain("ER  -");
  });

  await test.step("BibTeX (opens in a new tab)", async () => {
    await openCiteMenu(page, "bibLink");
    const [tab] = await Promise.all([
      page.context().waitForEvent("page"),
      page.locator('[id="datasetForm:bibLink"]').click(),
    ]);
    await tab.waitForLoadState("domcontentloaded");
    const bib = await tab.content();
    await tab.close();
    expect(bib).toContain("@data");
    expect(bib).toContain("doi = {");
    expect(bib).toContain("url = {https://doi.org/");
  });
});

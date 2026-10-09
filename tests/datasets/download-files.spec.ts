import { expect, test } from "../../lib/fixtures";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { files } from "../../lib/test-data";

test("Download all of a dataset's files", async ({ page, createDataset }) => {
  // Two files: with two or more selected, Dataverse offers a single zip
  // "Download" button.
  await createDataset({ files: [files.sampleText, files.sampleText2] });
  const dataset = new DatasetPage(page);
  await dataset.selectAllFiles();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBeTruthy();
});

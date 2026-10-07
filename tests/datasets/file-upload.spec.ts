import { expect, test } from "../../lib/fixtures";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { files } from "../../lib/test-data";

/**
 * Upload a batch of files while creating a dataset and check every one of
 * them is listed afterwards. Tabular-ingest formats get their own test so an
 * ingest failure can't mask a plain-upload failure (or vice versa).
 */
const cases = [
  {
    name: "non-ingest formats",
    upload: [files.csv, files.zip, files.pdf, files.rScript, files.roCrate],
    // demo-archive.zip is unpacked on upload into readme.txt and data.csv.
    expected: [
      "sample-data.csv",
      "readme.txt",
      "data.csv",
      "demo-document.pdf",
      "demo-code.R",
      "ro-crate-metadata.json",
    ],
  },
  {
    name: "tabular ingest formats",
    upload: [files.stata, files.rData, files.spss, files.excel],
    expected: ["demo-data.dta", "demo-data.RData", "demo-data.sav", "demo-data.xlsx"],
  },
];

for (const { name, upload, expected } of cases) {
  test(`File upload: ${name}`, async ({ page, createDataset }) => {
    await createDataset({ files: upload });
    const filesTable = new DatasetPage(page).filesTable;
    for (const filename of expected) {
      await expect(filesTable.getByRole("link", { name: filename, exact: true })).toBeVisible();
    }
  });
}

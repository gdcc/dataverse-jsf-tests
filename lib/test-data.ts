/**
 * Absolute paths to the fixture files in tests/test-data/.
 *
 * Always reference uploads through this module rather than with a
 * "tests/..." string: relative paths resolve against whatever directory
 * `npx playwright test` was launched from, absolute ones don't.
 */
import path from "path";

const root = path.resolve(__dirname, "..", "tests", "test-data");

export const testFile = (name: string): string => path.join(root, name);

export const files = {
  sampleText: testFile("sample-dataset-file.txt"),
  sampleText2: testFile("sample-dataset-file-2.txt"),
  replacementText: testFile("replaced-sample-dataset-file.txt"),
  csv: testFile("sample-data.csv"),
  zip: testFile("demo-archive.zip"),
  pdf: testFile("demo-document.pdf"),
  rScript: testFile("demo-code.R"),
  roCrate: testFile("ro-crate-metadata.json"),
  stata: testFile("demo-data.dta"),
  rData: testFile("demo-data.RData"),
  spss: testFile("demo-data.sav"),
  excel: testFile("demo-data.xlsx"),
};

export const images = {
  logo: testFile(path.join("theme", "logo.png")),
  thumbnail: testFile(path.join("theme", "thumbnail.png")),
  footer: testFile(path.join("theme", "footer.png")),
};

/**
 * Default metadata for datasets that tests create. "Other" is part of the
 * stock citation block's Subject vocabulary on every Dataverse install.
 */
export const datasetDefaults = {
  subject: "Other",
  description: "Created by the Playwright suite; deleted automatically.",
};

import { expect, test } from "../../lib/fixtures";
import { DatasetPage } from "../../lib/pages/dataset-page";

/**
 * Needs a published version 1.0, so — like the lifecycle test — this leaves
 * one published dataset behind in ROOT_DATAVERSE per run.
 */
test("View a dataset's version history", async ({ page, createDataset }) => {
  await createDataset();
  const dataset = new DatasetPage(page);
  await dataset.publish();

  await dataset.tab("versionsTab").click();
  const versions = page.locator('[id="datasetForm:tabView:versionsTab"]');
  await versions.getByRole("link", { name: "1.0", exact: true }).click();
  await expect(page).toHaveURL(/version=1\.0/);
});

import { expect, test } from "../../lib/fixtures";
import { DatasetForm } from "../../lib/pages/dataset-form";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { files } from "../../lib/test-data";

/**
 * Create → edit metadata → edit file metadata → replace a file → publish.
 *
 * The dataset ends up published, which Dataverse's UI cannot delete, so this
 * test leaves one published dataset behind in ROOT_DATAVERSE per run.
 */
test("Dataset lifecycle: create, edit, replace a file, publish", async ({
  page,
  createDataset,
}) => {
  const dataset = await createDataset({ files: [files.sampleText, files.sampleText2] });
  const datasetPage = new DatasetPage(page);
  const form = new DatasetForm(page);
  const newTitle = `${dataset.title} (edited)`;

  await test.step("edit dataset metadata", async () => {
    await datasetPage.openEditMenuItem("editMetadata");
    await form.fillTitle(newTitle);
    await page.getByRole("button", { name: "Save Changes" }).last().click();
    await expect(page.locator("#title")).toHaveText(newTitle);
  });

  await test.step("edit file metadata", async () => {
    await datasetPage.selectAllFiles();
    await page.getByRole("button", { name: "Edit Files" }).first().click();
    await page.getByRole("link", { name: "Metadata" }).last().click();
    await page
      .locator('[name="datasetForm:filesTable:0:fileDescription"]')
      .fill("An edited file description.");
    await page.getByRole("button", { name: "Save Changes" }).last().click();
    await expect(datasetPage.filesTable).toBeVisible();
  });

  await test.step("replace a file", async () => {
    await datasetPage.filesTable
      .getByRole("link", { name: "sample-dataset-file.txt", exact: true })
      .click();
    await page.getByRole("button", { name: "Edit File" }).first().click();
    await page.getByRole("link", { name: "Replace" }).click();
    await page.locator('[id="datasetForm:fileUpload_input"]').setInputFiles(files.replacementText);
    await page.getByRole("button", { name: "Save Changes" }).last().click();
  });

  await test.step("publish", async () => {
    await datasetPage.goto(dataset.url);
    await expect(
      datasetPage.filesTable.getByRole("link", {
        name: "replaced-sample-dataset-file.txt",
        exact: true,
      }),
    ).toBeVisible();
    await datasetPage.publish();
  });
});

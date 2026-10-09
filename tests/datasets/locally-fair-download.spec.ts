import { env, expect, test } from "../../lib/fixtures";
import { waitForAjaxIdle } from "../../lib/ajax";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { files } from "../../lib/test-data";

test("Download a dataset's files in a Locally FAIR collection", async ({
  page,
  createCollection,
  createDataset,
}) => {
  test.skip(!env.features.locallyFair, "Set LOCALLY_FAIR_ENABLED=true to run");

  const { alias } = await createCollection({
    customize: async (page) => {
      // Locally FAIR adds a contact autocomplete to the collection form.
      const contact = page.locator(
        '[id="dataverseForm:userGroupNameAssign:userGroupAutoComplete_input"]',
      );
      await contact.pressSequentially(env.credentials.username, { delay: 50 });
      const suggestion = page.locator(".ui-autocomplete-item").first();
      await expect(suggestion).toBeVisible();
      await suggestion.click();
      await waitForAjaxIdle(page);
    },
  });

  await createDataset({ collection: alias, files: [files.sampleText, files.sampleText2] });
  await new DatasetPage(page).selectAllFiles();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBeTruthy();
});

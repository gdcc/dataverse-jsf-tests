import { expect, test } from "../../lib/fixtures";
import { CollectionPage } from "../../lib/pages/collection-page";
import { DatasetPage } from "../../lib/pages/dataset-page";

test("Browse to a dataset from its collection and open its metadata", async ({
  page,
  createCollection,
  createDataset,
}) => {
  // Browsing a dedicated collection means the listing contains only what
  // this test created — no dependence on whatever else is on the instance.
  const { alias } = await createCollection();
  const dataset = await createDataset({ collection: alias });

  const collection = new CollectionPage(page);
  const listing = page.locator("#resultsTable").getByRole("link", {
    name: dataset.title,
    exact: true,
  });

  // Collection listings come from the search index, which updates
  // asynchronously, so retry until the new dataset shows up.
  await expect(async () => {
    await collection.goto(alias);
    await page.getByRole("button", { name: "Sort" }).click();
    await page.getByRole("link", { name: "Name" }).first().click();
    await page.locator('a.facetTypeChBox[href*="types=datasets"]').click();
    await expect(listing).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });

  await listing.click();
  await expect(page.locator("#title")).toHaveText(dataset.title);

  await new DatasetPage(page).tab("metadataMapTab").click();
  await expect(page.locator('[id="datasetForm:tabView:metadataMapTab"]')).toBeVisible();
});

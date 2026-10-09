import { expect, test } from "../../lib/fixtures";
import { CollectionPage } from "../../lib/pages/collection-page";

test("Search for a dataset by title, then run an advanced search", async ({
  page,
  createDataset,
}) => {
  const dataset = await createDataset();
  const collection = new CollectionPage(page);
  // Each search result links to the dataset twice (title and thumbnail).
  const result = page.locator("#resultsTable").getByRole("link", {
    name: dataset.title,
    exact: true,
  }).first();

  await test.step("basic search finds the dataset", async () => {
    // Indexing is asynchronous, so retry the search until Solr has caught up.
    await expect(async () => {
      await collection.goto();
      await page.getByPlaceholder("Search this dataverse").fill(`"${dataset.title}"`);
      await page.getByRole("link", { name: "Find" }).click();
      await expect(result).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
  });

  await test.step("advanced search reflects the query in the URL", async () => {
    await page.getByRole("link", { name: "Advanced Search" }).click();
    const keyword = dataset.title.split(" ").pop()!;
    await page.locator('[id="advancedSearchForm:dvFieldName"]').fill(keyword);
    await page.getByRole("button", { name: "Find" }).last().click();
    await expect(page).toHaveURL(new RegExp(keyword));
  });
});

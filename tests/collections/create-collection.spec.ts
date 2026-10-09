import { test, expect } from "../../lib/fixtures";

/**
 * Creating a collection: the Metadata Fields and Browse/Search Facets
 * "inherit from parent" checkboxes lock and unlock their option lists, and
 * the collection is created at the chosen alias. The collection is deleted
 * again afterwards by the createCollection fixture.
 */

test("Create a collection", async ({ page, createCollection }) => {
  const collection = await createCollection({
    customize: async (page) => {
      await test.step("metadata-field checkboxes follow the inherit toggle", async () => {
        const inherit = page.locator('[id="dataverseForm:metadataRoot"]');
        const blocks = page.locator(
          '[id="dataverseForm:optionBlock"] div.checkbox label input[type="checkbox"]',
        );
        await expect(inherit).toBeChecked();
        const count = await blocks.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) await expect(blocks.nth(i)).toBeDisabled();

        await inherit.uncheck();
        // The citation block is mandatory, so it stays locked.
        await expect(blocks.nth(0)).toBeDisabled();
        for (let i = 1; i < count; i++) await expect(blocks.nth(i)).toBeEnabled();

        await inherit.check();
        const confirm = page
          .locator("button:visible")
          .filter({ has: page.locator("span", { hasText: "Continue" }) });
        await confirm.click();
        for (let i = 0; i < count; i++) await expect(blocks.nth(i)).toBeDisabled();
      });

      await test.step("facet picker follows the inherit toggle", async () => {
        const inherit = page.locator('[id="dataverseForm:facetsRoot"]');
        const picker = page
          .locator('[id="dataverseForm:editFacets"]')
          .locator("div.ui-picklist-list-wrapper div.ui-widget-header > div")
          .first();
        await expect(inherit).toBeChecked();
        await expect(picker).toHaveClass(/ui-state-disabled/);
        await inherit.uncheck();
        await expect(picker).not.toHaveClass(/ui-state-disabled/);
        await inherit.check();
        await expect(picker).toHaveClass(/ui-state-disabled/);
      });

      await page
        .locator('[id="dataverseForm:description"]')
        .fill("Created by the <b>Playwright</b> suite; deleted automatically.");
    },
  });

  await expect(page).toHaveURL(new RegExp(`${collection.path}/?([?#]|$)`));
  await expect(page.locator('a[data-original-title="Email Dataverse Contact"]')).toBeVisible();
});

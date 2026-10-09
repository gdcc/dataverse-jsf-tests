import { expect, test, type Page } from "../../lib/fixtures";
import { waitForAjaxIdle } from "../../lib/ajax";
import { CollectionPage } from "../../lib/pages/collection-page";
import { images } from "../../lib/test-data";

const THEME_SAVED = "You have successfully updated the theme for this dataverse!";

const themeInput = (page: Page, id: string) =>
  page.locator(`[id="themeWidgetsForm:themeWidgetsTabView:${id}"]`);

async function openThemeEditor(page: Page, alias: string) {
  const collection = new CollectionPage(page);
  await collection.goto(alias);
  await collection.openEditMenuItem("themeWidgetsOpts");
  await expect(themeInput(page, "tagline")).toBeVisible();
}

/** Each image upload re-renders the tab via AJAX; let it settle before the next one. */
async function uploadImage(page: Page, inputId: string, file: string) {
  await themeInput(page, `${inputId}_input`).setInputFiles(file);
  await waitForAjaxIdle(page);
}

async function saveTheme(page: Page) {
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(new CollectionPage(page).successAlert).toContainText(THEME_SAVED);
}

async function uploadAllImages(page: Page) {
  await uploadImage(page, "uploadlogo", images.logo);
  await uploadImage(page, "uploadlogoThumbnail", images.thumbnail);
  await uploadImage(page, "uploadlogoFooter", images.footer);
}

test("Theme: upload images and set tagline and website", async ({ page, createCollection }) => {
  const { alias } = await createCollection();
  await openThemeEditor(page, alias);

  await uploadAllImages(page);
  await themeInput(page, "tagline").fill("Created by the Playwright suite");
  await themeInput(page, "website").fill("https://dataverse.org");
  await saveTheme(page);
});

test("Theme: remove and replace the thumbnail image", async ({ page, createCollection }) => {
  const { alias } = await createCollection();
  await openThemeEditor(page, alias);
  await uploadAllImages(page);
  await saveTheme(page);

  await test.step("remove the thumbnail", async () => {
    await openThemeEditor(page, alias);
    const thumbnailSection = page
      .locator(".form-group")
      .filter({ has: page.locator('label[for="thumbnailFormat"]') });
    await thumbnailSection.getByRole("button", { name: "Remove" }).click();
    await expect(themeInput(page, "uploadlogoThumbnail_input")).toBeAttached();
    await saveTheme(page);
  });

  await test.step("upload a replacement thumbnail", async () => {
    await openThemeEditor(page, alias);
    await uploadImage(page, "uploadlogoThumbnail", images.logo);
    await saveTheme(page);
  });
});

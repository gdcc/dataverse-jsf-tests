import { env, expect, test } from "../../lib/fixtures";
import { uniqueName } from "../../lib/naming";
import { CollectionPage } from "../../lib/pages/collection-page";
import { DatasetForm } from "../../lib/pages/dataset-form";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { TemplatesPage } from "../../lib/pages/templates-page";
import { datasetDefaults } from "../../lib/test-data";

test("New datasets inherit custom terms from the collection's default template", async ({
  page,
  createCollection,
  trackDataset,
  cleanup,
}) => {
  test.skip(!env.features.customLicense, "Set CUSTOM_LICENSE_ENABLED=true to run");

  // Everything happens in a throwaway collection, so the default template
  // never affects ROOT_DATAVERSE.
  const { alias } = await createCollection();
  const templateName = uniqueName("Playwright License Template");
  const templateTitle = `${templateName} title`;
  const customTerms = "All Rights Reserved";
  const templates = new TemplatesPage(page);
  const form = new DatasetForm(page);

  cleanup.add(`delete template "${templateName}"`, async (p) => {
    const leftovers = new TemplatesPage(p);
    await leftovers.goto(alias);
    if ((await leftovers.row(templateName).count()) > 0) await leftovers.delete(templateName);
  });

  await test.step("create a template with custom terms", async () => {
    await templates.goto(alias);
    await templates.createButton.click();
    await page.locator('[id$=":templateName"]').fill(templateName);
    await form.fillTitle(templateTitle);
    await form.authorNameInput.fill("Playwright Tester");
    await form.contactEmailInput.fill("playwright@example.org");
    await form.fillDescription(datasetDefaults.description);
    await form.selectSubject(datasetDefaults.subject);
    await page.getByRole("button", { name: "Save + Add Terms" }).click();
    await expect(page.getByText("Template has been created.")).toBeVisible();

    await page.locator('[id="templateForm:licenses_label"]').click();
    await page
      .locator('[id="templateForm:licenses_items"]')
      .getByText("Custom Dataset Terms", { exact: true })
      .click();
    await page.locator('[id="templateForm:dlTermsdOfUse"]').fill(customTerms);
    await page.getByRole("button", { name: "Save Dataset Template" }).click();
    await expect(page.getByText("Template has been edited and saved.")).toBeVisible();
  });

  await templates.makeDefault(templateName);

  await test.step("a new dataset picks the terms up", async () => {
    const collection = new CollectionPage(page);
    await collection.goto(alias);
    await collection.startNewDataset();
    await form.saveNewDataset();
    trackDataset({ title: templateTitle, url: page.url() });

    await expect(page.getByRole("heading", { name: templateTitle, exact: true })).toBeVisible();
    await new DatasetPage(page).tab("termsTab").click();
    const terms = page.locator('[id="datasetForm:tabView:touFragment"]');
    await expect(terms.getByText("Custom Dataset Terms")).toBeVisible();
    await expect(terms.getByText(customTerms, { exact: true })).toBeVisible();
  });

  await test.step("unset the default", async () => {
    await templates.goto(alias);
    await templates.unsetDefault(templateName);
  });
});

import { expect, test } from "../../lib/fixtures";
import { uniqueName } from "../../lib/naming";
import { DatasetForm } from "../../lib/pages/dataset-form";
import { TemplatesPage } from "../../lib/pages/templates-page";
import { datasetDefaults } from "../../lib/test-data";

test("Dataset template: create, rename, make default, copy, delete", async ({
  page,
  createCollection,
  cleanup,
}) => {
  const { alias } = await createCollection();
  const name = uniqueName("Playwright Template");
  const renamed = uniqueName("Renamed Template");
  const copy = `Copy of ${renamed}`;

  // The test deletes its templates itself; this only matters if it fails
  // part-way. (Registered after the collection, so it runs before the
  // collection is deleted.)
  cleanup.add("delete leftover templates", async (p) => {
    const leftovers = new TemplatesPage(p);
    await leftovers.goto(alias);
    for (const t of [copy, renamed, name]) {
      if ((await leftovers.row(t).count()) > 0) await leftovers.delete(t);
    }
  });

  const templates = new TemplatesPage(page);
  await templates.goto(alias);

  await test.step("create", async () => {
    await templates.createButton.click();
    const form = new DatasetForm(page);
    await page.locator('[id$=":templateName"]').fill(name);
    await form.fillTitle(`${name} title`);
    await form.authorNameInput.fill("Playwright Tester");
    await form.contactEmailInput.fill("playwright@example.org");
    await form.fillDescription(datasetDefaults.description);
    await form.selectSubject(datasetDefaults.subject);
    await page.getByRole("button", { name: "Save + Add Terms" }).click();
    await page.getByRole("button", { name: "Save Dataset Template" }).click();
    await expect(templates.row(name)).toBeVisible();
  });

  await test.step("rename", async () => {
    await templates.actions(name).getByRole("button", { name: "Edit Template" }).click();
    await page.getByRole("link", { name: "Metadata" }).click();
    await page.locator('[id$=":templateName"]').fill(renamed);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(templates.row(renamed)).toBeVisible();
  });

  await templates.makeDefault(renamed);

  await test.step("copy", async () => {
    await templates.actions(renamed).locator('[data-original-title="Copy"]').click();
    // Copy opens the edit form — save it unchanged.
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Template has been edited and saved")).toBeVisible();
    await expect(templates.row(copy)).toBeVisible();
  });

  await test.step("delete both", async () => {
    await templates.delete(copy);
    await templates.delete(renamed);
  });
});

import { expect, type Locator, type Page } from "@playwright/test";
import { waitForAjaxIdle } from "../ajax";

/**
 * The dataset metadata form — used both on the "New Dataset" page and when
 * editing metadata on an existing dataset or a dataset template (all three
 * render Dataverse's shared metadataFragment.xhtml).
 *
 * Fields are located by their *field-type name* or *label*, never by
 * position in the form or by JSF-generated ids (`j_idt123`), so they keep
 * working when an installation enables extra metadata blocks.
 */
export class DatasetForm {
  constructor(readonly page: Page) {}

  /**
   * The `role="group"` wrapper Dataverse renders around each metadata field.
   *
   * Compound fields (author, datasetContact, dsDescription, …) are found by
   * their stable `#metadata_<fieldName>` anchor. Primitive fields (title,
   * subject, …) have no such anchor, so they are found by their exact label.
   */
  compoundField(fieldName: string): Locator {
    return this.page
      .locator('div.form-group[role="group"]')
      .filter({ has: this.page.locator(`[id="metadata_${fieldName}"]`) });
  }

  primitiveField(label: string): Locator {
    return this.page.locator('div.form-group[role="group"]').filter({
      has: this.page.locator("label.control-label", {
        hasText: new RegExp(`^\\s*${label}\\s*$`),
      }),
    });
  }

  get titleInput(): Locator {
    return this.primitiveField("Title").locator('input[type="text"]').first();
  }

  get descriptionInput(): Locator {
    return this.compoundField("dsDescription").locator("textarea").first();
  }

  get authorNameInput(): Locator {
    return this.compoundField("author").locator('input[type="text"]').first();
  }

  get contactEmailInput(): Locator {
    return this.compoundField("datasetContact").getByLabel(/e-?mail/i);
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  async fillDescription(text: string): Promise<void> {
    await this.descriptionInput.fill(text);
  }

  /** Picks one value in the Subject multi-select (a PrimeFaces selectCheckboxMenu). */
  async selectSubject(subject: string): Promise<void> {
    const menu = this.primitiveField("Subject").locator(".ui-selectcheckboxmenu").first();
    const container = menu.locator(".ui-selectcheckboxmenu-multiple-container");
    await container.click();

    // PrimeFaces renders the option panel as `<menu id>_panel`, often
    // appended to <body>, so it can't be found by scoping inside the field.
    const menuId = await menu.getAttribute("id");
    const panel = this.page.locator(`[id="${menuId}_panel"]`);
    await expect(panel).toBeVisible();
    await panel.getByText(subject, { exact: true }).click();

    // Close the panel so it doesn't cover the fields below it.
    await container.click();
    await expect(panel).toBeHidden();
  }

  /**
   * Uploads files via the form's file input and waits until each has a row
   * in the staged-files table. (A .zip is unpacked into several rows, which
   * still satisfies "at least one row per uploaded file".)
   */
  async uploadFiles(paths: string[]): Promise<void> {
    await this.page.locator('[id="datasetForm:fileUpload_input"]').setInputFiles(paths);
    await expect(
      this.page.locator(`[id="datasetForm:filesTable:${paths.length - 1}:fileName"]`),
    ).toBeVisible({ timeout: 60_000 });
    await waitForAjaxIdle(this.page);
  }

  /** Clicks "Save Dataset" on the create page and waits for the dataset page. */
  async saveNewDataset(): Promise<void> {
    await this.page.getByRole("button", { name: "Save Dataset" }).click();
    await expect(this.page.getByText("This dataset has been created.")).toBeVisible({
      timeout: 60_000,
    });
  }
}

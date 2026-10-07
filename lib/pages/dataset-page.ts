import { expect, type Locator, type Page } from "@playwright/test";

/** The dataset view page (dataset.xhtml). */
export class DatasetPage {
  constructor(readonly page: Page) {}

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await expect(this.editButton).toBeVisible();
  }

  get editButton(): Locator {
    return this.page.locator('[id="editDataSet"]');
  }

  get filesTable(): Locator {
    return this.page.locator('[id="datasetForm:tabView:filesTable"]');
  }

  /** A tab header on the dataset page, by the tab's stable JSF id. */
  tab(id: "dataFilesTab" | "metadataMapTab" | "termsTab" | "versionsTab"): Locator {
    return this.page.locator(`a[href="#datasetForm:tabView:${id}"]`);
  }

  /** Opens Edit Dataset → <item>, where item is the menu entry's link id. */
  async openEditMenuItem(id: string): Promise<void> {
    await this.editButton.click();
    await this.page.locator(`[id="datasetForm:${id}"]`).click();
  }

  /** Edit Dataset → Permissions → Dataset (or File). */
  async openPermissions(kind: "dataset" | "file"): Promise<void> {
    await this.editButton.click();
    await this.page
      .locator("li.dropdown-submenu a", { hasText: "Permissions" })
      .first()
      .hover();
    const id = kind === "dataset" ? "manageDatasetPermissions" : "manageFilePermissions";
    await this.page.locator(`[id="datasetForm:${id}"]`).click();
    await this.page.waitForURL(
      kind === "dataset" ? /permissions-manage\.xhtml/ : /permissions-manage-files\.xhtml/,
    );
  }

  /** Clicks the "select all files" checkbox in the files table. */
  async selectAllFiles(): Promise<void> {
    const box = this.filesTable.locator(".ui-chkbox-all .ui-chkbox-box").first();
    await box.click();
    await expect(box).toHaveClass(/ui-state-active/);
  }

  async publish(): Promise<void> {
    await this.page.getByRole("link", { name: "Publish Dataset" }).click();
    await this.page.locator('[id="datasetForm:releaseDatasetButton"]').click();
    // Dataverse locks the dataset while it finalizes the publish, then
    // reloads the page. The Publish link vanishes as soon as the lock starts,
    // so wait for the released-version label ("Version 1.0") instead.
    await expect(
      this.page.locator("#datasetVersionBlock .label-default", {
        hasText: /^\s*Version \d+\.\d+\s*$/,
      }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(this.page.getByRole("link", { name: "Publish Dataset" })).toBeHidden();
  }

  /**
   * True when Dataverse offers "Delete Dataset" — i.e. the dataset has never
   * been published. (The menu items are in the DOM even while it's closed.)
   */
  async isDeletable(): Promise<boolean> {
    return (await this.page.locator('[id="datasetForm:deleteDataset"]').count()) > 0;
  }

  async delete(): Promise<void> {
    await this.openEditMenuItem("deleteDataset");
    await this.page
      .locator('[id="datasetForm:deleteConfirmation"]')
      .getByRole("button", { name: "Continue" })
      .click();
    await this.page.waitForURL((url) => !url.pathname.includes("dataset.xhtml"));
  }
}

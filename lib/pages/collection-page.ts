import { expect, type Locator, type Page } from "@playwright/test";
import { openDropdown } from "../dropdown";
import { env } from "../env";

/** Path of a collection page from its alias, or the configured root collection. */
export function collectionPath(alias?: string): string {
  return alias ? `/dataverse/${alias}` : env.rootCollection;
}

/** A collection ("dataverse") landing page. */
export class CollectionPage {
  constructor(readonly page: Page) {}

  /** Opens a collection by alias; with no alias, opens ROOT_DATAVERSE. */
  async goto(alias?: string): Promise<void> {
    await this.page.goto(collectionPath(alias));
  }

  get editButton(): Locator {
    // Not an exact match: the pencil icon is part of the accessible name ("✏ Edit").
    // `.first()`: other "Edit" buttons can share the page (e.g. on root, once
    // other suites have added content), which would break strict mode.
    return this.page.getByRole("button", { name: /Edit/i }).first();
  }

  get successAlert(): Locator {
    return this.page.locator("div.alert.alert-success");
  }

  /**
   * Opens Edit → <item>. `id` is the menu entry's stable JSF id:
   * "themeWidgetsOpts", "managePermissions", "manageGroups",
   * "manageTemplates", "manageGuestbooks", "deleteDataset" (sic — that is
   * the id Dataverse gives "Delete Dataverse").
   */
  async openEditMenuItem(id: string): Promise<void> {
    const item = this.page.locator(`[id$="${id}"]`).first();
    await openDropdown(this.editButton, item);
    await item.click();
  }

  async startNewDataset(): Promise<void> {
    await this.page.getByRole("button", { name: "Add Data" }).click();
    await this.page.getByRole("link", { name: "New Dataset" }).click();
    await expect(this.page.getByRole("button", { name: "Save Dataset" })).toBeVisible();
  }

  async startNewCollection(): Promise<void> {
    await this.page.getByRole("button", { name: "Add Data" }).click();
    await this.page.getByRole("link", { name: "New Dataverse" }).click();
    await expect(this.page.locator('[id="dataverseForm:identifier"]')).toBeVisible();
  }

  async publish(): Promise<void> {
    await this.page.getByRole("button", { name: "Publish" }).click();
    await this.page
      .locator("button:visible")
      .filter({ has: this.page.locator("span", { hasText: "Continue" }) })
      .click();
    await expect(this.successAlert).toContainText("Your dataverse is now public.");
  }

  /**
   * True when Dataverse offers "Delete Dataverse", which it only does for a
   * collection that contains no datasets or sub-collections.
   */
  async isDeletable(): Promise<boolean> {
    return (await this.page.locator('[id$="deleteDataset"]').count()) > 0;
  }

  async delete(): Promise<void> {
    const from = new URL(this.page.url()).pathname;
    await this.openEditMenuItem("deleteDataset");
    await this.page
      .locator('[id$="deleteDvConfirm"]')
      .getByRole("button", { name: "Continue" })
      .click();
    // Dataverse redirects to the parent collection once the delete succeeds.
    await this.page.waitForURL((url) => url.pathname !== from);
  }
}

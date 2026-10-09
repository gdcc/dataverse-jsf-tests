import { expect, type Locator, type Page } from "@playwright/test";
import { CollectionPage } from "./collection-page";

/** A collection's Dataset Templates page (manage-templates.xhtml). */
export class TemplatesPage {
  constructor(readonly page: Page) {}

  /** Opens Edit → Dataset Templates for a collection. */
  async goto(collectionAlias?: string): Promise<void> {
    const collection = new CollectionPage(this.page);
    await collection.goto(collectionAlias);
    await collection.openEditMenuItem("manageTemplates");
    await expect(this.createButton).toBeVisible();
  }

  get createButton(): Locator {
    return this.page.getByRole("link", { name: "Create Dataset Template" }).first();
  }

  /** The table row for a template, found by its (unique) name. */
  row(name: string): Locator {
    return this.page
      .locator('[id="manageTemplatesForm:allTemplates_data"] tr')
      .filter({ has: this.page.locator('td[role="gridcell"]', { hasText: name }) });
  }

  /** The row's action buttons cell (Make Default, View, Copy, Edit, Delete). */
  actions(name: string): Locator {
    return this.row(name).locator("td.col-manage-action");
  }

  async makeDefault(name: string): Promise<void> {
    await this.actions(name).getByRole("link", { name: "Make Default", exact: true }).click();
    await expect(
      this.page.getByText("The template has been selected as the default template"),
    ).toBeVisible();
  }

  async unsetDefault(name: string): Promise<void> {
    await this.actions(name).getByRole("link", { name: "Default", exact: true }).click();
    await expect(
      this.actions(name).getByRole("link", { name: "Make Default", exact: true }),
    ).toBeVisible();
  }

  async delete(name: string): Promise<void> {
    await this.actions(name).locator('[data-original-title="Delete"]').click();
    await this.page.locator('[id="manageTemplatesForm:contDeleteTemplateBtn"]').click();
    await expect(this.row(name)).toHaveCount(0);
  }
}

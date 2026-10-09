import { expect, type Locator, type Page } from "@playwright/test";

/** The "New Dataverse" (create collection) form. */
export class CollectionForm {
  constructor(readonly page: Page) {}

  field(id: string): Locator {
    return this.page.locator(`[id="dataverseForm:${id}"]`);
  }

  async fillIdentifier(alias: string): Promise<void> {
    await this.field("identifier").fill(alias);
  }

  /** Category option value, e.g. "DEPARTMENT", "LABORATORY", "RESEARCH_PROJECTS". */
  async selectCategory(category: string): Promise<void> {
    await this.field("dataverseCategory").selectOption(category);
  }

  async create(alias: string): Promise<void> {
    await this.page.getByRole("button", { name: "Create Dataverse" }).click();
    // Dataverse redirects to /dataverse/<alias>/ (note the trailing slash).
    await expect(this.page).toHaveURL(new RegExp(`/dataverse/${alias}/?([?#]|$)`));
    await expect(
      this.page.getByText("You have successfully created your dataverse!"),
    ).toBeVisible();
  }
}

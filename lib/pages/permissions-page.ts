import { expect, type Locator, type Page } from "@playwright/test";
import { waitForAjaxIdle } from "../ajax";

/**
 * permissions-manage.xhtml — the same page serves collections and datasets.
 *
 * Users and groups are identified the way Dataverse shows them in the ID
 * column: "@username" for a user, ":authenticated-users" for a built-in group.
 */
export class PermissionsPage {
  constructor(readonly page: Page) {}

  get assignButton(): Locator {
    return this.page.locator('[id="rolesPermissionsForm:userGroupsAdd"]');
  }

  get assignedRoles(): Locator {
    return this.page.locator('[id="rolesPermissionsForm:assignedRoles"]');
  }

  /** The assigned-roles row for one user/group + role pair. */
  assignment(assignee: string, role: string): Locator {
    return this.assignedRoles
      .locator("tbody tr")
      .filter({ hasText: assignee })
      .filter({ hasText: role });
  }

  /**
   * The "Users/Groups" panel starts collapsed on a collection's permissions
   * page (it is expanded on a dataset's), so open it if necessary.
   */
  async showUsersAndGroups(): Promise<void> {
    const panel = this.page.locator("#panelCollapseUsersGroups");
    if (!(await panel.isVisible())) {
      await this.page.locator('[data-target="#panelCollapseUsersGroups"]').click();
    }
    await expect(this.assignButton).toBeVisible();
  }

  async assignRole(assignee: string, role: string): Promise<void> {
    await this.showUsersAndGroups();
    await this.assignButton.click();

    const dialog = this.page.locator('[id="rolesPermissionsForm:userGroupDialog"]');
    const input = dialog.locator("input[id*='userGroupAutoComplete_input']");
    await expect(input).toBeVisible();
    await input.pressSequentially(assignee, { delay: 50 });

    const suggestion = this.page.locator(".ui-autocomplete-item").first();
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    await waitForAjaxIdle(this.page);

    // PrimeFaces radios: the real <input> is visually hidden, so click the
    // styled box that belongs to the label with the role's name.
    const label = dialog.locator("label", { hasText: new RegExp(`^\\s*${role}\\s*$`) });
    const inputId = await label.getAttribute("for");
    await this.page
      .locator(`[id="${inputId}"]`)
      .locator("xpath=ancestor::div[contains(@class,'ui-radiobutton')][1]")
      .locator(".ui-radiobutton-box")
      .click();

    await dialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(dialog).toBeHidden();
    await expect(this.assignment(assignee, role)).toBeVisible();
  }

  async removeRole(assignee: string, role: string): Promise<void> {
    await this.showUsersAndGroups();
    await this.assignment(assignee, role).getByRole("link", { name: /Remove/ }).click();
    await this.page
      .locator('[id="rolesPermissionsForm:accessRemoveConfirm"]')
      .getByRole("button", { name: "Continue" })
      .click();
    await expect(this.assignment(assignee, role)).toHaveCount(0);
  }
}

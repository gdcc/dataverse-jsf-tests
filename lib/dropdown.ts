import { expect, type Locator } from "@playwright/test";

/**
 * Clicks `button` until `item` (an entry in the menu it opens) is visible.
 *
 * Right after a page loads, a click can land before Dataverse has wired up
 * the dropdown: the click "succeeds" but no menu opens, and the next click on
 * the menu entry waits forever. Retrying the open fixes that without any
 * fixed delay — when the page is ready, the first click is the only one.
 */
export async function openDropdown(button: Locator, item: Locator): Promise<void> {
  await expect(async () => {
    if (!(await item.isVisible())) await button.click();
    await expect(item).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

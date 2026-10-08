import { expect, type Locator } from "@playwright/test";

/**
 * Opens a dropdown menu or dialog and waits until `target` (something inside
 * it) is visible. `open` is the button/link that opens it, or a function for
 * multi-step openers (e.g. Edit menu → item → confirmation dialog).
 *
 * Right after a page loads, a click can land before Dataverse has wired up
 * its handler: the click "succeeds" but nothing opens, and the next click on
 * the hidden target waits until the test times out. So keep opening until
 * the target shows up — with no fixed delay: when the page is ready, the
 * first click is the only one.
 */
export async function openPopup(
  open: Locator | (() => Promise<void>),
  target: Locator,
): Promise<void> {
  await expect(async () => {
    if (!(await target.isVisible())) {
      if (typeof open === "function") await open();
      else await open.click({ timeout: 5_000 });
    }
    await expect(target).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}

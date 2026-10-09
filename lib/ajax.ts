import type { Page } from "@playwright/test";

/**
 * Waits until Dataverse's JSF/PrimeFaces UI has no AJAX requests in flight.
 *
 * Use this instead of `page.waitForTimeout(...)` after an action that
 * triggers a PrimeFaces partial update (selecting an autocomplete item,
 * changing a dropdown that re-renders part of the form, etc.). Prefer a
 * web-first assertion on the element you actually care about when there is
 * one — this is for the cases where there isn't.
 */
export async function waitForAjaxIdle(page: Page, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const w = window as any;
      const jqueryIdle = typeof w.jQuery === "undefined" || w.jQuery.active === 0;
      const primeIdle =
        typeof w.PrimeFaces === "undefined" ||
        !w.PrimeFaces.ajax?.Queue ||
        w.PrimeFaces.ajax.Queue.isEmpty();
      return jqueryIdle && primeIdle;
    },
    undefined,
    { timeout },
  );
}

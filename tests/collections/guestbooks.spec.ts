import { expect, test, type Page } from "../../lib/fixtures";
import { uniqueName } from "../../lib/naming";
import { CollectionPage } from "../../lib/pages/collection-page";

test("Guestbook: create, download responses, delete", async ({
  page,
  browserName,
  createCollection,
  cleanup,
}) => {
  test.skip(browserName === "webkit", "WebKit opens the CSV inline instead of downloading it");

  // A throwaway collection keeps the guestbook out of ROOT_DATAVERSE.
  const { alias } = await createCollection();
  const guestbookName = uniqueName("Playwright Guestbook");

  const guestbookRow = (p: Page) =>
    p
      .locator('[id="manageGuestbooksForm:allGuestbooks_data"] tr')
      .filter({ has: p.locator('td[role="gridcell"]', { hasText: guestbookName }) });

  const deleteGuestbook = async (p: Page) => {
    await guestbookRow(p).locator('[data-original-title="Delete"]').click();
    await p
      .locator('[id="manageGuestbooksForm:deleteGuestbookConfirm"]')
      .getByRole("button", { name: "Continue" })
      .click();
    await expect(guestbookRow(p)).toHaveCount(0);
  };

  const openGuestbooks = async (p: Page) => {
    const collection = new CollectionPage(p);
    await collection.goto(alias);
    await collection.openEditMenuItem("manageGuestbooks");
  };

  // Only matters if the test fails before its own delete step.
  cleanup.add(`delete guestbook "${guestbookName}"`, async (p) => {
    await openGuestbooks(p);
    if ((await guestbookRow(p).count()) > 0) await deleteGuestbook(p);
  });

  await openGuestbooks(page);

  await test.step("create the guestbook", async () => {
    await page.getByRole("link", { name: "Create Dataset Guestbook" }).click();
    await page.locator('[id="guestbookForm:guestbookName"]').fill(guestbookName);
    for (const field of ["name", "email", "institution", "position"]) {
      await page.locator(`[id="guestbookForm:${field}RequiredCb"]`).check();
    }

    const question = page.locator('[id="guestbookForm:customQuestions"]');
    const options = question.locator('[id$=":responseText"]');
    // Switching to multiple choice re-renders the question via AJAX.
    await question.locator('[id$=":questionOptions"]').first().selectOption("options");
    await expect(options.first()).toBeVisible();
    await question.locator('[id$=":questionText"]').first().fill("How did you find this dataset?");
    await options.nth(0).fill("Web Search");
    // .nolabel-field-btn is the option-level Add (the question-level one is .compound-field-btn).
    await question.locator('.nolabel-field-btn[data-original-title="Add"]').first().click();
    await expect(options).toHaveCount(2);
    await options.nth(1).fill("Colleague Recommendation");

    await page.getByRole("button", { name: "Create Dataset Guestbook" }).click();
  });

  const row = guestbookRow(page);
  await expect(row).toBeVisible();

  await test.step("download its responses", async () => {
    const download = page.waitForEvent("download");
    await row.locator('[id$="downloadResponsesByDvAndGuestbook"]').click();
    expect((await download).suggestedFilename()).toBeTruthy();
  });

  await test.step("delete it", () => deleteGuestbook(page));
});

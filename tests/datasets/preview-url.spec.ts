import { expect, test } from "../../lib/fixtures";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { files } from "../../lib/test-data";

test("Preview URL: create, open anonymously, disable", async ({
  page,
  browser,
  createDataset,
}) => {
  await createDataset({ files: [files.sampleText, files.sampleText2] });
  await new DatasetPage(page).openEditMenuItem("privateUrl");

  await page.getByRole("button", { name: "Create General Preview URL" }).click();
  const urlText = page.locator("div.highlight p span");
  await expect(urlText).toContainText("previewurl.xhtml");
  const previewUrl = (await urlText.innerText()).trim();
  expect(previewUrl).toContain("token=");

  await test.step("the URL works for someone who isn't logged in", async () => {
    // Opening it as the owner just redirects to the dataset, so use a
    // fresh context with no session cookies.
    const anonymous = await browser.newContext();
    try {
      const preview = await anonymous.newPage();
      await preview.goto(previewUrl);
      await expect(
        preview.locator("#messagePanel").getByText("Unpublished Dataset Preview URL"),
      ).toBeVisible();
      await expect(
        preview.getByText("Privately share this draft dataset before it is published"),
      ).toBeVisible();
    } finally {
      await anonymous.close();
    }
  });

  await test.step("disable it", async () => {
    // The Preview URL dialog is still open on the original page.
    await page.getByRole("button", { name: "Disable General Preview URL" }).click();
    await page.getByRole("button", { name: "Yes, Disable General Preview URL" }).click();
    await expect(
      page.getByText(
        "You have successfully disabled the Preview URL for this unpublished dataset.",
      ),
    ).toBeVisible();
  });
});

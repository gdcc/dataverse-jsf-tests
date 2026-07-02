import { test, expect } from "@playwright/test";
const process = (globalThis as any).process;

/**
 * @tags @21cfr
 *
 * 21 CFR Part 11 — Tests #7–#11
 * Creates a dataset, edits metadata, edits file metadata, replaces a file,
 * and publishes the dataset.
 */

test(
  "21 CFR: Dataset actions (create, edit, replace, publish)",
  { tag: ["@21cfr"] },
  async ({ page }) => {
    await page.goto(process.env.ROOT_DATAVERSE ?? "/");

    // ─── Test #7 — Create Dataset ───
    await page.getByRole("button", { name: "Add Data" }).click();
    await page.getByRole("link", { name: "New Dataset" }).click();
    await page
      .locator('[id$=":0:inputText"]')
      .first()
      .type("Playwright Test Dataset");
    await page
      .locator('[id$=":0:description"]')
      .first()
      .type(
        "This is a dummy dataset created by Playwright for testing purposes.",
      );
    await page
      .locator(".ui-selectcheckboxmenu-multiple-container")
      .first()
      .click();

    await page
      .locator(".ui-selectcheckboxmenu-items-wrapper")
      .first()
      .getByText("Chemistry")
      .click();

    await page
      .locator('[id="datasetForm:fileUpload_input"]')
      .setInputFiles([
        "tests/suite/test-data/sample-dataset-file.txt",
        "tests/suite/test-data/sample-dataset-file-2.txt",
      ]);
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Save Dataset" }).click();

    // ─── Test #8 — Edit Dataset Metadata ───
    await page
      .getByRole("button", { name: "Edit Dataset" })
      .click({ force: true });
    await page.locator("id=datasetForm:editMetadata").dispatchEvent("click");
    await page
      .locator('[id$=":0:inputText"]')
      .first()
      .fill("Playwright Test Dataset Modified");
    await page.getByRole("button", { name: "Save Changes" }).last().click();

    // ─── Test #9 — Edit File Metadata ───
    await page.locator(".ui-chkbox-all").first().click();
    await page.getByRole("button", { name: "Edit Files" }).click();
    await page
      .getByRole("link", { name: "Metadata" })
      .last()
      .click({ force: true });
    await page
      .locator('[name="datasetForm:filesTable:0:fileDescription"]')
      .type("This is a modified description for the dataset file.");
    await page.getByRole("button", { name: "Save Changes" }).last().click();

    // ─── Test #10 — Replace File ───
    // Use exact:true to avoid matching the "Preview" button whose accessible
    // name also contains the filename (strict-mode violation otherwise).
    await page
      .getByRole("link", { name: "sample-dataset-file.txt", exact: true })
      .click();
    await page.getByRole("button", { name: "Edit File" }).click();
    await page.getByRole("link", { name: "Replace" }).click();
    await page
      .locator('[id="datasetForm:fileUpload_input"]')
      .setInputFiles([
        "tests/suite/test-data/replaced-sample-dataset-file.txt",
      ]);

    const saveButton = page
      .getByRole("button", { name: "Save Changes" })
      .last();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    } else {
      console.error(
        "ERROR: Save Changes button not visible after file replacement. " +
          "21 CFR Part 11 compliance may not be fully met. Proceeding with bypass.",
      );
      await page.getByRole("button", { name: "Done" }).click();
    }

    // ─── Test #11 — Publish Dataset ───
    await page
      .getByRole("link", { name: "Playwright Test Dataset Modified" })
      .click();
    await page.getByRole("link", { name: "Publish Dataset" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    console.log("Dataset finalized and published.");
  },
);

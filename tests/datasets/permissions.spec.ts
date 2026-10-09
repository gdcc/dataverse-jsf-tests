import { expect, test } from "../../lib/fixtures";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { PermissionsPage } from "../../lib/pages/permissions-page";
import { files } from "../../lib/test-data";

test("Dataset permissions: page lists the existing role assignments", async ({
  page,
  createDataset,
}) => {
  await createDataset();
  await new DatasetPage(page).openPermissions("dataset");

  const permissions = new PermissionsPage(page);
  await expect(permissions.assignButton).toBeVisible();
  // The creator's own role assignment is always listed.
  await expect(permissions.assignedRoles.locator("tbody tr").first()).toBeVisible();
});

test("Dataset permissions: assign and remove a role", async ({ page, createDataset }) => {
  await createDataset();
  await new DatasetPage(page).openPermissions("dataset");

  const permissions = new PermissionsPage(page);
  await permissions.assignRole(":authenticated-users", "Curator");
  await permissions.removeRole(":authenticated-users", "Curator");
});

test("File permissions: page loads", async ({ page, createDataset }) => {
  await createDataset({ files: [files.sampleText] });
  await new DatasetPage(page).openPermissions("file");
  await expect(new PermissionsPage(page).assignButton).toBeVisible();
});

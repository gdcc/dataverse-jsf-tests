import { test } from "../../lib/fixtures";
import { CollectionPage } from "../../lib/pages/collection-page";
import { PermissionsPage } from "../../lib/pages/permissions-page";

test("Assign and remove a role on a collection", async ({ page, createCollection }) => {
  // Role changes are made on a throwaway collection, never on ROOT_DATAVERSE.
  const { alias } = await createCollection();

  const collection = new CollectionPage(page);
  await collection.goto(alias);
  await collection.openEditMenuItem("managePermissions");

  const permissions = new PermissionsPage(page);
  await permissions.assignRole(":authenticated-users", "Member");
  await permissions.removeRole(":authenticated-users", "Member");
});

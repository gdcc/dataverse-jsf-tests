import { test } from "../../lib/fixtures";
import { CollectionPage } from "../../lib/pages/collection-page";

test("Publish a collection", async ({ page, createCollection }) => {
  // Published collections can still be deleted while they are empty, so
  // the fixture's cleanup removes this one too.
  await createCollection();
  await new CollectionPage(page).publish();
});

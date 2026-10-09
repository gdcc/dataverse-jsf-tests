/**
 * The suite's `test` and `expect`. Every spec imports from here instead of
 * "@playwright/test":
 *
 *   import { test, expect } from "../../lib/fixtures";
 *
 * On top of Playwright's built-ins this adds:
 *
 *   cleanup           Register teardown work. It runs after the test —
 *                     pass or fail — in a fresh tab, newest first.
 *   createCollection  Create a uniquely-named child collection. It is
 *                     deleted automatically after the test.
 *   createDataset     Create a uniquely-named draft dataset. It is deleted
 *                     automatically after the test unless it was published
 *                     (Dataverse offers no UI to delete a published dataset).
 *   trackDataset      Hand a dataset the *test itself* created (because
 *                     creation is what it's testing) to the same cleanup.
 *
 * Tests must never rely on data another test left behind, and must never
 * pick "the first row" of a listing: create what you need with these
 * fixtures and refer to it by the name/URL they return.
 */
import { test as base, expect, type Page } from "@playwright/test";
import { env } from "./env";
import { uniqueAlias, uniqueName } from "./naming";
import { datasetDefaults } from "./test-data";
import { CollectionPage } from "./pages/collection-page";
import { CollectionForm } from "./pages/collection-form";
import { DatasetForm } from "./pages/dataset-form";
import { DatasetPage } from "./pages/dataset-page";

export { expect };
export type { Locator, Page } from "@playwright/test";

type CleanupTask = { label: string; run: (page: Page) => Promise<void> };

export class Cleanup {
  private readonly tasks: CleanupTask[] = [];

  /** Queue teardown work. Tasks run newest-first, so children go before parents. */
  add(label: string, run: (page: Page) => Promise<void>): void {
    this.tasks.push({ label, run });
  }

  /** @internal Runs every task; one failing task never stops the rest. */
  async runAll(newPage: () => Promise<Page>): Promise<string[]> {
    const failures: string[] = [];
    for (const task of [...this.tasks].reverse()) {
      const page = await newPage();
      try {
        await task.run(page);
      } catch (error) {
        failures.push(`${task.label}: ${(error as Error).message.split("\n")[0]}`);
      } finally {
        await page.close();
      }
    }
    return failures;
  }
}

export type Collection = {
  alias: string;
  /** Path to the collection page, e.g. "/dataverse/pw-m1x9k2a7-3f". */
  path: string;
};

export type Dataset = {
  title: string;
  /** Full URL of the dataset page as Dataverse redirected to after saving. */
  url: string;
};

export type CreateCollectionOptions = {
  /** Parent collection alias. Defaults to ROOT_DATAVERSE. */
  parent?: string;
  /** Defaults to a unique "pw-…" alias. */
  alias?: string;
  /** Option value of the Category dropdown. */
  category?: string;
  /**
   * Fill in extra fields on the create form before it is submitted
   * (e.g. a feature-specific setting). The form is already on screen.
   */
  customize?: (page: Page) => Promise<void>;
};

export type CreateDatasetOptions = {
  /** Collection alias to create the dataset in. Defaults to ROOT_DATAVERSE. */
  collection?: string;
  /** Defaults to a unique "Playwright Dataset …" title. */
  title?: string;
  description?: string;
  subject?: string;
  /** Absolute paths of files to upload — see lib/test-data.ts. */
  files?: string[];
};

type Fixtures = {
  cleanup: Cleanup;
  createCollection: (options?: CreateCollectionOptions) => Promise<Collection>;
  createDataset: (options?: CreateDatasetOptions) => Promise<Dataset>;
  trackDataset: (dataset: Dataset) => void;
};

/**
 * Drops the `version=` parameter Dataverse adds after saving
 * (`…&version=DRAFT`), so the URL keeps working after a publish.
 */
export function withoutVersion(url: string): string {
  const u = new URL(url);
  u.searchParams.delete("version");
  return u.toString();
}

/** Deletes a dataset if it is still an unpublished draft. */
async function deleteDatasetIfDraft(page: Page, url: string): Promise<void> {
  const dataset = new DatasetPage(page);
  await dataset.goto(url);
  if (await dataset.isDeletable()) {
    await dataset.delete();
  } else {
    console.log(`cleanup: leaving published dataset in place: ${url}`);
  }
}

async function deleteCollection(page: Page, alias: string): Promise<void> {
  const collection = new CollectionPage(page);
  await collection.goto(alias);
  if (!(await collection.isDeletable())) {
    throw new Error(
      `collection "${alias}" still contains data (probably a published dataset), so ` +
        `Dataverse won't delete it`,
    );
  }
  await collection.delete();
}

export const test = base.extend<Fixtures>({
  cleanup: [
    async ({ context }, use, testInfo) => {
      const cleanup = new Cleanup();
      await use(cleanup);
      const failures = await cleanup.runAll(() => context.newPage());
      for (const failure of failures) {
        // Don't fail the test for a cleanup problem — but make it visible in
        // the report so leaks get noticed and fixed.
        testInfo.annotations.push({ type: "cleanup failed", description: failure });
        console.warn(`cleanup failed — ${failure}`);
      }
    },
    // Teardown gets its own time budget rather than eating into the test's.
    { timeout: 120_000 },
  ],

  trackDataset: async ({ cleanup }, use) => {
    await use((dataset) =>
      cleanup.add(`delete dataset "${dataset.title}"`, (page) =>
        deleteDatasetIfDraft(page, withoutVersion(dataset.url)),
      ),
    );
  },

  createCollection: async ({ page, cleanup }, use) => {
    await use(async (options = {}) => {
      const alias = options.alias ?? uniqueAlias();
      const collection = new CollectionPage(page);
      await collection.goto(options.parent);
      await collection.startNewCollection();

      const form = new CollectionForm(page);
      await form.fillIdentifier(alias);
      await form.selectCategory(options.category ?? "DEPARTMENT");
      await options.customize?.(page);
      await form.create(alias);

      cleanup.add(`delete collection "${alias}"`, (p) => deleteCollection(p, alias));
      return { alias, path: `/dataverse/${alias}` };
    });
  },

  createDataset: async ({ page, trackDataset }, use) => {
    await use(async (options = {}) => {
      const title = options.title ?? uniqueName("Playwright Dataset");
      const collection = new CollectionPage(page);
      await collection.goto(options.collection);
      await collection.startNewDataset();

      const form = new DatasetForm(page);
      await form.fillTitle(title);
      await form.fillDescription(options.description ?? datasetDefaults.description);
      await form.selectSubject(options.subject ?? datasetDefaults.subject);
      if (options.files?.length) await form.uploadFiles(options.files);
      await form.saveNewDataset();

      const dataset = { title, url: withoutVersion(page.url()) };
      trackDataset(dataset);
      return dataset;
    });
  },
});

/** Re-exported so specs can build names for things they create by hand. */
export { uniqueAlias, uniqueName, env };

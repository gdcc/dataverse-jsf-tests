# Test Specifications

What each test checks, from a user's point of view, grouped the same way as
the `tests/` folder. Every test runs in Chromium, Firefox, and WebKit unless
noted.

Every test creates what it needs under a unique name and removes it
afterwards (see [developer guide, Section 2](03_developer_guide.md#every-test-is-independent)).
"Cleanup" below says what that means for each test.

---

## `tests/account/`

### Account menu — [`account-management.spec.ts`](../tests/account/account-management.spec.ts)

*As a logged-in user, I can reach my account pages from the user menu.*

1. **My Data** opens `dataverseuser.xhtml?selectTab=dataRelatedToMe`; if the
   account has data, at least one result card is shown.
2. **Notifications** opens the notifications tab.
3. **Account Information** shows a table with Username, Given Name,
   Family Name, and Email, and the account is marked Verified.
4. **API Token**: "Create Token" produces a token (letters, digits, dashes)
   that expires next year; "Revoke Token" removes it again.

Cleanup: the token is revoked even if the test fails part-way.

---

## `tests/collections/`

All of these work on a throwaway child collection of `ROOT_DATAVERSE`, which
is deleted afterwards. Nothing here changes `ROOT_DATAVERSE` itself.

### Create a collection — [`create-collection.spec.ts`](../tests/collections/create-collection.spec.ts)

*As a researcher, I can create a collection and choose whether it inherits
its parent's settings.*

- **Metadata Fields**: while "inherit from parent" is checked, every metadata
  block checkbox is locked. Unchecking it unlocks all of them except
  Citation (always required). Re-checking asks for confirmation and locks
  them again.
- **Browse/Search Facets**: the facet picker is locked while inheriting and
  unlocked otherwise.
- An HTML description is accepted, and the collection is created at the
  chosen alias with an "Email Dataverse Contact" link.

### Publish a collection — [`publish-collection.spec.ts`](../tests/collections/publish-collection.spec.ts)

Publishing a new collection shows "Your dataverse is now public."

### Theme + Widgets — [`theme-widgets.spec.ts`](../tests/collections/theme-widgets.spec.ts)

1. **Upload images and set tagline and website** — logo, thumbnail, and
   footer images upload; tagline and website URL save with the success
   message.
2. **Remove and replace the thumbnail** — starting from a saved theme,
   removing the thumbnail saves, and uploading a replacement saves.

### Roles — [`roles.spec.ts`](../tests/collections/roles.spec.ts)

Assigns the **Member** role to `:authenticated-users` on the collection,
checks it is listed, removes it, and checks it is gone.

### Dataset templates — [`templates.spec.ts`](../tests/collections/templates.spec.ts)

Creates a template (title, author, contact email, description, subject),
renames it, makes it the collection default, copies it ("Copy of …"), and
deletes both. Cleanup: any template still present if the test fails is
deleted.

### Guestbooks — [`guestbooks.spec.ts`](../tests/collections/guestbooks.spec.ts)

Creates a guestbook that requires name, email, institution, and position,
with a multiple-choice custom question ("Web Search" / "Colleague
Recommendation"); downloads its responses as a file; deletes it.
**Skipped on WebKit**, which opens the CSV inline instead of downloading.

---

## `tests/datasets/`

These create their datasets in `ROOT_DATAVERSE` (or in a throwaway
collection where noted). Draft datasets are deleted afterwards.

### Dataset lifecycle — [`dataset-lifecycle.spec.ts`](../tests/datasets/dataset-lifecycle.spec.ts)

*As a researcher, I can take a dataset from draft to published.*

1. Create a dataset with two text files.
2. Edit its title; the page shows the new title.
3. Edit a file's description.
4. Replace `sample-dataset-file.txt` with `replaced-sample-dataset-file.txt`.
5. Publish; the dataset lists the replacement file and the "Publish Dataset"
   button disappears once Dataverse finishes.

Cleanup: **leaves one published dataset** — the UI can't delete published
datasets.

### Browse — [`browse.spec.ts`](../tests/datasets/browse.spec.ts)

In a throwaway collection holding one new dataset: sort by name, filter to
datasets only, find the dataset **by its title**, open it, and open its
Metadata tab.

### Search — [`search.spec.ts`](../tests/datasets/search.spec.ts)

Searching the collection for a new dataset's exact title finds it (retrying
while the search index catches up). The Advanced Search page then runs a
query that is reflected in the URL.

### Version history — [`version-history.spec.ts`](../tests/datasets/version-history.spec.ts)

Publishes a new dataset, opens its Versions tab, and opens version 1.0.
Cleanup: **leaves one published dataset**.

### Download files — [`download-files.spec.ts`](../tests/datasets/download-files.spec.ts)

With both of a new dataset's two files selected, "Download" produces a
download.

### File upload — [`file-upload.spec.ts`](../tests/datasets/file-upload.spec.ts)

Two tests, each creating a dataset with a batch of files and checking every
file is listed afterwards:

| Test | Uploads | Expects |
|---|---|---|
| Non-ingest formats | `.csv`, `.zip`, `.pdf`, `.R`, `ro-crate-metadata.json` | each file, with the zip unpacked into `readme.txt` and `data.csv` |
| Tabular ingest formats | `.dta`, `.RData`, `.sav`, `.xlsx` | each file |

They are separate so a tabular-ingest failure can't hide a plain-upload
failure.

### Preview URL — [`preview-url.spec.ts`](../tests/datasets/preview-url.spec.ts)

Creates a General Preview URL for a draft dataset, opens it in a logged-out
browser context and sees the "Unpublished Dataset Preview URL" banner, then
disables it.

### Citation download — [`citation-download.spec.ts`](../tests/datasets/citation-download.spec.ts)

A new dataset shows a `https://doi.org/` link. EndNote XML and RIS
downloads have the expected structure and a DOI; BibTeX (opened in a new
tab) has an `@data` entry with a DOI and URL. **Skipped on WebKit**, which
opens XML/RIS inline instead of downloading.

### Permissions — [`permissions.spec.ts`](../tests/datasets/permissions.spec.ts)

1. A dataset's permissions page shows the Assign Roles button and at least
   one existing assignment.
2. Assigning **Curator** to `:authenticated-users` lists it; removing it
   un-lists it.
3. The file permissions page loads.

### Default template with custom terms — [`default-custom-license.spec.ts`](../tests/datasets/default-custom-license.spec.ts)

**Runs only with `CUSTOM_LICENSE_ENABLED=true`.** In a throwaway collection,
creates a template whose terms are "Custom Dataset Terms: All Rights
Reserved" and makes it the default. A new dataset in that collection gets
the template's title and shows those terms on its Terms tab. The default is
then unset.

### Locally FAIR download — [`locally-fair-download.spec.ts`](../tests/datasets/locally-fair-download.spec.ts)

**Runs only with `LOCALLY_FAIR_ENABLED=true`.** Creates a collection with
the test account as its Locally FAIR contact, adds a dataset with two files,
selects both, and downloads them.

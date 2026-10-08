Title: "03. Developer Guide — Setup, Running Tests, and Playwright Tooling"
Date: "October 2026"
```

# 03. Developer Guide

This is the single reference for getting this repo running locally, running
exactly the tests you want to run, and using Playwright's built-in debugging
tools. For what each individual test *does*, see
[`TEST_SPECIFICATIONS.md`](TEST_SPECIFICATIONS.md). To add a test, jump to
[Section 3](#3-writing-a-new-test). For the authentication
adapters, see [`01_shibboleth_auth.md`](01_shibboleth_auth.md).

---

## 1. Clone, Install, and First Run

### Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | Playwright 1.61.x requires Node 18 or later. Any current LTS works. |
| npm | Ships with Node. |
| ~1 GB free disk | `npx playwright install` downloads Chromium, Firefox, and WebKit binaries. |

### Setup

```bash
# 1. Clone into an empty folder
git clone <url-of-this-repository> dataverse-jsf-tests
cd dataverse-jsf-tests   # the folder containing playwright.config.ts

# 2. Install npm dependencies
npm install

# 3. Install the three Playwright browser binaries
npx playwright install
# On a fresh Linux machine (including most CI images) you may also need
# OS-level libraries; use this variant instead:
#   npx playwright install --with-deps

# 4. Create your local environment file
cp .env.example .env
```

### Fill in `.env`

At minimum you must set:

```dotenv
BASE_URL=https://your-dataverse-instance.example.edu
DV_USERNAME=your-username
DV_PASSWORD=your-password
DV_FULL_NAME=Your Full Name
LOGIN_ADAPTER=builtin   # or shibboleth-direct / incommon-seamlessaccess
```

Everything else in `.env.example` is optional and defaults sensibly. The full
reference is in [Section 5](#5-environment-variable-reference) below.

`.env` is gitignored — it is never committed, and there is nothing in the
repo you need to configure besides this file.

### First run

```bash
npx playwright test
```

This runs every test, in Chromium, then Firefox, then WebKit. For each
browser it first logs in (interactively completing a Duo push if your
adapter needs one — see [`01_shibboleth_auth.md`](01_shibboleth_auth.md))
and caches the session in `playwright/.auth/`, so later runs skip the login.

A full three-browser run takes a while. Section 2 shows how to run one
browser or one file.

---

## 2. Running Specific Tests and Browsers

### Layout

There is **one** suite. Every `*.spec.ts` under `tests/` runs in every
browser; nothing is tagged, numbered, or split into separate suites.
Specs are grouped by the part of Dataverse they exercise:

```
tests/
  auth.setup.ts        log in once per browser (not a test)
  account/             the logged-in user's account pages
  collections/         creating and configuring collections
  datasets/            creating, editing, publishing, downloading datasets
  test-data/           files the tests upload
```

### The project list

| Project | What it runs | Depends on |
|---|---|---|
| `setup-chromium` / `setup-firefox` / `setup-webkit` | `tests/auth.setup.ts` (login) | — |
| `chromium` | every spec, Chromium | `setup-chromium` |
| `firefox` | every spec, Firefox | `setup-firefox`, **`chromium`** |
| `webkit` | every spec, WebKit | `setup-webkit`, **`firefox`** |

### ⚠️ `--project=firefox` also runs Chromium

Each browser project depends on the one before it (bolded above), so that
Chromium → Firefox → WebKit always run in that order even if `workers` is
raised. The consequence:

- `npx playwright test --project=chromium` → **only** Chromium.
- `npx playwright test --project=firefox` → Chromium first, then Firefox.
- `npx playwright test --project=webkit` → Chromium, Firefox, then WebKit.

Playwright has no flag to skip a project's `dependencies`. To debug a
Firefox- or WebKit-only failure, either accept the extra run or temporarily
remove that project's previous-browser dependency in `playwright.config.ts`
(don't commit it).

### Common invocations

```bash
# One browser (the usual loop while writing a test)
npx playwright test --project=chromium

# One file
npx playwright test tests/datasets/preview-url.spec.ts --project=chromium

# One folder
npx playwright test tests/collections --project=chromium

# By test title (substring or regex)
npx playwright test --project=chromium -g "Preview URL"
```

### Every test is independent

Any test can be run on its own, in any order. Each one creates the
collections and datasets it needs, under unique names, and deletes them when
it finishes — whether it passed or failed. No test reads state another test
left behind, and none of them picks "the first dataset in the list".

The one thing tests *can't* clean up is a **published** dataset: Dataverse's
UI has no way to delete one. Two tests publish by design
(`datasets/dataset-lifecycle.spec.ts`, `datasets/version-history.spec.ts`)
and each leaves one published dataset in `ROOT_DATAVERSE` per run per
browser. Everything else is removed.

If a cleanup step itself fails, the test still reports its real result,
and the report shows a **"cleanup failed"** annotation saying what was left
behind.

### Tests for optional features

Some tests need a Dataverse feature that not every installation has. They
skip themselves unless the matching flag is `true` in `.env` — see
[Section 5](#5-environment-variable-reference).

---

## 3. Writing a New Test

### The short version

1. Create `tests/<area>/<what-it-does>.spec.ts`. No number, no tag, no
   config change — it is picked up automatically.
2. Import `test` and `expect` from `lib/fixtures`, **not** from
   `@playwright/test`.
3. Create what you need with the fixtures; never depend on existing data.
4. Use the page objects in `lib/pages/` for anything another test also does.

```ts
import { expect, test } from "../../lib/fixtures";
import { DatasetPage } from "../../lib/pages/dataset-page";
import { files } from "../../lib/test-data";

test("Restrict a file", async ({ page, createDataset }) => {
  const dataset = await createDataset({ files: [files.sampleText] });
  // `page` is now on the new dataset's page.
  const datasetPage = new DatasetPage(page);
  // ...
});
```

### Fixtures (`lib/fixtures.ts`)

| Fixture | What it does |
|---|---|
| `createCollection(options?)` | Creates a uniquely-named child of `ROOT_DATAVERSE` (or of `options.parent`) and returns `{ alias, path }`. Deleted after the test. `options.customize(page)` lets you fill extra form fields before it's submitted. |
| `createDataset(options?)` | Creates a uniquely-named draft dataset in `ROOT_DATAVERSE` (or `options.collection`), optionally with `options.files`, and returns `{ title, url }`. Leaves `page` on the dataset. Deleted after the test unless it was published. |
| `trackDataset({ title, url })` | For tests where *creating* the dataset is the thing under test: create it yourself, then hand it to the same cleanup. |
| `cleanup.add(label, async (page) => …)` | Any other teardown (a template, a guestbook, an API token…). Runs after the test, pass or fail, in a fresh tab, newest first — so things created inside a collection are removed before the collection. |

Rule of thumb: if your test changes a collection's settings (roles,
templates, guestbooks, theme), do it on a collection from
`createCollection()`, never on `ROOT_DATAVERSE` itself.

### Page objects (`lib/pages/`)

| File | Covers |
|---|---|
| `collection-page.ts` | A collection's page: Edit menu, Add Data, publish, delete |
| `collection-form.ts` | The New Dataverse form |
| `dataset-form.ts` | The dataset metadata form (create, edit, templates): fields, Subject, file upload, save |
| `dataset-page.ts` | A dataset's page: Edit menu, tabs, select files, publish, delete |
| `permissions-page.ts` | Role assignment for collections and datasets |
| `templates-page.ts` | A collection's Dataset Templates page |

Add a method to a page object when a second test needs the same
interaction; until then it's fine to keep it in the spec.

### Other helpers

| Module | Use it for |
|---|---|
| `lib/env.ts` | Reading configuration. Never read `process.env` in a test. |
| `lib/naming.ts` | `uniqueName("Prefix")` / `uniqueAlias()` for anything you create by hand. |
| `lib/test-data.ts` | Absolute paths to upload fixtures (`files.*`, `images.*`) and default metadata. Add new fixture files to `tests/test-data/` and list them here. |
| `lib/ajax.ts` | `waitForAjaxIdle(page)` — for the rare case where there's no element to assert on after a PrimeFaces partial update. |

### Habits to keep (and the ones this suite has dropped)

- **Find your own data by name or URL.** Never click the first row of a
  results table — on a shared instance that's whatever someone else
  created last.
- **Don't sleep.** No `page.waitForTimeout(...)`. Wait for the thing you
  actually need with a web-first assertion
  (`await expect(locator).toBeVisible()`), or `waitForAjaxIdle`. For search
  results, which depend on asynchronous indexing, retry with
  `expect(async () => { … }).toPass()` (see `datasets/search.spec.ts`).
- **No hard-coded instance details.** URLs, collection paths, and
  credentials all come from `.env`. Tests must pass on a stock Dataverse;
  generic metadata values live in `lib/test-data.ts`.
- **No JSF-generated ids.** Ids like `j_idt218` change whenever the page
  template changes. Prefer roles and labels
  (`getByRole("button", { name: "Save Changes" })`), then stable ids that
  appear in Dataverse's `.xhtml` source (`datasetForm:editMetadata`), then
  suffix matches (`[id$=":questionText"]`).
- **No hidden ordering.** If a test needs something, it creates it.

---

## 4. Playwright Feature Tour

A few Playwright capabilities you'll want while writing or debugging tests
against this repo's PrimeFaces/JSF UI (which is heavy on AJAX re-renders and
dynamic element IDs — see the page objects in `lib/pages/` for the
workarounds already in place).

### Headed mode — watch the browser

The config sets `headless: true` globally, so `npx playwright test` runs with
no visible browser by default. Override on the command line:

```bash
npx playwright test --project=chromium tests/collections/guestbooks.spec.ts --headed
```

Note: `playwright.config.ts` also sets `launchOptions.slowMo` (2 seconds
between actions by default) **globally, including headless runs** — it was
added for stability against a slow, JSF-heavy target. Set `SLOW_MO=0` in
`.env` for much faster local iteration; leave it at the default for CI-like
runs.

### UI Mode — the interactive test runner

```bash
npx playwright test --ui
```

Opens a GUI with a timeline of every action, a live DOM snapshot at each
step, and the ability to re-run individual tests and watch them. This is the
fastest way to understand *why* a JSF selector didn't match. Because of the
project dependency chain ([Section 2](#2-running-specific-tests-and-browsers)), scope `--ui` to a single file/project
where possible, e.g. `npx playwright test --ui tests/collections/guestbooks.spec.ts`.

### Debug mode — step through actions

```bash
npx playwright test --project=chromium tests/collections/guestbooks.spec.ts --debug
# or:
PWDEBUG=1 npx playwright test --project=chromium tests/collections/guestbooks.spec.ts
```

Opens the Playwright Inspector: runs headed, pauses before each action, and
lets you step forward one action at a time or type Playwright API calls into
a console to probe selectors live against the current page.

### Trace Viewer — replaying a run after the fact

The config records a trace for every test, passed or failed (`trace: "on"`).
After a run:

```bash
# The HTML report links each test's trace; or find it under test-results/
npx playwright show-trace test-results/<test-folder>/trace.zip
```

The trace viewer gives you a scrubbable timeline with DOM snapshots, network
requests, and console output for every step of the test — usually
faster than re-running the test to reproduce a flaky failure.

### HTML report

The config always generates an HTML report (`reporter: [["list"], ["html"]]`).
After any run:

```bash
npx playwright show-report
```

Opens the report (default output folder: `playwright-report/`, gitignored)
in your browser — pass/fail summary, per-test duration, and embedded
screenshots, videos and trace links for every test.

### Videos and screenshots

Every test is recorded on video and gets a full-page screenshot at the end,
passed or failed (`video: { mode: "on" }`, `screenshot: { mode: "on" }`).
Both are written under `test-results/`
(gitignored). See [`combine_videos.md`](combine_videos.md) for a script that
stitches a full run's clips into one MP4 for sharing.

### Console and network output

The test code in this repo doesn't wire up `page.on("console", ...)` by
default. To see browser console logs and network activity while debugging
a specific failure, add temporarily inside a test:

```ts
page.on("console", (msg) => console.log(`[browser] ${msg.text()}`));
page.on("requestfailed", (req) => console.log(`[failed] ${req.url()}`));
```

For verbose Playwright-internal API logging (useful when a selector times
out and you're not sure why), run with:

```bash
DEBUG=pw:api npx playwright test --project=chromium tests/collections/guestbooks.spec.ts
```

### Codegen — recording new selectors

When adding a new test against this JSF/PrimeFaces UI, generating selectors
by hand against dynamically-suffixed IDs (`j_idt218:0:...`) is painful.
Playwright's codegen tool records your clicks and emits working selectors:

```bash
npx playwright codegen https://your-dataverse-instance.example.edu
```

You'll still need to log in manually inside the recorded browser window, but
codegen is the fastest way to get a first-draft selector for a new PrimeFaces
widget.

---

## 5. Environment Variable Reference

All variables are read from `.env` at the repo root, through
[`lib/env.ts`](../lib/env.ts) — the only place in the codebase that reads
`process.env`. The
authoritative list of examples lives in [`.env.example`](../.env.example).

### Required

| Variable | Purpose |
|---|---|
| `BASE_URL` | The Dataverse instance under test (no trailing slash). Also determines the auth-cache filename in `playwright/.auth/`. |
| `DV_USERNAME` | Login username/email for the account running the suite. |
| `DV_PASSWORD` | Login password for that account. |
| `DV_FULL_NAME` | The exact display name Dataverse shows in the navbar after login — used to detect a still-valid saved session (so Duo isn't re-triggered every run). |
| `LOGIN_ADAPTER` | Which login flow to run: `shibboleth-direct`, `incommon-seamlessaccess`, or `builtin`. |

A missing required variable fails with a message naming it.

### Optional

| Variable | Default | Purpose |
|---|---|---|
| `ROOT_DATAVERSE` | `/dataverse/root` | The collection the suite works inside. Tests create (and delete) their own child collections and datasets here. The test account needs permission to add both. |
| `CUSTOM_LICENSE_ENABLED` | `false` | Set `true` if the instance offers Custom Dataset Terms; enables `datasets/default-custom-license.spec.ts`. |
| `LOCALLY_FAIR_ENABLED` | `false` | Set `true` if the instance has the Locally FAIR contact field on the collection form; enables `datasets/locally-fair-download.spec.ts`. Not enabled on the Docker build IQSS CI uses (see [`backlog.md`](backlog.md)). |
| `SLOW_MO` | `2000` | Milliseconds to pause between actions. `0` for fast local runs. |

### Login-adapter specific (required by that adapter only)

| Variable | Used by adapter |
|---|---|
| `IDP_SELECTOR_VALUE` | `shibboleth-direct` — the `<option>` value (IdP entity ID) selected in `#idpSelectSelector`. |
| `INCOMMON_INSTITUTION_SEARCH` | `incommon-seamlessaccess` — text typed into the SeamlessAccess institution search box. |
| `INCOMMON_INSTITUTION_LINK` | `incommon-seamlessaccess` — accessible name (or partial match) of the institution result link to click. |

See [`01_shibboleth_auth.md`](01_shibboleth_auth.md) for the full login flow
each adapter drives, and how Duo 2FA and session-cookie persistence work.

### Removed

These no longer do anything and can be deleted from old `.env` files:
`SKIP_PREFLIGHT` (the installation-specific preflight test was removed) and
`PERMISSIONS_DATASET_PID` (the permissions tests always create their own
dataset now).

---

## 6. Where This Suite Actually Fits: Repo Lineage and CI/CD

**There is no GitHub Actions workflow (or any other CI system) in *this*
repository that runs the Playwright suite.** `.github/workflows/` does not
exist here, and this repo is not an npm package — nothing here is published
to the npm registry, and it's distributed by cloning it directly (Section 1
above).

### Repo lineage

Three repositories are involved, and it's important to keep them straight:

| Repo | Role |
|---|---|
| This repository | A prototype/staging fork — where new tests are drafted before being merged upstream into the canonical suite. |
| [`gdcc/dataverse-jsf-tests`](https://github.com/gdcc/dataverse-jsf-tests) | The **canonical upstream test suite**, maintained by the Global Dataverse Community Consortium. This is the copy that CI actually runs (see below) — **not** this fork. |
| [`IQSS/dataverse`](https://github.com/IQSS/dataverse) | The Dataverse application itself. Its own CI checks out `gdcc/dataverse-jsf-tests` and runs it against a freshly-built copy of the application, on every push/PR to `develop`/`master`. |

**Practical implication:** a change made in this fork is not exercised by
IQSS's CI until it is merged into `gdcc/dataverse-jsf-tests`. Treat this repo
as pre-upstream staging, not as the thing CI is actually testing.

`gdcc/dataverse-jsf-tests` still has the older numbered `tests/suite/` +
`tests/regression/` layout; this fork's restructure (feature folders,
fixtures, no tags) has not been merged upstream yet, so
[`TEST_SPECIFICATIONS.md`](TEST_SPECIFICATIONS.md) describes this fork, not
what upstream CI currently runs. One further divergence to be
aware of if/when this fork is merged upstream: `gdcc/dataverse-jsf-tests`'s
`package.json` still uses the old `"kunai-runner"` package name that this
fork has since dropped (see the note at the end of this section) — that
rename hasn't propagated upstream and will need reconciling at merge time.

### The actual CI/CD workflow

Lives in the **`IQSS/dataverse`** repo (not here, not in `gdcc/dataverse-jsf-tests`)
at **`.github/workflows/dataverse_jsf_tests.yml`**. It triggers on
`workflow_dispatch`, and on push/PR to `develop` or `master` (ignoring
doc-only changes). In order, it:

1. Builds Dataverse itself from source via Maven (`mvn -Pct package`, using/building the `container-base` image)
2. Starts the full stack with `mvn -Pct docker:start` — the Dataverse/Payara app container (`dev_dataverse`), Postgres, Solr, and a LocalStack S3 stand-in
3. Polls `http://localhost:8080/api/info/version` until the API reports ready
4. Configures the fresh instance via the admin settings API: `:BuiltinUsersKey=burrito`, `:ProvCollectionEnabled=true`, `:AllowApiTokenLookupViaApi=true`, `:AllowSignUp=true`
5. Checks out **`gdcc/dataverse-jsf-tests`** into a subdirectory, runs `npm ci` (not `npm install` — deterministic, lockfile-only) and `npx playwright install --with-deps`
6. Runs `npx playwright test` against that freshly-built instance with this exact environment — a known-good reference config, useful if you want to point your own local Docker-based Dataverse instance at this suite the same way CI does:

   ```dotenv
   BASE_URL=http://localhost:8080
   LOGIN_ADAPTER=builtin
   DV_USERNAME=dataverseAdmin
   DV_PASSWORD=admin1
   DV_FULL_NAME=Dataverse Admin
   ROOT_DATAVERSE=/dataverse/root
   SKIP_PREFLIGHT=true
   ```

   `SKIP_PREFLIGHT` is ignored by this fork (it has no installation-specific
   preflight test). `/dataverse/root` is the vanilla Dataverse Docker
   image's top-level collection — and this suite's default.
7. On every run (pass or fail), uploads the Playwright HTML report and every
   container's Docker logs as workflow artifacts — check those first when a
   CI run fails and you can't reproduce it locally.

This also explains commit messages like
`perf(config): bump slowMo to 2500ms for CI stability` — they're stabilizing
runs against that IQSS-CI-hosted instance, not tuning a pipeline in this
repo.

### This repo previously had its own (unrelated) CI/CD

Separately from all of the above: this repo once had a GitHub Actions
workflow of its own — an **npm-publishing** workflow
(`.github/workflows/publish.yml`), deleted in commit `1bf495f` ("remove npm
publishing infrastructure; distribute via git clone only"), along with the
npm-package identity in `package.json` and a versioning doc that described
that release process. None of it is related to the IQSS/gdcc pipeline
described above — it was this repo trying to publish itself as an installable
package, which is no longer how it's distributed.

---

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Missing required environment variable "X"` | You skipped `cp .env.example .env` or left a required field blank. See Section 5. |
| Auth setup hangs or repeatedly re-triggers Duo | The cached session in `playwright/.auth/<slug>-<browser>.json` expired. See [`01_shibboleth_auth.md`](01_shibboleth_auth.md) — approve "Yes, trust this browser" for a 7-day cookie, and delete the stale auth file to force a clean re-login. |
| A test's report shows a "cleanup failed" annotation | Something it created couldn't be deleted; the annotation says what. Usually a collection that still holds a published dataset. Safe to delete by hand. |
| Creating a collection or dataset fails at the very first step | The test account can't add content to `ROOT_DATAVERSE` (default `/dataverse/root`). Point it at a collection where it can. |
| `npx playwright test` errors about missing browser binaries | Run `npx playwright install` (add `--with-deps` on Linux). |
| Every action is very slow, even headless | `SLOW_MO` defaults to 2000 ms between actions. Set `SLOW_MO=0` in `.env`. |
| A test reports "skipped" | Its feature flag (`CUSTOM_LICENSE_ENABLED` / `LOCALLY_FAIR_ENABLED`) isn't set, or it's one of the download tests WebKit skips. Expected. |
| `--project=firefox` also re-runs all of Chromium | Expected — see Section 2. |
| WebKit skips the guestbook / citation download tests | Expected — WebKit opens CSV/XML/RIS inline instead of firing a `download` event. |

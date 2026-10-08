# dataverse-jsf-tests
High-performance Dataverse Playwright frontend testing framework and E2E automation scaffolding.

dataverse-jsf-tests is the foundational open-source automation engine and testing scaffolding for IQSS Dataverse. Built for speed, reliability, and developer ergonomics, it provides the core test runner and DOM assertion utilities needed to validate complex frontend architectures. Designed to be highly extensible, it serves as the close-quarters framework for writing, structuring, and executing robust end-to-end web UI tests.

This repository has no CI/CD pipeline of its own. The pipeline that runs these tests lives in [`IQSS/dataverse`](https://github.com/IQSS/dataverse) at `.github/workflows/dataverse_jsf_tests.yml`: it checks out this suite and runs it against a freshly-built Dataverse instance on every push/PR. See [`docs/03_developer_guide.md`](docs/03_developer_guide.md), section 6, for what that pipeline does.

## Steps to Use Dataverse JSF Tests
1. Clone the git repository into an empty folder
2. `cd` into the working directory (the root directory where `playwright.config.ts` exists)
3. `cp .env.example .env`
4. Fill `.env` with your installation-specific values:
   - `BASE_URL` — the Dataverse instance URL
   - `DV_USERNAME` / `DV_PASSWORD` / `DV_FULL_NAME` — login credentials and navbar display name
   - `LOGIN_ADAPTER` — authentication flow (`builtin`, `shibboleth-direct`, or `incommon-seamlessaccess`)
   - `ROOT_DATAVERSE` — the collection the tests create (and clean up) their data in (default `/dataverse/root`)
   - See `.env.example` for all available options
5. `npm install`
6. `npx playwright install`
7. `npx playwright test`

For anything past "it runs" — **writing a new test**, running only a
specific test or browser, Playwright's headed/debug/trace tooling, the full
environment variable reference, and troubleshooting — see
[`docs/03_developer_guide.md`](docs/03_developer_guide.md).

## Adding a test

Create `tests/<area>/<what-it-does>.spec.ts`, import `test`/`expect` from
`lib/fixtures`, and create the data you need with the `createCollection` /
`createDataset` fixtures — they clean up after themselves. No numbering,
tags, or config changes. Details in the
[developer guide, Section 3](docs/03_developer_guide.md#3-writing-a-new-test).

## Documentation Index

| Doc | Covers |
|---|---|
| [`docs/03_developer_guide.md`](docs/03_developer_guide.md) | Clone/setup/run, running specific tests and browsers, writing a new test (fixtures, page objects, conventions), Playwright feature tour, environment variable reference, CI/CD context, troubleshooting |
| [`docs/TEST_SPECIFICATIONS.md`](docs/TEST_SPECIFICATIONS.md) | Plain-English description of every test, grouped like `tests/` |
| [`docs/01_shibboleth_auth.md`](docs/01_shibboleth_auth.md) | Login adapters, Duo 2FA, session-cookie persistence |
| [`docs/backlog.md`](docs/backlog.md) | Test cases deferred, blocked, or ruled out as not automatable |
| [`docs/test_data.md`](docs/test_data.md) | Why the fixture files in `tests/test-data/` exist |
| [`docs/combine_videos.md`](docs/combine_videos.md) | Stitching per-test failure videos into one MP4 |

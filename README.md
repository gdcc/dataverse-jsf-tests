# dataverse-jsf-tests
High-performance Dataverse Playwright frontend testing framework and E2E automation scaffolding.

dataverse-jsf-tests is the foundational open-source automation engine and testing scaffolding for IQSS Dataverse. Built for speed, reliability, and developer ergonomics, it provides the core test runner, DOM assertion utilities, and CI/CD integration pipelines needed to validate complex frontend architectures. Designed to be highly extensible, it serves as the close-quarters framework for writing, structuring, and executing robust end-to-end web UI tests.

## Steps to Use Kunai Runner
1. Clone the git repository into an empty folder
2. `cd` into the working directory (the root directory where `playwright.config.ts` exists)
3. `cp .env.example .env`
4. Fill `.env` with your installation-specific values:
   - `BASE_URL` — the Dataverse instance URL
   - `DV_USERNAME` / `DV_PASSWORD` / `DV_FULL_NAME` — login credentials and navbar display name
   - `LOGIN_ADAPTER` — authentication flow (`shibboleth-direct`, `incommon-seamlessaccess`, or `builtin`)
   - See `.env.example` for all available options
5. `npm install`
6. `npx playwright install`
7. `npx playwright test`

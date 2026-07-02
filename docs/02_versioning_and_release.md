Title: "02. Versioning & Release"
Author: "Snehashish Reddy Manda"
Email: "msreddy@unc.edu"
Date: "June 2026"
```

# 02. Versioning & Release

This document covers the versioning scheme, how releases are published to npm, and how downstream consumers pin to a specific Dataverse version.

---

## Versioning Philosophy

`kunai-runner` tracks the Dataverse version it is designed to test. This makes it easy for an instance operator to find the correct suite for their deployment without reading changelogs.

### Git tag format

```
DV_MAJOR.DV_MINOR.DV_PATCH.SUITE_PATCH
```

| Segment | Meaning |
|---|---|
| `DV_MAJOR.DV_MINOR.DV_PATCH` | The Dataverse release this suite targets (mirrors the upstream version tag) |
| `SUITE_PATCH` | Increments with each new kunai-runner release for the same Dataverse version (new tests, bug fixes, etc.) |

**Examples:**

| Git tag | Meaning |
|---|---|
| `6.10.1.1` | First kunai-runner release for Dataverse 6.10.1 |
| `6.10.1.2` | Second kunai-runner release, still targeting Dataverse 6.10.1 |
| `6.11.0.1` | First kunai-runner release for Dataverse 6.11.0 |

---

## npm Versioning

npm only accepts 3-part semver (`MAJOR.MINOR.PATCH`). The [publish workflow](../.github/workflows/publish.yml) automatically derives a valid npm version from the 4-part Git tag:

```
npm version = DV_MAJOR.DV_MINOR.(DV_PATCH × 100 + SUITE_PATCH)
```

| Git tag | npm version |
|---|---|
| `6.10.1.1` | `6.10.101` |
| `6.10.1.2` | `6.10.102` |
| `6.10.1.10` | `6.10.110` |
| `6.11.0.1` | `6.11.1` |
| `6.11.0.2` | `6.11.2` |

> **Constraint:** `SUITE_PATCH` must stay below 100 (i.e. up to 99 suite releases per Dataverse version) to avoid collisions with the next `DV_PATCH`.

The `version` field in [`package.json`](../package.json) is kept at `0.0.0` and is overwritten in-place by the workflow before packing. **Never edit it manually.**

---

## dist-tags

In addition to the versioned npm publish, the workflow moves a **dist-tag** that always points at the latest kunai-runner build for a given Dataverse version.

| dist-tag | Resolves to |
|---|---|
| `dv-6.10.1` | Latest `6.10.1.x` suite build |
| `dv-6.11.0` | Latest `6.11.0.x` suite build |
| `latest` | Absolute latest suite build across all DV versions |

Inspect the full mapping at any time:

```bash
npm dist-tag ls kunai-runner
```

---

## Installing

```bash
# Latest suite for a specific Dataverse version (recommended for pinned instances)
npm install kunai-runner@dv-6.10.1

# Absolute latest (always up to date)
npm install kunai-runner

# Exact npm version (maximum reproducibility)
npm install kunai-runner@6.10.101
```

---

## Release Workflow

### Prerequisites (one-time setup)

1. Create an npm **Classic Automation Token** at https://www.npmjs.com/settings/~/tokens
2. Add it as a GitHub Actions secret named `NPM_TOKEN`:
   **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

### Publishing a new release

```bash
# 1. Commit and push all changes
git push origin main

# 2. Create and push the 4-part tag
git tag 6.10.1.1
git push origin 6.10.1.1
```

GitHub Actions automatically:
- Derives the 3-part npm version (`6.10.101`)
- Overwrites `package.json` version in the checkout
- Runs `npm ci`
- Publishes with provenance attestation
- Moves the `dv-6.10.1` dist-tag to the new version

Watch the run under **Actions** in the GitHub repository.

---

## Recovery: Bad Release

npm versions are immutable after 72 hours. If a bad version ships:

**1. Immediately move `latest` back to the last good version:**

```bash
npm dist-tag add kunai-runner@6.10.101 latest
```

**2. Deprecate the bad version:**

```bash
npm deprecate kunai-runner@6.10.102 "Breaking change — use dv-6.10.1 or upgrade to 6.10.103"
```

**3. Fix, commit, and tag a new patch:**

```bash
git tag 6.10.1.3
git push origin 6.10.1.3
```

The `dv-6.10.1` dist-tag will automatically move to `6.10.103` once the workflow completes.

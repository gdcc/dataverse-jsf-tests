/**
 * Unique names for everything a test creates.
 *
 * Every collection, dataset, template, and guestbook a test creates must be
 * uniquely named so that (a) tests never collide with each other or with a
 * previous run's leftovers, and (b) a test can always find *its own* object
 * on a page instead of picking "the first row".
 */
let counter = 0;

/** Short, sortable, collision-resistant suffix, e.g. "m1x9k2a7-3f". */
export function uniqueSuffix(): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 4);
  return `${Date.now().toString(36)}${counter.toString(36)}-${random}`;
}

/** Human-readable unique name, e.g. "Playwright Dataset m1x9k2a7-3f". */
export function uniqueName(prefix: string): string {
  return `${prefix} ${uniqueSuffix()}`;
}

/** URL-safe unique collection alias, e.g. "pw-collection-m1x9k2a7-3f". */
export function uniqueAlias(prefix = "pw"): string {
  return `${prefix}-${uniqueSuffix()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

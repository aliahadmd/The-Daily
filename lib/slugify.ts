/**
 * Converts a string into a URL-safe slug.
 * - Lowercases the input
 * - Normalizes unicode via NFD and strips diacritics
 * - Replaces spaces and non-alphanumeric characters with hyphens
 * - Collapses consecutive hyphens into one
 * - Trims leading/trailing hyphens
 * - Falls back to "untitled" if the result is empty
 */
export function slugify(input: string): string {
  const result = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → hyphen
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens

  return result || "untitled";
}

export default slugify;

import type { ArticleCreateInput } from "./queries/articles";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validates required fields for article creation/update.
 * Title, body, categoryId, slug, and authorName must be non-empty.
 */
export function validateArticleInput(
  data: Partial<ArticleCreateInput>
): ValidationResult {
  const errors: string[] = [];

  if (!data.title || data.title.trim() === "") {
    errors.push("title is required");
  }

  if (!data.body || data.body.trim() === "") {
    errors.push("body is required");
  }

  if (data.categoryId === undefined || data.categoryId === null) {
    errors.push("categoryId is required");
  }

  if (!data.slug || data.slug.trim() === "") {
    errors.push("slug is required");
  }

  if (!data.authorName || data.authorName.trim() === "") {
    errors.push("authorName is required");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that a slug contains only lowercase alphanumeric characters and hyphens,
 * with no leading/trailing hyphens and no consecutive hyphens.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

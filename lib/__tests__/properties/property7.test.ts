// Feature: international-newspaper-cms, Property 7: Missing or non-published slug returns null from query
//
// NOTE: Full coverage of this property is already provided in:
//   lib/__tests__/queries/articles.test.ts — "getArticleBySlug" describe block
//
// That file tests:
//   - returns null when db returns empty rows (missing slug)
//   - returns null for any slug when db has no matching published article (property-based, 50 runs)
//   - returns article data when db returns a matching published row
//
// This file adds a minimal pure-logic test to document the null-return contract.

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface ArticleRow {
  slug: string;
  status: ArticleStatus;
}

/**
 * Simulates the lookup logic: find by slug AND status=published.
 * Returns null if not found or not published.
 */
function lookupBySlug(rows: ArticleRow[], slug: string): ArticleRow | null {
  const match = rows.find((r) => r.slug === slug && r.status === "published");
  return match ?? null;
}

describe("Property 7 — Missing or non-published slug returns null", () => {
  it("returns null for any slug not present in the dataset", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record<ArticleRow>({
            slug: fc.string({ minLength: 1, maxLength: 50 }),
            status: fc.constantFrom<ArticleStatus>("draft", "published", "archived"),
          }),
          { maxLength: 20 }
        ),
        fc.string({ minLength: 1, maxLength: 50 }),
        (rows, slug) => {
          // Ensure slug is not in the dataset
          const filteredRows = rows.filter((r) => r.slug !== slug);
          const result = lookupBySlug(filteredRows, slug);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns null for any slug whose article is draft or archived", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom<ArticleStatus>("draft", "archived"),
        (slug, status) => {
          const rows: ArticleRow[] = [{ slug, status }];
          const result = lookupBySlug(rows, slug);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns the article when slug exists and status is published", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (slug) => {
        const rows: ArticleRow[] = [{ slug, status: "published" }];
        const result = lookupBySlug(rows, slug);
        expect(result).not.toBeNull();
        expect(result?.slug).toBe(slug);
        expect(result?.status).toBe("published");
      }),
      { numRuns: 100 }
    );
  });
});

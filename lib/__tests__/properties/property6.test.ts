// Feature: international-newspaper-cms, Property 6: Related articles exclude the current article and respect category

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface Article {
  id: number;
  status: ArticleStatus;
  categoryId: number;
  publishedAt: Date | null;
}

/**
 * Pure logic mirroring getRelatedArticles():
 * - status = published
 * - categoryId = target category
 * - id != current article id
 * - limit 4, ordered by publishedAt DESC
 */
function getRelated(articles: Article[], currentId: number, categoryId: number, limit = 4): Article[] {
  return articles
    .filter(
      (a) =>
        a.status === "published" &&
        a.categoryId === categoryId &&
        a.id !== currentId
    )
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, limit);
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const articleArb = fc.record<Article>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  status: fc.constantFrom<ArticleStatus>("draft", "published", "archived"),
  categoryId: fc.integer({ min: 1, max: 10 }),
  publishedAt: fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
});

const articlesArb = fc.array(articleArb, { minLength: 0, maxLength: 50 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 6 — Related articles exclude current and respect category", () => {
  it("related articles never include the current article", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 1, max: 10 }), (articles, currentId, categoryId) => {
        const result = getRelated(articles, currentId, categoryId);
        expect(result.every((a) => a.id !== currentId)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("related articles are all in the same category", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 1, max: 10 }), (articles, currentId, categoryId) => {
        const result = getRelated(articles, currentId, categoryId);
        for (const a of result) {
          expect(a.categoryId).toBe(categoryId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("related articles are all published", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 1, max: 10 }), (articles, currentId, categoryId) => {
        const result = getRelated(articles, currentId, categoryId);
        for (const a of result) {
          expect(a.status).toBe("published");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("related articles count is at most 4", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 1, max: 10 }), (articles, currentId, categoryId) => {
        const result = getRelated(articles, currentId, categoryId);
        expect(result.length).toBeLessThanOrEqual(4);
      }),
      { numRuns: 100 }
    );
  });

  it("related articles are ordered by publishedAt descending", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 1, max: 10 }), (articles, currentId, categoryId) => {
        const result = getRelated(articles, currentId, categoryId);
        for (let i = 0; i < result.length - 1; i++) {
          const ta = result[i].publishedAt?.getTime() ?? 0;
          const tb = result[i + 1].publishedAt?.getTime() ?? 0;
          expect(ta).toBeGreaterThanOrEqual(tb);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns empty array when no other published articles exist in the category", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), fc.integer({ min: 1, max: 10 }), (currentId, categoryId) => {
        // Only the current article exists in the category
        const articles: Article[] = [{ id: currentId, status: "published", categoryId, publishedAt: new Date() }];
        const result = getRelated(articles, currentId, categoryId);
        expect(result).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});

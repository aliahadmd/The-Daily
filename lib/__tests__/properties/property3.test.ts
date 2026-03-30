// Feature: international-newspaper-cms, Property 3: Only published articles appear in public-facing queries

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface Article {
  id: number;
  status: ArticleStatus;
  slug: string;
  categoryId: number;
  countryId: number | null;
  tagIds: number[];
  publishedAt: Date | null;
}

/** Simulates the WHERE status = 'published' filter applied by all public queries */
function publicFilter(articles: Article[]): Article[] {
  return articles.filter((a) => a.status === "published");
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const statusArb = fc.constantFrom<ArticleStatus>("draft", "published", "archived");

const articleArb = fc.record<Article>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  status: statusArb,
  slug: fc.string({ minLength: 1, maxLength: 80 }),
  categoryId: fc.integer({ min: 1, max: 20 }),
  countryId: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  tagIds: fc.array(fc.integer({ min: 1, max: 50 }), { maxLength: 5 }),
  publishedAt: fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
});

const articlesArb = fc.array(articleArb, { minLength: 0, maxLength: 100 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 3 — Only published articles appear in public-facing queries", () => {
  it("public filter never returns draft articles", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = publicFilter(articles);
        expect(result.every((a) => a.status !== "draft")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("public filter never returns archived articles", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = publicFilter(articles);
        expect(result.every((a) => a.status !== "archived")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("every article in public results has status=published", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = publicFilter(articles);
        for (const a of result) {
          expect(a.status).toBe("published");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("count of public results equals count of published articles in input", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const publishedCount = articles.filter((a) => a.status === "published").length;
        const result = publicFilter(articles);
        expect(result).toHaveLength(publishedCount);
      }),
      { numRuns: 100 }
    );
  });

  it("public filter on all-published input returns all articles", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record<Article>({
            id: fc.integer({ min: 1 }),
            status: fc.constant<ArticleStatus>("published"),
            slug: fc.string({ minLength: 1 }),
            categoryId: fc.integer({ min: 1 }),
            countryId: fc.option(fc.integer({ min: 1 }), { nil: null }),
            tagIds: fc.array(fc.integer({ min: 1 }), { maxLength: 3 }),
            publishedAt: fc.option(fc.date(), { nil: null }),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (articles) => {
          const result = publicFilter(articles);
          expect(result).toHaveLength(articles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("public filter on all-draft input returns empty array", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record<Article>({
            id: fc.integer({ min: 1 }),
            status: fc.constant<ArticleStatus>("draft"),
            slug: fc.string({ minLength: 1 }),
            categoryId: fc.integer({ min: 1 }),
            countryId: fc.option(fc.integer({ min: 1 }), { nil: null }),
            tagIds: fc.array(fc.integer({ min: 1 }), { maxLength: 3 }),
            publishedAt: fc.constant(null),
          }),
          { minLength: 0, maxLength: 30 }
        ),
        (articles) => {
          const result = publicFilter(articles);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

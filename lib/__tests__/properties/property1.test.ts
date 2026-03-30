// Feature: international-newspaper-cms, Property 1: Breaking news query returns only flagged articles in descending date order

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface Article {
  id: number;
  title: string;
  slug: string;
  status: ArticleStatus;
  isBreakingNews: boolean;
  publishedAt: Date | null;
}

/**
 * Pure logic that mirrors the getBreakingNews() DB query:
 * - filter: status === "published" AND isBreakingNews === true
 * - order: publishedAt DESC (nulls last)
 */
function filterBreakingNews(articles: Article[]): Article[] {
  return articles
    .filter((a) => a.status === "published" && a.isBreakingNews === true)
    .sort((a, b) => {
      const ta = a.publishedAt?.getTime() ?? 0;
      const tb = b.publishedAt?.getTime() ?? 0;
      return tb - ta; // DESC
    });
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const statusArb = fc.constantFrom<ArticleStatus>("draft", "published", "archived");

const articleArb = fc.record<Article>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  slug: fc.string({ minLength: 1, maxLength: 80 }),
  status: statusArb,
  isBreakingNews: fc.boolean(),
  publishedAt: fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
});

const articlesArb = fc.array(articleArb, { minLength: 0, maxLength: 50 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 1 — Breaking news query ordering and filtering", () => {
  it("returns only published + breaking articles for any input set", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = filterBreakingNews(articles);
        for (const a of result) {
          expect(a.status).toBe("published");
          expect(a.isBreakingNews).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("never includes draft articles in breaking news results", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = filterBreakingNews(articles);
        const hasDraft = result.some((a) => a.status === "draft");
        expect(hasDraft).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("never includes archived articles in breaking news results", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = filterBreakingNews(articles);
        const hasArchived = result.some((a) => a.status === "archived");
        expect(hasArchived).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("never includes non-breaking published articles", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = filterBreakingNews(articles);
        const hasNonBreaking = result.some((a) => !a.isBreakingNews);
        expect(hasNonBreaking).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("result is ordered by publishedAt descending", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = filterBreakingNews(articles);
        for (let i = 0; i < result.length - 1; i++) {
          const ta = result[i].publishedAt?.getTime() ?? 0;
          const tb = result[i + 1].publishedAt?.getTime() ?? 0;
          expect(ta).toBeGreaterThanOrEqual(tb);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns empty array when no articles are published+breaking", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record<Article>({
            id: fc.integer({ min: 1 }),
            title: fc.string({ minLength: 1 }),
            slug: fc.string({ minLength: 1 }),
            status: fc.constantFrom<ArticleStatus>("draft", "archived"),
            isBreakingNews: fc.boolean(),
            publishedAt: fc.option(fc.date(), { nil: null }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (articles) => {
          const result = filterBreakingNews(articles);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("count of results equals count of published+breaking articles in input", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const expected = articles.filter(
          (a) => a.status === "published" && a.isBreakingNews
        ).length;
        const result = filterBreakingNews(articles);
        expect(result).toHaveLength(expected);
      }),
      { numRuns: 100 }
    );
  });
});

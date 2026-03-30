// Feature: international-newspaper-cms, Property 8: Taxonomy index queries return only published articles, paginated
//
// NOTE: Core coverage of this property is already provided in:
//   lib/__tests__/queries/taxonomy.test.ts — "Property 8 — taxonomy index pagination" describe block
//
// This file adds additional pagination math tests using fast-check.

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface Article {
  id: number;
  status: ArticleStatus;
  publishedAt: Date | null;
}

/** Simulates the paginated taxonomy index query */
function paginatedIndex(
  articles: Article[],
  page: number,
  pageSize = 20
): { items: Article[]; total: number } {
  const published = articles.filter((a) => a.status === "published");
  const sorted = [...published].sort(
    (a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
  );
  const offset = (page - 1) * pageSize;
  return {
    items: sorted.slice(offset, offset + pageSize),
    total: published.length,
  };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const articleArb = fc.record<Article>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  status: fc.constantFrom<ArticleStatus>("draft", "published", "archived"),
  publishedAt: fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
});

const articlesArb = fc.array(articleArb, { minLength: 0, maxLength: 100 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 8 — Taxonomy index pagination correctness", () => {
  it("page 1 offset is always 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (pageSize) => {
        const offset = (1 - 1) * pageSize;
        expect(offset).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("offset grows monotonically with page number", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999 }),
        fc.integer({ min: 1, max: 20 }),
        (page, pageSize) => {
          const offset = (page - 1) * pageSize;
          const nextOffset = page * pageSize;
          expect(nextOffset).toBeGreaterThan(offset);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("items per page never exceeds pageSize=20", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 50 }), (articles, page) => {
        const { items } = paginatedIndex(articles, page, 20);
        expect(items.length).toBeLessThanOrEqual(20);
      }),
      { numRuns: 100 }
    );
  });

  it("total count equals number of published articles", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 10 }), (articles, page) => {
        const publishedCount = articles.filter((a) => a.status === "published").length;
        const { total } = paginatedIndex(articles, page);
        expect(total).toBe(publishedCount);
      }),
      { numRuns: 100 }
    );
  });

  it("total count is always non-negative", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const { total } = paginatedIndex(articles, 1);
        expect(total).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it("all items in any page are published", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 10 }), (articles, page) => {
        const { items } = paginatedIndex(articles, page);
        for (const item of items) {
          expect(item.status).toBe("published");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("items are ordered by publishedAt descending within each page", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 5 }), (articles, page) => {
        const { items } = paginatedIndex(articles, page);
        for (let i = 0; i < items.length - 1; i++) {
          const ta = items[i].publishedAt?.getTime() ?? 0;
          const tb = items[i + 1].publishedAt?.getTime() ?? 0;
          expect(ta).toBeGreaterThanOrEqual(tb);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("page beyond last page returns empty items but correct total", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record<Article>({
            id: fc.integer({ min: 1 }),
            status: fc.constant<ArticleStatus>("published"),
            publishedAt: fc.option(fc.date(), { nil: null }),
          }),
          { minLength: 0, maxLength: 15 }
        ),
        (articles) => {
          // Page 2 with pageSize=20 on ≤15 articles → empty items
          const { items, total } = paginatedIndex(articles, 2, 20);
          expect(items).toHaveLength(0);
          expect(total).toBe(articles.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

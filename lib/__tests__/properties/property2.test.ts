// Feature: international-newspaper-cms, Property 2: Homepage section queries return at most N articles

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface Article {
  id: number;
  status: ArticleStatus;
  isFeatured: boolean;
  categoryId: number;
  countryId: number | null;
  publishedAt: Date | null;
}

// ─── Pure logic mirrors the DB queries ───────────────────────────────────────

function getFeatured(articles: Article[], limit = 5): Article[] {
  return articles
    .filter((a) => a.status === "published" && a.isFeatured)
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, limit);
}

function getLatest(articles: Article[], limit = 10): Article[] {
  return articles
    .filter((a) => a.status === "published")
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, limit);
}

function getByCategory(articles: Article[], categoryId: number, limit = 4): Article[] {
  return articles
    .filter((a) => a.status === "published" && a.categoryId === categoryId)
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, limit);
}

function getWorldNews(articles: Article[], countryId: number, limit = 3): Article[] {
  return articles
    .filter((a) => a.status === "published" && a.countryId === countryId)
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, limit);
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const articleArb = fc.record<Article>({
  id: fc.integer({ min: 1, max: 1_000_000 }),
  status: fc.constantFrom<ArticleStatus>("draft", "published", "archived"),
  isFeatured: fc.boolean(),
  categoryId: fc.integer({ min: 1, max: 10 }),
  countryId: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
  publishedAt: fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
});

const articlesArb = fc.array(articleArb, { minLength: 0, maxLength: 100 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 2 — Homepage section N-limit queries", () => {
  it("featured articles section returns at most 5 articles", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = getFeatured(articles);
        expect(result.length).toBeLessThanOrEqual(5);
      }),
      { numRuns: 100 }
    );
  });

  it("latest news section returns at most 10 articles", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = getLatest(articles);
        expect(result.length).toBeLessThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });

  it("by-category section returns at most 4 articles per category", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 10 }), (articles, categoryId) => {
        const result = getByCategory(articles, categoryId);
        expect(result.length).toBeLessThanOrEqual(4);
      }),
      { numRuns: 100 }
    );
  });

  it("world news section returns at most 3 articles per country", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 5 }), (articles, countryId) => {
        const result = getWorldNews(articles, countryId);
        expect(result.length).toBeLessThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });

  it("all homepage sections return only published articles", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 10 }), fc.integer({ min: 1, max: 5 }), (articles, catId, countryId) => {
        const featured = getFeatured(articles);
        const latest = getLatest(articles);
        const byCategory = getByCategory(articles, catId);
        const worldNews = getWorldNews(articles, countryId);

        for (const a of [...featured, ...latest, ...byCategory, ...worldNews]) {
          expect(a.status).toBe("published");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("all homepage sections are ordered by publishedAt descending", () => {
    fc.assert(
      fc.property(articlesArb, fc.integer({ min: 1, max: 10 }), fc.integer({ min: 1, max: 5 }), (articles, catId, countryId) => {
        const sections = [
          getFeatured(articles),
          getLatest(articles),
          getByCategory(articles, catId),
          getWorldNews(articles, countryId),
        ];

        for (const section of sections) {
          for (let i = 0; i < section.length - 1; i++) {
            const ta = section[i].publishedAt?.getTime() ?? 0;
            const tb = section[i + 1].publishedAt?.getTime() ?? 0;
            expect(ta).toBeGreaterThanOrEqual(tb);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("featured section only includes articles with isFeatured=true", () => {
    fc.assert(
      fc.property(articlesArb, (articles) => {
        const result = getFeatured(articles);
        for (const a of result) {
          expect(a.isFeatured).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});

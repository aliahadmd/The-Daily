// Feature: international-newspaper-cms, Property 23: JSON-LD structured data contains required NewsArticle fields

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

interface ArticleData {
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: Date | null;
  updatedAt: Date;
  categoryName: string | null;
}

interface JsonLd {
  "@context": string;
  "@type": string;
  headline: string;
  description: string | null | undefined;
  image: string | undefined;
  author: { "@type": string; name: string };
  datePublished: string | undefined;
  dateModified: string | undefined;
  articleSection: string | null | undefined;
}

/**
 * Pure JSON-LD generation logic mirroring app/articles/[slug]/page.tsx
 */
function buildJsonLd(article: ArticleData): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    author: { "@type": "Person", name: article.authorName },
    datePublished: article.publishedAt && !isNaN(article.publishedAt.getTime())
      ? article.publishedAt.toISOString()
      : undefined,
    dateModified: article.updatedAt && !isNaN(article.updatedAt.getTime())
      ? article.updatedAt.toISOString()
      : undefined,
    image: article.coverImageUrl ?? undefined,
    articleSection: article.categoryName,
  };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const articleArb = fc.record<ArticleData>({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  excerpt: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  coverImageUrl: fc.option(fc.webUrl(), { nil: null }),
  authorName: fc.string({ minLength: 1, maxLength: 100 }),
  publishedAt: fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
  updatedAt: fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }),
  categoryName: fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: null }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 23 — JSON-LD structured data contains required NewsArticle fields", () => {
  it("JSON-LD always has @context = https://schema.org", () => {
    fc.assert(
      fc.property(articleArb, (article) => {
        const jsonLd = buildJsonLd(article);
        expect(jsonLd["@context"]).toBe("https://schema.org");
      }),
      { numRuns: 100 }
    );
  });

  it("JSON-LD always has @type = NewsArticle", () => {
    fc.assert(
      fc.property(articleArb, (article) => {
        const jsonLd = buildJsonLd(article);
        expect(jsonLd["@type"]).toBe("NewsArticle");
      }),
      { numRuns: 100 }
    );
  });

  it("JSON-LD headline always equals the article title", () => {
    fc.assert(
      fc.property(articleArb, (article) => {
        const jsonLd = buildJsonLd(article);
        expect(jsonLd.headline).toBe(article.title);
      }),
      { numRuns: 100 }
    );
  });

  it("JSON-LD description always equals the article excerpt", () => {
    fc.assert(
      fc.property(articleArb, (article) => {
        const jsonLd = buildJsonLd(article);
        expect(jsonLd.description).toBe(article.excerpt);
      }),
      { numRuns: 100 }
    );
  });

  it("JSON-LD image equals coverImageUrl when present", () => {
    fc.assert(
      fc.property(
        fc.record<ArticleData>({
          title: fc.string({ minLength: 1 }),
          excerpt: fc.option(fc.string({ minLength: 1 }), { nil: null }),
          coverImageUrl: fc.webUrl(), // always present
          authorName: fc.string({ minLength: 1 }),
          publishedAt: fc.option(fc.date(), { nil: null }),
          updatedAt: fc.date(),
          categoryName: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        }),
        (article) => {
          const jsonLd = buildJsonLd(article);
          expect(jsonLd.image).toBe(article.coverImageUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("JSON-LD image is undefined when coverImageUrl is null", () => {
    fc.assert(
      fc.property(
        fc.record<ArticleData>({
          title: fc.string({ minLength: 1 }),
          excerpt: fc.option(fc.string({ minLength: 1 }), { nil: null }),
          coverImageUrl: fc.constant(null),
          authorName: fc.string({ minLength: 1 }),
          publishedAt: fc.option(fc.date(), { nil: null }),
          updatedAt: fc.date(),
          categoryName: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        }),
        (article) => {
          const jsonLd = buildJsonLd(article);
          expect(jsonLd.image).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("JSON-LD always has headline, description, and image keys present", () => {
    fc.assert(
      fc.property(articleArb, (article) => {
        const jsonLd = buildJsonLd(article);
        expect(jsonLd).toHaveProperty("headline");
        expect(jsonLd).toHaveProperty("description");
        expect(jsonLd).toHaveProperty("image");
      }),
      { numRuns: 100 }
    );
  });

  it("JSON-LD headline is always a non-empty string", () => {
    fc.assert(
      fc.property(articleArb, (article) => {
        const jsonLd = buildJsonLd(article);
        expect(typeof jsonLd.headline).toBe("string");
        expect(jsonLd.headline.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

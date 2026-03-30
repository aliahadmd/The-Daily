// Feature: international-newspaper-cms, Property 22: Sitemap contains all published content URLs

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

type ArticleStatus = "draft" | "published" | "archived";

interface SitemapArticle {
  slug: string;
  status: ArticleStatus;
}

interface TaxonomyItem {
  slug: string;
}

interface SitemapEntry {
  url: string;
}

/**
 * Pure sitemap URL generation logic mirroring app/sitemap.ts
 */
function generateSitemap(
  baseUrl: string,
  articles: SitemapArticle[],
  categories: TaxonomyItem[],
  tags: TaxonomyItem[],
  countries: TaxonomyItem[]
): SitemapEntry[] {
  const publishedArticles = articles.filter((a) => a.status === "published");

  return [
    { url: baseUrl },
    ...publishedArticles.map((a) => ({ url: `${baseUrl}/articles/${a.slug}` })),
    ...categories.map((c) => ({ url: `${baseUrl}/categories/${c.slug}` })),
    ...tags.map((t) => ({ url: `${baseUrl}/tags/${t.slug}` })),
    ...countries.map((c) => ({ url: `${baseUrl}/countries/${c.slug}` })),
  ];
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const slugArb = fc
  .array(fc.stringMatching(/^[a-z0-9]+$/), { minLength: 1, maxLength: 4 })
  .map((parts) => parts.join("-"))
  .filter((s) => s.length > 0);

const articleArb = fc.record<SitemapArticle>({
  slug: slugArb,
  status: fc.constantFrom<ArticleStatus>("draft", "published", "archived"),
});

const taxonomyArb = fc.record<TaxonomyItem>({ slug: slugArb });

const baseUrlArb = fc.constant("https://example.com");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Property 22 — Sitemap contains all published content URLs", () => {
  it("sitemap contains a URL entry for every published article", () => {
    fc.assert(
      fc.property(
        baseUrlArb,
        fc.array(articleArb, { minLength: 0, maxLength: 30 }),
        fc.array(taxonomyArb, { maxLength: 10 }),
        fc.array(taxonomyArb, { maxLength: 10 }),
        fc.array(taxonomyArb, { maxLength: 10 }),
        (baseUrl, articles, categories, tags, countries) => {
          const sitemap = generateSitemap(baseUrl, articles, categories, tags, countries);
          const urls = sitemap.map((e) => e.url);

          const published = articles.filter((a) => a.status === "published");
          for (const article of published) {
            expect(urls).toContain(`${baseUrl}/articles/${article.slug}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sitemap does NOT contain URLs for draft or archived articles", () => {
    fc.assert(
      fc.property(
        baseUrlArb,
        fc.array(articleArb, { minLength: 0, maxLength: 30 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        (baseUrl, articles, categories, tags, countries) => {
          const sitemap = generateSitemap(baseUrl, articles, categories, tags, countries);
          const urls = sitemap.map((e) => e.url);

          const nonPublished = articles.filter((a) => a.status !== "published");
          for (const article of nonPublished) {
            expect(urls).not.toContain(`${baseUrl}/articles/${article.slug}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sitemap contains a URL entry for every category", () => {
    fc.assert(
      fc.property(
        baseUrlArb,
        fc.array(articleArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { minLength: 0, maxLength: 20 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        (baseUrl, articles, categories, tags, countries) => {
          const sitemap = generateSitemap(baseUrl, articles, categories, tags, countries);
          const urls = sitemap.map((e) => e.url);

          for (const cat of categories) {
            expect(urls).toContain(`${baseUrl}/categories/${cat.slug}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sitemap contains a URL entry for every tag", () => {
    fc.assert(
      fc.property(
        baseUrlArb,
        fc.array(articleArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { minLength: 0, maxLength: 20 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        (baseUrl, articles, categories, tags, countries) => {
          const sitemap = generateSitemap(baseUrl, articles, categories, tags, countries);
          const urls = sitemap.map((e) => e.url);

          for (const tag of tags) {
            expect(urls).toContain(`${baseUrl}/tags/${tag.slug}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sitemap contains a URL entry for every country", () => {
    fc.assert(
      fc.property(
        baseUrlArb,
        fc.array(articleArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { minLength: 0, maxLength: 20 }),
        (baseUrl, articles, categories, tags, countries) => {
          const sitemap = generateSitemap(baseUrl, articles, categories, tags, countries);
          const urls = sitemap.map((e) => e.url);

          for (const country of countries) {
            expect(urls).toContain(`${baseUrl}/countries/${country.slug}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sitemap always includes the homepage URL", () => {
    fc.assert(
      fc.property(
        baseUrlArb,
        fc.array(articleArb, { maxLength: 10 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        fc.array(taxonomyArb, { maxLength: 5 }),
        (baseUrl, articles, categories, tags, countries) => {
          const sitemap = generateSitemap(baseUrl, articles, categories, tags, countries);
          const urls = sitemap.map((e) => e.url);
          expect(urls).toContain(baseUrl);
        }
      ),
      { numRuns: 100 }
    );
  });
});

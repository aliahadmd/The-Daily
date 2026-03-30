import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { articles, categories, tags, countries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [publishedArticles, allCategories, allTags, allCountries] = await Promise.all([
    db
      .select({ slug: articles.slug, updatedAt: articles.updatedAt })
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.updatedAt)),
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: tags.slug }).from(tags),
    db.select({ slug: countries.slug }).from(countries),
  ]);

  const articleEntries: MetadataRoute.Sitemap = publishedArticles.map((a) => ({
    url: `${baseUrl}/articles/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = allTags.map((t) => ({
    url: `${baseUrl}/tags/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  const countryEntries: MetadataRoute.Sitemap = allCountries.map((c) => ({
    url: `${baseUrl}/countries/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    ...articleEntries,
    ...categoryEntries,
    ...tagEntries,
    ...countryEntries,
  ];
}

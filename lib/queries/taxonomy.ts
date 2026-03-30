import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db";
import { categories, tags, countries, articles, articleTags, media } from "../db/schema";

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      createdAt: categories.createdAt,
      articleCount: sql<number>`cast(count(${articles.id}) as int)`,
    })
    .from(categories)
    .leftJoin(
      articles,
      and(eq(articles.categoryId, categories.id), eq(articles.status, "published"))
    )
    .groupBy(categories.id);
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      createdAt: categories.createdAt,
      articleCount: sql<number>`cast(count(${articles.id}) as int)`,
    })
    .from(categories)
    .leftJoin(
      articles,
      and(eq(articles.categoryId, categories.id), eq(articles.status, "published"))
    )
    .where(eq(categories.slug, slug))
    .groupBy(categories.id);

  return rows[0] ?? null;
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const [inserted] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
    })
    .returning({ id: categories.id, slug: categories.slug });

  return { id: inserted.id, slug: inserted.slug };
}

export async function updateCategory(
  id: number,
  data: Partial<{ name: string; slug: string; description: string }>
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;

  await db.update(categories).set(updateData).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const countResult = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(articles)
    .where(eq(articles.categoryId, id));

  const articleCount = countResult[0]?.total ?? 0;

  await db.delete(categories).where(eq(categories.id, id));

  return articleCount;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTags() {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
      articleCount: sql<number>`cast(count(${articleTags.articleId}) as int)`,
    })
    .from(tags)
    .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
    .groupBy(tags.id);
}

export async function getTagBySlug(slug: string) {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
      articleCount: sql<number>`cast(count(${articleTags.articleId}) as int)`,
    })
    .from(tags)
    .leftJoin(articleTags, eq(articleTags.tagId, tags.id))
    .where(eq(tags.slug, slug))
    .groupBy(tags.id);

  return rows[0] ?? null;
}

export async function createTag(data: { name: string; slug: string }) {
  const [inserted] = await db
    .insert(tags)
    .values({ name: data.name, slug: data.slug })
    .returning({ id: tags.id, slug: tags.slug });

  return { id: inserted.id, slug: inserted.slug };
}

export async function updateTag(
  id: number,
  data: Partial<{ name: string; slug: string }>
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;

  await db.update(tags).set(updateData).where(eq(tags.id, id));
}

export async function deleteTag(id: number): Promise<void> {
  // article_tags cascade on delete, so just delete the tag
  await db.delete(tags).where(eq(tags.id, id));
}

// ─── Countries ────────────────────────────────────────────────────────────────

export async function getCountries() {
  return db
    .select({
      id: countries.id,
      name: countries.name,
      slug: countries.slug,
      isoCode: countries.isoCode,
      createdAt: countries.createdAt,
      articleCount: sql<number>`cast(count(${articles.id}) as int)`,
    })
    .from(countries)
    .leftJoin(
      articles,
      and(eq(articles.countryId, countries.id), eq(articles.status, "published"))
    )
    .groupBy(countries.id);
}

export async function getCountryBySlug(slug: string) {
  const rows = await db
    .select({
      id: countries.id,
      name: countries.name,
      slug: countries.slug,
      isoCode: countries.isoCode,
      createdAt: countries.createdAt,
      articleCount: sql<number>`cast(count(${articles.id}) as int)`,
    })
    .from(countries)
    .leftJoin(
      articles,
      and(eq(articles.countryId, countries.id), eq(articles.status, "published"))
    )
    .where(eq(countries.slug, slug))
    .groupBy(countries.id);

  return rows[0] ?? null;
}

export async function createCountry(data: {
  name: string;
  slug: string;
  isoCode: string;
}) {
  const [inserted] = await db
    .insert(countries)
    .values({ name: data.name, slug: data.slug, isoCode: data.isoCode })
    .returning({ id: countries.id, slug: countries.slug });

  return { id: inserted.id, slug: inserted.slug };
}

export async function updateCountry(
  id: number,
  data: Partial<{ name: string; slug: string; isoCode: string }>
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.isoCode !== undefined) updateData.isoCode = data.isoCode;

  await db.update(countries).set(updateData).where(eq(countries.id, id));
}

export async function deleteCountry(id: number) {
  const countResult = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(articles)
    .where(eq(articles.countryId, id));

  const articleCount = countResult[0]?.total ?? 0;

  await db.delete(countries).where(eq(countries.id, id));

  return articleCount;
}

// ─── Articles by Tag ──────────────────────────────────────────────────────────

export async function getArticlesByTag(
  tagId: number,
  page = 1,
  pageSize = 20
) {
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        publishedAt: articles.publishedAt,
        authorName: articles.authorName,
        isBreakingNews: articles.isBreakingNews,
        isFeatured: articles.isFeatured,
        coverImageId: articles.coverImageId,
        coverImageUrl: media.url,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articleTags)
      .innerJoin(articles, eq(articleTags.articleId, articles.id))
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.coverImageId, media.id))
      .where(and(eq(articleTags.tagId, tagId), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(articleTags)
      .innerJoin(articles, eq(articleTags.articleId, articles.id))
      .where(and(eq(articleTags.tagId, tagId), eq(articles.status, "published"))),
  ]);

  return { articles: rows, total: countResult[0]?.total ?? 0 };
}

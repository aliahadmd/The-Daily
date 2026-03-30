import { eq, and, desc, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { articles, articleTags, categories, countries, media, tags } from "../db/schema";

export type ArticleCreateInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
  isBreakingNews?: boolean;
  isFeatured?: boolean;
  coverImageId?: number | null;
  videoId?: number | null;
  videoEmbedUrl?: string | null;
  categoryId: number;
  countryId?: number | null;
  authorName: string;
  tagIds?: number[];
};

// ─── Read queries ────────────────────────────────────────────────────────────

export async function getBreakingNews() {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: articles.authorName,
      isBreakingNews: articles.isBreakingNews,
      isFeatured: articles.isFeatured,
      categoryId: articles.categoryId,
      countryId: articles.countryId,
      coverImageId: articles.coverImageId,
    })
    .from(articles)
    .where(and(eq(articles.status, "published"), eq(articles.isBreakingNews, true)))
    .orderBy(desc(articles.publishedAt));
}

export async function getFeaturedArticles(limit = 5) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: articles.authorName,
      isBreakingNews: articles.isBreakingNews,
      isFeatured: articles.isFeatured,
      categoryId: articles.categoryId,
      countryId: articles.countryId,
      coverImageId: articles.coverImageId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      coverImageUrl: media.url,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(media, eq(articles.coverImageId, media.id))
    .where(and(eq(articles.status, "published"), eq(articles.isFeatured, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getLatestArticles(limit = 10) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: articles.authorName,
      isBreakingNews: articles.isBreakingNews,
      isFeatured: articles.isFeatured,
      categoryId: articles.categoryId,
      countryId: articles.countryId,
      coverImageId: articles.coverImageId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      coverImageUrl: media.url,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(media, eq(articles.coverImageId, media.id))
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticlesByCategory(
  categoryId: number,
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
      })
      .from(articles)
      .leftJoin(media, eq(articles.coverImageId, media.id))
      .where(and(eq(articles.status, "published"), eq(articles.categoryId, categoryId)))
      .orderBy(desc(articles.publishedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(articles)
      .where(and(eq(articles.status, "published"), eq(articles.categoryId, categoryId))),
  ]);

  return { articles: rows, total: countResult[0]?.total ?? 0 };
}

export async function getArticlesByCountry(
  countryId: number,
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
      })
      .from(articles)
      .leftJoin(media, eq(articles.coverImageId, media.id))
      .where(and(eq(articles.status, "published"), eq(articles.countryId, countryId)))
      .orderBy(desc(articles.publishedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(articles)
      .where(and(eq(articles.status, "published"), eq(articles.countryId, countryId))),
  ]);

  return { articles: rows, total: countResult[0]?.total ?? 0 };
}

export async function getArticleBySlug(slug: string) {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      body: articles.body,
      status: articles.status,
      isBreakingNews: articles.isBreakingNews,
      isFeatured: articles.isFeatured,
      authorName: articles.authorName,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      videoEmbedUrl: articles.videoEmbedUrl,
      categoryId: articles.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      countryId: countries.id,
      countryName: countries.name,
      countrySlug: countries.slug,
      countryIsoCode: countries.isoCode,
      coverImageId: articles.coverImageId,
      coverImageUrl: media.url,
      videoId: articles.videoId,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(countries, eq(articles.countryId, countries.id))
    .leftJoin(media, eq(articles.coverImageId, media.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")));

  if (rows.length === 0) return null;

  const article = rows[0];

  // Fetch video media URL separately if videoId is set
  let videoUrl: string | null = null;
  if (article.videoId) {
    const videoMedia = await db
      .select({ url: media.url })
      .from(media)
      .where(eq(media.id, article.videoId));
    videoUrl = videoMedia[0]?.url ?? null;
  }

  // Fetch tags for this article
  const articleTagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(articleTags)
    .innerJoin(tags, eq(articleTags.tagId, tags.id))
    .where(eq(articleTags.articleId, article.id));

  return {
    ...article,
    videoUrl,
    tags: articleTagRows,
  };
}

export async function getRelatedArticles(
  articleId: number,
  categoryId: number,
  limit = 4
) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      authorName: articles.authorName,
      coverImageId: articles.coverImageId,
      coverImageUrl: media.url,
    })
    .from(articles)
    .leftJoin(media, eq(articles.coverImageId, media.id))
    .where(
      and(
        eq(articles.status, "published"),
        eq(articles.categoryId, categoryId),
        ne(articles.id, articleId)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

// ─── Write queries ────────────────────────────────────────────────────────────

export async function createArticle(data: ArticleCreateInput) {
  const { tagIds = [], ...articleData } = data;

  const [inserted] = await db
    .insert(articles)
    .values({
      title: articleData.title,
      slug: articleData.slug,
      excerpt: articleData.excerpt ?? null,
      body: articleData.body,
      isBreakingNews: articleData.isBreakingNews ?? false,
      isFeatured: articleData.isFeatured ?? false,
      coverImageId: articleData.coverImageId ?? null,
      videoId: articleData.videoId ?? null,
      videoEmbedUrl: articleData.videoEmbedUrl ?? null,
      categoryId: articleData.categoryId,
      countryId: articleData.countryId ?? null,
      authorName: articleData.authorName,
    })
    .returning({ id: articles.id, slug: articles.slug });

  if (tagIds.length > 0) {
    await db.insert(articleTags).values(
      tagIds.map((tagId) => ({ articleId: inserted.id, tagId }))
    );
  }

  return { id: inserted.id, slug: inserted.slug };
}

export async function updateArticle(id: number, data: Partial<ArticleCreateInput>) {
  const { tagIds, ...fields } = data;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.slug !== undefined) updateData.slug = fields.slug;
  if (fields.excerpt !== undefined) updateData.excerpt = fields.excerpt;
  if (fields.body !== undefined) updateData.body = fields.body;
  if (fields.isBreakingNews !== undefined) updateData.isBreakingNews = fields.isBreakingNews;
  if (fields.isFeatured !== undefined) updateData.isFeatured = fields.isFeatured;
  if (fields.coverImageId !== undefined) updateData.coverImageId = fields.coverImageId;
  if (fields.videoId !== undefined) updateData.videoId = fields.videoId;
  if (fields.videoEmbedUrl !== undefined) updateData.videoEmbedUrl = fields.videoEmbedUrl;
  if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
  if (fields.countryId !== undefined) updateData.countryId = fields.countryId;
  if (fields.authorName !== undefined) updateData.authorName = fields.authorName;

  await db.update(articles).set(updateData).where(eq(articles.id, id));

  if (tagIds !== undefined) {
    await db.delete(articleTags).where(eq(articleTags.articleId, id));
    if (tagIds.length > 0) {
      await db.insert(articleTags).values(
        tagIds.map((tagId) => ({ articleId: id, tagId }))
      );
    }
  }
}

export async function deleteArticle(id: number) {
  // Collect media IDs for cleanup before deletion
  const article = await db
    .select({ coverImageId: articles.coverImageId, videoId: articles.videoId })
    .from(articles)
    .where(eq(articles.id, id));

  if (article.length === 0) return { mediaIds: [] };

  const { coverImageId, videoId } = article[0];
  const mediaIds = [coverImageId, videoId].filter((mid): mid is number => mid !== null);

  // article_tags cascade on delete, so just delete the article
  await db.delete(articles).where(eq(articles.id, id));

  return { mediaIds };
}

export async function publishArticle(id: number) {
  await db
    .update(articles)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(articles.id, id));
}

export async function archiveArticle(id: number) {
  await db
    .update(articles)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(articles.id, id));
}

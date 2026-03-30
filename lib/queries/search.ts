import { sql, eq, and } from "drizzle-orm";
import { db } from "../db";
import { articles, categories, media } from "../db/schema";

export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  authorName: string;
  isBreakingNews: boolean;
  isFeatured: boolean;
  coverImageId: number | null;
  coverImageUrl: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
};

export async function searchArticles(
  query: string,
  page = 1,
  pageSize = 20
): Promise<{ articles: Article[]; total: number }> {
  if (!query.trim()) {
    return { articles: [], total: 0 };
  }

  const offset = (page - 1) * pageSize;

  const searchCondition = sql`to_tsvector('english', ${articles.title} || ' ' || ${articles.body}) @@ plainto_tsquery('english', ${query})`;
  const rankExpr = sql`ts_rank(to_tsvector('english', ${articles.title} || ' ' || ${articles.body}), plainto_tsquery('english', ${query}))`;

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
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(media, eq(articles.coverImageId, media.id))
      .where(and(eq(articles.status, "published"), searchCondition))
      .orderBy(sql`${rankExpr} desc`)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(articles)
      .where(and(eq(articles.status, "published"), searchCondition)),
  ]);

  return { articles: rows, total: countResult[0]?.total ?? 0 };
}

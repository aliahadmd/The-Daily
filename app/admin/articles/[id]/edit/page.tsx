import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { articles, articleTags, media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCategories } from "@/lib/queries/taxonomy";
import { getTags } from "@/lib/queries/taxonomy";
import { getCountries } from "@/lib/queries/taxonomy";
import EditArticleClient from "./_client";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) notFound();

  const [articleRows, tagRows, categories, tags, countries] = await Promise.all([
    db
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
        categoryId: articles.categoryId,
        countryId: articles.countryId,
        coverImageId: articles.coverImageId,
        videoId: articles.videoId,
        videoEmbedUrl: articles.videoEmbedUrl,
        coverImageUrl: media.url,
      })
      .from(articles)
      .leftJoin(media, eq(articles.coverImageId, media.id))
      .where(eq(articles.id, articleId)),
    db.select({ tagId: articleTags.tagId }).from(articleTags).where(eq(articleTags.articleId, articleId)),
    getCategories(),
    getTags(),
    getCountries(),
  ]);

  if (articleRows.length === 0) notFound();

  const article = articleRows[0];
  const initialData = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    body: article.body,
    status: article.status as "draft" | "published" | "archived",
    isBreakingNews: article.isBreakingNews,
    isFeatured: article.isFeatured,
    authorName: article.authorName,
    categoryId: article.categoryId,
    countryId: article.countryId ?? null,
    coverImageId: article.coverImageId ?? null,
    coverImageUrl: article.coverImageUrl ?? null,
    videoId: article.videoId ?? null,
    videoEmbedUrl: article.videoEmbedUrl ?? "",
    tagIds: tagRows.map((r) => r.tagId),
  };

  return (
    <EditArticleClient
      articleId={articleId}
      initialData={initialData}
      categories={categories}
      tags={tags}
      countries={countries}
    />
  );
}

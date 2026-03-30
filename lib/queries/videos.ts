import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { videoPosts, videoPostTags, categories, countries, media, tags } from "../db/schema";

export type VideoPostCreateInput = {
  title: string;
  slug: string;
  description?: string | null;
  coverImageId?: number | null;
  videoMediaId?: number | null;
  videoEmbedUrl?: string | null;
  categoryId?: number | null;
  countryId?: number | null;
  tagIds?: number[];
};

// ─── Read queries ────────────────────────────────────────────────────────────

export async function getVideosByLatest(limit = 4) {
  return db
    .select({
      id: videoPosts.id,
      title: videoPosts.title,
      slug: videoPosts.slug,
      description: videoPosts.description,
      publishedAt: videoPosts.publishedAt,
      videoEmbedUrl: videoPosts.videoEmbedUrl,
      categoryId: videoPosts.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      coverImageId: videoPosts.coverImageId,
      coverImageUrl: media.url,
    })
    .from(videoPosts)
    .leftJoin(categories, eq(videoPosts.categoryId, categories.id))
    .leftJoin(media, eq(videoPosts.coverImageId, media.id))
    .where(eq(videoPosts.status, "published"))
    .orderBy(desc(videoPosts.publishedAt))
    .limit(limit);
}

export async function getVideoPostBySlug(slug: string) {
  const rows = await db
    .select({
      id: videoPosts.id,
      title: videoPosts.title,
      slug: videoPosts.slug,
      description: videoPosts.description,
      status: videoPosts.status,
      videoEmbedUrl: videoPosts.videoEmbedUrl,
      publishedAt: videoPosts.publishedAt,
      createdAt: videoPosts.createdAt,
      updatedAt: videoPosts.updatedAt,
      categoryId: videoPosts.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      countryId: countries.id,
      countryName: countries.name,
      countrySlug: countries.slug,
      countryIsoCode: countries.isoCode,
      coverImageId: videoPosts.coverImageId,
      coverImageUrl: media.url,
      videoMediaId: videoPosts.videoMediaId,
    })
    .from(videoPosts)
    .leftJoin(categories, eq(videoPosts.categoryId, categories.id))
    .leftJoin(countries, eq(videoPosts.countryId, countries.id))
    .leftJoin(media, eq(videoPosts.coverImageId, media.id))
    .where(and(eq(videoPosts.slug, slug), eq(videoPosts.status, "published")));

  if (rows.length === 0) return null;

  const post = rows[0];

  // Fetch video media URL separately if videoMediaId is set
  let videoMediaUrl: string | null = null;
  if (post.videoMediaId) {
    const videoMedia = await db
      .select({ url: media.url })
      .from(media)
      .where(eq(media.id, post.videoMediaId));
    videoMediaUrl = videoMedia[0]?.url ?? null;
  }

  // Fetch tags for this video post
  const postTagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(videoPostTags)
    .innerJoin(tags, eq(videoPostTags.tagId, tags.id))
    .where(eq(videoPostTags.videoPostId, post.id));

  return {
    ...post,
    videoMediaUrl,
    tags: postTagRows,
  };
}

// ─── Write queries ────────────────────────────────────────────────────────────

export async function createVideoPost(data: VideoPostCreateInput) {
  const { tagIds = [], ...postData } = data;

  const [inserted] = await db
    .insert(videoPosts)
    .values({
      title: postData.title,
      slug: postData.slug,
      description: postData.description ?? null,
      coverImageId: postData.coverImageId ?? null,
      videoMediaId: postData.videoMediaId ?? null,
      videoEmbedUrl: postData.videoEmbedUrl ?? null,
      categoryId: postData.categoryId ?? null,
      countryId: postData.countryId ?? null,
    })
    .returning({ id: videoPosts.id, slug: videoPosts.slug });

  if (tagIds.length > 0) {
    await db.insert(videoPostTags).values(
      tagIds.map((tagId) => ({ videoPostId: inserted.id, tagId }))
    );
  }

  return { id: inserted.id, slug: inserted.slug };
}

export async function updateVideoPost(id: number, data: Partial<VideoPostCreateInput>) {
  const { tagIds, ...fields } = data;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.slug !== undefined) updateData.slug = fields.slug;
  if (fields.description !== undefined) updateData.description = fields.description;
  if (fields.coverImageId !== undefined) updateData.coverImageId = fields.coverImageId;
  if (fields.videoMediaId !== undefined) updateData.videoMediaId = fields.videoMediaId;
  if (fields.videoEmbedUrl !== undefined) updateData.videoEmbedUrl = fields.videoEmbedUrl;
  if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
  if (fields.countryId !== undefined) updateData.countryId = fields.countryId;

  await db.update(videoPosts).set(updateData).where(eq(videoPosts.id, id));

  if (tagIds !== undefined) {
    await db.delete(videoPostTags).where(eq(videoPostTags.videoPostId, id));
    if (tagIds.length > 0) {
      await db.insert(videoPostTags).values(
        tagIds.map((tagId) => ({ videoPostId: id, tagId }))
      );
    }
  }
}

export async function deleteVideoPost(id: number) {
  // Collect media IDs for cleanup before deletion
  const post = await db
    .select({ coverImageId: videoPosts.coverImageId, videoMediaId: videoPosts.videoMediaId })
    .from(videoPosts)
    .where(eq(videoPosts.id, id));

  if (post.length === 0) return { mediaIds: [] };

  const { coverImageId, videoMediaId } = post[0];
  const mediaIds = [coverImageId, videoMediaId].filter((mid): mid is number => mid !== null);

  // video_post_tags cascade on delete, so just delete the post
  await db.delete(videoPosts).where(eq(videoPosts.id, id));

  return { mediaIds };
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { videoPosts, videoPostTags, media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCategories, getTags, getCountries } from "@/lib/queries/taxonomy";
import EditVideoClient from "./_client";

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const videoId = parseInt(id, 10);
  if (isNaN(videoId)) notFound();

  const [videoRows, tagRows, categories, tags, countries] = await Promise.all([
    db
      .select({
        id: videoPosts.id,
        title: videoPosts.title,
        slug: videoPosts.slug,
        description: videoPosts.description,
        status: videoPosts.status,
        categoryId: videoPosts.categoryId,
        countryId: videoPosts.countryId,
        coverImageId: videoPosts.coverImageId,
        videoMediaId: videoPosts.videoMediaId,
        videoEmbedUrl: videoPosts.videoEmbedUrl,
        coverImageUrl: media.url,
      })
      .from(videoPosts)
      .leftJoin(media, eq(videoPosts.coverImageId, media.id))
      .where(eq(videoPosts.id, videoId)),
    db.select({ tagId: videoPostTags.tagId }).from(videoPostTags).where(eq(videoPostTags.videoPostId, videoId)),
    getCategories(),
    getTags(),
    getCountries(),
  ]);

  if (videoRows.length === 0) notFound();

  const video = videoRows[0];
  const initialData = {
    title: video.title,
    slug: video.slug,
    description: video.description ?? "",
    status: video.status as "draft" | "published" | "archived",
    categoryId: video.categoryId ?? null,
    countryId: video.countryId ?? null,
    coverImageId: video.coverImageId ?? null,
    coverImageUrl: video.coverImageUrl ?? null,
    videoMediaId: video.videoMediaId ?? null,
    videoEmbedUrl: video.videoEmbedUrl ?? "",
    tagIds: tagRows.map((r) => r.tagId),
  };

  return (
    <EditVideoClient
      videoId={videoId}
      initialData={initialData}
      categories={categories}
      tags={tags}
      countries={countries}
    />
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getVideoPostBySlug } from "@/lib/queries/videos";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoPostBySlug(slug);
  if (!video) return {};
  return {
    title: `${video.title} — The Daily`,
    description: video.description ?? undefined,
    openGraph: {
      title: video.title,
      description: video.description ?? undefined,
      type: "video.other",
      images: video.coverImageUrl ? [{ url: video.coverImageUrl }] : [],
    },
  };
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const video = await getVideoPostBySlug(slug);
  if (!video) notFound();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span>/</span>
        <span className="text-muted">Videos</span>
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-black text-ink leading-tight mb-4">{video.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-6 border-b border-border pb-4">
        {video.categoryName && (
          <Link href={`/categories/${video.categorySlug}`} className="font-semibold text-accent uppercase text-xs tracking-widest hover:underline">
            {video.categoryName}
          </Link>
        )}
        {video.publishedAt && (
          <time dateTime={video.publishedAt.toISOString()}>
            {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(video.publishedAt)}
          </time>
        )}
      </div>

      {/* Video player */}
      {video.videoEmbedUrl ? (
        <div className="relative w-full aspect-video mb-8">
          <iframe
            src={video.videoEmbedUrl}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        </div>
      ) : video.videoMediaUrl ? (
        <div className="mb-8">
          <video
            src={video.videoMediaUrl}
            controls
            className="w-full rounded"
            aria-label={`Video: ${video.title}`}
          />
        </div>
      ) : video.coverImageUrl ? (
        <div className="relative w-full aspect-video mb-8 overflow-hidden">
          <Image
            src={video.coverImageUrl}
            alt={video.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      ) : null}

      {/* Description */}
      {video.description && (
        <p className="text-ink-light leading-relaxed mb-8">{video.description}</p>
      )}

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-2">
          {video.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="px-3 py-1 text-xs font-semibold border border-border text-ink-light hover:bg-ink hover:text-cream transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

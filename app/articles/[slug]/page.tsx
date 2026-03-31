import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries/articles";
import { renderMarkdown } from "@/lib/markdown";
import ArticleCard from "@/components/public/ArticleCard";
import { getUserSession } from "@/lib/user-auth";
import CommentSection from "@/components/public/CommentSection";
import { getSubscriptionByUserId } from "@/lib/queries/subscriptions";
import SubscriptionDrawer from "@/components/public/SubscriptionDrawer";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: `${article.title} — The Daily`,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.authorName],
      images: article.coverImageUrl ? [{ url: article.coverImageUrl }] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [htmlBody, relatedArticles, user] = await Promise.all([
    renderMarkdown(article.body),
    getRelatedArticles(article.id, article.categoryId, 4),
    getUserSession(),
  ]);

  const subscription = user ? await getSubscriptionByUserId(user.userId) : null;
  const isSubscriber = subscription?.status === "active";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    author: { "@type": "Person", name: article.authorName },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString(),
    image: article.coverImageUrl ?? undefined,
    articleSection: article.categoryName,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link href={`/categories/${article.categorySlug}`} className="hover:text-accent uppercase font-semibold text-accent">
            {article.categoryName}
          </Link>
        </nav>

        {/* Title */}
        <h1 className="text-4xl font-black text-ink leading-tight mb-4">{article.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-6 border-b border-border pb-4">
          <span>By <strong className="text-ink">{article.authorName}</strong></span>
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()}>
              {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(article.publishedAt)}
            </time>
          )}
          {article.countryName && (
            <Link href={`/countries/${article.countrySlug}`} className="hover:text-accent">
              🌍 {article.countryName}
            </Link>
          )}
        </div>

        {/* Cover image */}
        {article.coverImageUrl && (
          <div className="relative w-full aspect-video mb-8 overflow-hidden">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {/* Video embed */}
        {article.videoEmbedUrl && (
          <div className="relative w-full aspect-video mb-8">
            <iframe
              src={article.videoEmbedUrl}
              title={article.title}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        {/* Uploaded video file */}
        {!article.videoEmbedUrl && article.videoUrl && (
          <div className="mb-8">
            <video
              src={article.videoUrl}
              controls
              className="w-full rounded"
              aria-label={`Video for ${article.title}`}
            />
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-neutral max-w-none text-ink leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlBody }}
        />

        {/* Subscription drawer for non-subscribers */}
        {!isSubscriber && (
          <SubscriptionDrawer articleSlug={slug} userId={user?.userId ?? null} />
        )}

        {/* Comments */}
        <CommentSection articleId={article.id} user={user} />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-2">
            {article.tags.map((tag) => (
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

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-ink border-b-2 border-ink pb-1 mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArticles.map((related) => (
                <ArticleCard
                  key={related.id}
                  title={related.title}
                  slug={related.slug}
                  excerpt={related.excerpt}
                  coverImageUrl={related.coverImageUrl}
                  category={{ name: article.categoryName, slug: article.categorySlug }}
                  publishedAt={related.publishedAt}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

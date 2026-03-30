import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTagBySlug, getArticlesByTag } from "@/lib/queries/taxonomy";
import ArticleCard from "@/components/public/ArticleCard";
import Pagination from "@/components/public/Pagination";

export const revalidate = 60;

const PAGE_SIZE = 20;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  return {
    title: `#${tag.name} — The Daily`,
    description: `Articles tagged with ${tag.name}`,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { articles, total } = await getArticlesByTag(tag.id, page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border-b-2 border-ink pb-4 mb-8">
        <nav className="text-xs text-muted mb-2">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <span>Topics</span>
        </nav>
        <h1 className="text-4xl font-black text-ink">#{tag.name}</h1>
        <p className="mt-1 text-xs text-muted">{total} article{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Articles grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              title={article.title}
              slug={article.slug}
              excerpt={article.excerpt}
              coverImageUrl={article.coverImageUrl}
              category={{ name: article.categoryName, slug: article.categorySlug }}
              publishedAt={article.publishedAt}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm">No articles found for this topic.</p>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/tags/${slug}`}
      />
    </main>
  );
}

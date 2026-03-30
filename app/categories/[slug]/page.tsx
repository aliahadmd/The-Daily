import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryBySlug } from "@/lib/queries/taxonomy";
import { getArticlesByCategory } from "@/lib/queries/articles";
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
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} — The Daily`,
    description: category.description ?? `Latest news in ${category.name}`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { articles, total } = await getArticlesByCategory(category.id, page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border-b-2 border-ink pb-4 mb-8">
        <nav className="text-xs text-muted mb-2">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <span>Sections</span>
        </nav>
        <h1 className="text-4xl font-black text-ink uppercase tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-sm text-ink-light max-w-2xl">{category.description}</p>
        )}
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
              category={{ name: category.name, slug: category.slug }}
              publishedAt={article.publishedAt}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted text-sm">No articles found in this section.</p>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/categories/${slug}`}
      />
    </main>
  );
}

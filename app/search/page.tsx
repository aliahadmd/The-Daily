import type { Metadata } from "next";
import Link from "next/link";
import { searchArticles } from "@/lib/queries/search";
import ArticleCard from "@/components/public/ArticleCard";
import Pagination from "@/components/public/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: "${q}" — The Daily` : "Search — The Daily",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { articles, total } = query
    ? await searchArticles(query, page, PAGE_SIZE)
    : { articles: [], total: 0 };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border-b-2 border-ink pb-4 mb-8">
        <nav className="text-xs text-muted mb-2">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <span>Search</span>
        </nav>
        <h1 className="text-3xl font-black text-ink">
          {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search"}
        </h1>
        {query && (
          <p className="mt-1 text-xs text-muted">
            {total} result{total !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Search form */}
      <form action="/search" method="GET" className="flex items-center gap-2 mb-10 max-w-xl">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search articles..."
          className="flex-1 border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-ink text-cream text-sm font-semibold hover:bg-accent transition-colors"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {query && articles.length === 0 && (
        <p className="text-muted text-sm">No results found for &ldquo;{query}&rdquo;. Try different keywords.</p>
      )}

      {articles.length > 0 && (
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
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/search?q=${encodeURIComponent(query)}&`}
        />
      )}
    </main>
  );
}

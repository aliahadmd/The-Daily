import ArticleCard from "@/components/public/ArticleCard";
import VideoCard from "@/components/public/VideoCard";
import BreakingNewsTicker from "@/components/public/BreakingNewsTicker";
import {
  getBreakingNews,
  getFeaturedArticles,
  getLatestArticles,
  getArticlesByCategory,
  getArticlesByCountry,
} from "@/lib/queries/articles";
import { getCategories, getCountries } from "@/lib/queries/taxonomy";
import { getVideosByLatest } from "@/lib/queries/videos";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    breakingNews,
    featuredArticles,
    latestArticles,
    categories,
    countries,
    videos,
  ] = await Promise.all([
    getBreakingNews(),
    getFeaturedArticles(5),
    getLatestArticles(10),
    getCategories(),
    getCountries(),
    getVideosByLatest(4),
  ]);

  // Fetch articles for first 4 categories
  const topCategories = categories.slice(0, 4);
  const categoryArticleGroups = await Promise.all(
    topCategories.map(async (cat) => {
      const { articles } = await getArticlesByCategory(cat.id, 1, 4);
      return { category: cat, articles };
    })
  );

  // Fetch articles for first 4 countries
  const topCountries = countries.slice(0, 4);
  const countryArticleGroups = await Promise.all(
    topCountries.map(async (country) => {
      const { articles } = await getArticlesByCountry(country.id, 1, 3);
      return { country, articles };
    })
  );

  return (
    <main className="min-h-screen">
      {/* Breaking News Ticker */}
      <BreakingNewsTicker items={breakingNews} />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* Today's Features */}
        {featuredArticles.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-ink border-b-2 border-ink pb-1 mb-6">
              Today&apos;s Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.slice(0, 1).map((article) => (
                <div key={article.id} className="md:col-span-2">
                  <ArticleCard
                    title={article.title}
                    slug={article.slug}
                    excerpt={article.excerpt}
                    coverImageUrl={article.coverImageUrl}
                    category={{ name: article.categoryName, slug: article.categorySlug }}
                    publishedAt={article.publishedAt}
                    variant="featured"
                  />
                </div>
              ))}
              <div className="space-y-4">
                {featuredArticles.slice(1, 4).map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    slug={article.slug}
                    excerpt={article.excerpt}
                    coverImageUrl={article.coverImageUrl}
                    category={{ name: article.categoryName, slug: article.categorySlug }}
                    publishedAt={article.publishedAt}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest News */}
        {latestArticles.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-ink border-b-2 border-ink pb-1 mb-6">
              Latest News
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestArticles.slice(0, 8).map((article) => (
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
          </section>
        )}

        {/* By Category */}
        {categoryArticleGroups.filter((g) => g.articles.length > 0).map(({ category, articles }) => (
          <section key={category.id}>
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-1 mb-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-ink">
                {category.name}
              </h2>
              <Link href={`/categories/${category.slug}`} className="text-xs text-accent font-semibold hover:underline">
                More →
              </Link>
            </div>
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
          </section>
        ))}

        {/* World News */}
        {countryArticleGroups.filter((g) => g.articles.length > 0).length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-ink border-b-2 border-ink pb-1 mb-6">
              World News
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {countryArticleGroups.filter((g) => g.articles.length > 0).map(({ country, articles }) => (
                <div key={country.id}>
                  <Link href={`/countries/${country.slug}`} className="block text-xs font-black uppercase tracking-widest text-accent hover:underline mb-3">
                    {country.name}
                  </Link>
                  <div className="space-y-3">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        title={article.title}
                        slug={article.slug}
                        excerpt={null}
                        coverImageUrl={null}
                        category={{ name: country.name, slug: country.slug }}
                        publishedAt={article.publishedAt}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-ink border-b-2 border-ink pb-1 mb-6">
              Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  title={video.title}
                  slug={video.slug}
                  coverImageUrl={video.coverImageUrl}
                  description={video.description}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

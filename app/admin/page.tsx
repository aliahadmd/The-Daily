import Link from "next/link";
import { db } from "@/lib/db";
import { articles, videoPosts, media, categories, tags, countries } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function getCounts() {
  const [
    articleCount,
    videoCount,
    mediaCount,
    categoryCount,
    tagCount,
    countryCount,
  ] = await Promise.all([
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(articles),
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(videoPosts),
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(media),
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(categories),
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(tags),
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(countries),
  ]);

  return {
    articles: articleCount[0]?.total ?? 0,
    videos: videoCount[0]?.total ?? 0,
    media: mediaCount[0]?.total ?? 0,
    categories: categoryCount[0]?.total ?? 0,
    tags: tagCount[0]?.total ?? 0,
    countries: countryCount[0]?.total ?? 0,
  };
}

const statCards = [
  { key: "articles" as const, label: "Articles", href: "/admin/articles" },
  { key: "videos" as const, label: "Videos", href: "/admin/videos" },
  { key: "media" as const, label: "Media Files", href: "/admin/media" },
  { key: "categories" as const, label: "Categories", href: "/admin/categories" },
  { key: "tags" as const, label: "Tags", href: "/admin/tags" },
  { key: "countries" as const, label: "Countries", href: "/admin/countries" },
];

export default async function AdminDashboard() {
  const counts = await getCounts();

  return (
    <div className="p-8">
      <div className="mb-8 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Dashboard
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Overview of your CMS content
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ key, label, href }) => (
          <Link
            key={key}
            href={href}
            className="block p-6 border transition-colors hover:border-ink"
            style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}
          >
            <p className="text-4xl font-bold mb-2" style={{ color: "var(--ink)" }}>
              {counts[key]}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              {label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

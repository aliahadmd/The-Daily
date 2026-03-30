import Image from "next/image";
import Link from "next/link";

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: { name: string; slug: string };
  publishedAt: Date | null;
  variant?: "featured" | "compact" | "default";
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function ArticleCard({ title, slug, excerpt, coverImageUrl, category, publishedAt, variant = "default" }: ArticleCardProps) {
  const href = `/articles/${slug}`;

  if (variant === "featured") {
    return (
      <article className="group border border-border bg-cream">
        {coverImageUrl && (
          <Link href={href} className="block relative w-full aspect-video overflow-hidden">
            <Image src={coverImageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 66vw" />
          </Link>
        )}
        <div className="p-5">
          <Link href={`/categories/${category.slug}`} className="text-xs font-black uppercase tracking-widest text-accent hover:underline">{category.name}</Link>
          <Link href={href}><h2 className="mt-2 text-2xl font-black text-ink leading-tight group-hover:text-accent transition-colors">{title}</h2></Link>
          {excerpt && <p className="mt-2 text-sm text-ink-light line-clamp-3">{excerpt}</p>}
          {publishedAt && <time className="mt-3 block text-xs text-muted">{formatDate(publishedAt)}</time>}
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex items-start gap-3 py-3 border-b border-border last:border-0">
        <div className="flex-1 min-w-0">
          <Link href={`/categories/${category.slug}`} className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">{category.name}</Link>
          <Link href={href}><h3 className="mt-0.5 text-sm font-bold text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2">{title}</h3></Link>
          {publishedAt && <time className="mt-1 block text-xs text-muted">{formatDate(publishedAt)}</time>}
        </div>
      </article>
    );
  }

  return (
    <article className="group border border-border bg-cream">
      {coverImageUrl && (
        <Link href={href} className="block relative w-full aspect-4/3 overflow-hidden">
          <Image src={coverImageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
        </Link>
      )}
      <div className="p-4">
        <Link href={`/categories/${category.slug}`} className="text-xs font-black uppercase tracking-widest text-accent hover:underline">{category.name}</Link>
        <Link href={href}><h3 className="mt-1.5 text-base font-bold text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2">{title}</h3></Link>
        {excerpt && <p className="mt-1.5 text-sm text-ink-light line-clamp-2">{excerpt}</p>}
        {publishedAt && <time className="mt-2 block text-xs text-muted">{formatDate(publishedAt)}</time>}
      </div>
    </article>
  );
}

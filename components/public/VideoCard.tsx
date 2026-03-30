import Image from "next/image";
import Link from "next/link";

interface VideoCardProps {
  title: string;
  slug: string;
  coverImageUrl: string | null;
  description?: string | null;
}

export default function VideoCard({ title, slug, coverImageUrl, description }: VideoCardProps) {
  const href = `/videos/${slug}`;

  return (
    <article className="group border border-border bg-cream">
      <Link href={href} className="block relative w-full aspect-video overflow-hidden bg-ink">
        {coverImageUrl ? (
          <Image src={coverImageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-90" sizes="(max-width: 768px) 100vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-white opacity-60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
            <svg className="w-6 h-6 text-ink ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={href}>
          <h3 className="text-base font-bold text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2">{title}</h3>
        </Link>
        {description && <p className="mt-1.5 text-sm text-ink-light line-clamp-2">{description}</p>}
      </div>
    </article>
  );
}

import Link from "next/link";

interface BreakingNewsTickerProps {
  items: { title: string; slug: string }[];
}

export default function BreakingNewsTicker({ items }: BreakingNewsTickerProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center overflow-hidden bg-accent text-white">
      <span className="shrink-0 px-4 py-2 text-xs font-black uppercase tracking-widest bg-black text-white">
        Breaking
      </span>
      <div className="flex-1 overflow-hidden relative py-2">
        <div className="flex gap-8 whitespace-nowrap" style={{ animation: "ticker 30s linear infinite" }}>
          {[...items, ...items].map((item, i) => (
            <Link key={`${item.slug}-${i}`} href={`/articles/${item.slug}`} className="text-sm font-semibold hover:underline shrink-0">
              {item.title}
              <span className="mx-4 opacity-50">◆</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

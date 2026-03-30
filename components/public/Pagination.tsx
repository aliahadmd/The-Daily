import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function pageUrl(basePath: string, page: number): string {
  return `${basePath}?page=${page}`;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-8">
      {isFirst ? (
        <span className="px-3 py-1.5 text-sm border border-border text-muted cursor-not-allowed select-none">← Prev</span>
      ) : (
        <Link href={pageUrl(basePath, currentPage - 1)} className="px-3 py-1.5 text-sm border border-border text-ink hover:bg-ink hover:text-cream transition-colors">← Prev</Link>
      )}

      {pages.map((page) =>
        page === currentPage ? (
          <span key={page} aria-current="page" className="px-3 py-1.5 text-sm border border-ink bg-ink text-cream font-bold">{page}</span>
        ) : (
          <Link key={page} href={pageUrl(basePath, page)} className="px-3 py-1.5 text-sm border border-border text-ink hover:bg-ink hover:text-cream transition-colors">{page}</Link>
        )
      )}

      {isLast ? (
        <span className="px-3 py-1.5 text-sm border border-border text-muted cursor-not-allowed select-none">Next →</span>
      ) : (
        <Link href={pageUrl(basePath, currentPage + 1)} className="px-3 py-1.5 text-sm border border-border text-ink hover:bg-ink hover:text-cream transition-colors">Next →</Link>
      )}
    </nav>
  );
}

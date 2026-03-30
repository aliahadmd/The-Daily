import Link from "next/link";

interface FooterProps {
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
  countries: { name: string; slug: string }[];
}

export default function Footer({ categories, tags, countries }: FooterProps) {
  return (
    <footer className="bg-cream-dark border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Categories */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-ink mb-3 border-b border-border pb-1">
            Sections
          </h3>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="text-sm text-ink-light hover:text-accent transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-ink mb-3 border-b border-border pb-1">
            Topics
          </h3>
          <ul className="space-y-1">
            {tags.slice(0, 8).map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={`/tags/${tag.slug}`}
                  className="text-sm text-ink-light hover:text-accent transition-colors"
                >
                  {tag.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tags" className="text-sm font-semibold text-accent hover:underline">
                All Tags →
              </Link>
            </li>
          </ul>
        </div>

        {/* Countries */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-ink mb-3 border-b border-border pb-1">
            World
          </h3>
          <ul className="space-y-1">
            {countries.slice(0, 8).map((country) => (
              <li key={country.slug}>
                <Link
                  href={`/countries/${country.slug}`}
                  className="text-sm text-ink-light hover:text-accent transition-colors"
                >
                  {country.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/countries" className="text-sm font-semibold text-accent hover:underline">
                All Countries →
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} The Daily. All rights reserved.
      </div>
    </footer>
  );
}

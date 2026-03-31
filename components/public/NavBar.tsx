import Link from "next/link";

interface NavBarProps {
  categories: { name: string; slug: string }[];
  user?: { username: string } | null;
}

export default function NavBar({ categories, user }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-border">
      {/* Masthead */}
      <div className="border-b border-ink py-3 text-center">
        <Link href="/" className="text-4xl font-black tracking-tight text-ink uppercase font-serif">
          The Daily
        </Link>
        <p className="text-xs text-muted mt-0.5 tracking-widest uppercase">
          All the news that&apos;s fit to print
        </p>
      </div>

      {/* Nav row */}
      <nav className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto gap-4">
        {/* Category links */}
        <ul className="flex items-center gap-1 flex-wrap">
          <li>
            <Link
              href="/"
              className="px-2 py-1 text-sm font-semibold text-ink hover:text-accent transition-colors uppercase tracking-wide"
            >
              Home
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/categories/${cat.slug}`}
                className="px-2 py-1 text-sm font-semibold text-ink hover:text-accent transition-colors uppercase tracking-wide"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth area */}
        <div className="flex items-center gap-2 shrink-0 text-sm">
          {user ? (
            <>
              <span className="font-semibold text-ink">{user.username}</span>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="px-2 py-1 text-sm font-semibold text-ink hover:text-accent transition-colors uppercase tracking-wide"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 py-1 text-sm font-semibold text-ink hover:text-accent transition-colors uppercase tracking-wide"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-2 py-1 text-sm font-semibold text-ink hover:text-accent transition-colors uppercase tracking-wide"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Search form */}
        <form action="/search" method="GET" className="flex items-center gap-1 shrink-0">
          <input
            type="search"
            name="q"
            placeholder="Search..."
            className="border border-border bg-white px-3 py-1 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink w-40"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-ink text-cream text-sm font-semibold hover:bg-accent transition-colors"
          >
            Go
          </button>
        </form>
      </nav>
    </header>
  );
}

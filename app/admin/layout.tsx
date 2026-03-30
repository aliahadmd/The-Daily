import Link from "next/link";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/countries", label: "Countries" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r"
        style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}
      >
        {/* Header */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--ink)" }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>
            Administration
          </p>
          <h1 className="text-lg font-bold tracking-tight leading-tight" style={{ color: "var(--ink)" }}>
            The Daily CMS
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-5 py-2.5 text-sm font-semibold tracking-wide uppercase transition-colors hover:bg-ink hover:text-cream"
              style={{ color: "var(--ink-light)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <form method="POST" action="/api/admin/auth/logout">
            <button
              type="submit"
              className="w-full py-2 text-xs font-bold tracking-widest uppercase border transition-colors hover:bg-ink hover:text-cream"
              style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
            >
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

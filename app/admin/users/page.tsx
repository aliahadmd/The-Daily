import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listUsers, searchUsers } from "@/lib/queries/users";
import UserActions from "./_components/UserActions";

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const { users, total } = search?.trim()
    ? await searchUsers(search.trim(), page, PAGE_SIZE)
    : await listUsers(page, PAGE_SIZE);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildHref(params: Record<string, string | undefined>) {
    const merged = { search, page: pageParam, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Users
        </h2>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="flex items-center gap-2 mb-6">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search by username or email…"
          className="text-sm px-3 py-1.5 border flex-1 max-w-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--ink)", background: "var(--cream)" }}
        />
        <button
          type="submit"
          className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors"
          style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
        >
          Search
        </button>
        {search && (
          <Link
            href="/admin/users"
            className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            Clear
          </Link>
        )}
      </form>

      <div className="border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Username</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Email</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Registered</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Comments</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--ink)" }}>
                  {user.username}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                  {user.email}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--ink)" }}>
                  {user.commentCount}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 border"
                    style={
                      user.status === "active"
                        ? { borderColor: "var(--ink)", color: "var(--ink)" }
                        : { borderColor: "var(--accent)", color: "var(--accent)" }
                    }
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <UserActions id={user.id} status={user.status} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
                  {search ? `No users found matching "${search}".` : "No users yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref({ page: String(p) })}
              className="px-3 py-1 text-xs font-bold border transition-colors"
              style={
                p === page
                  ? { background: "var(--ink)", color: "var(--cream)", borderColor: "var(--ink)" }
                  : { borderColor: "var(--border)", color: "var(--ink)" }
              }
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

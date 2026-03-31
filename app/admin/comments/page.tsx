import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAllComments, getPendingCommentCount } from "@/lib/queries/comments";
import CommentActions from "./_components/CommentActions";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
] as const;

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; articleId?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { status: statusParam, articleId: articleIdParam, page: pageParam } = await searchParams;

  const status =
    statusParam === "pending" || statusParam === "approved" || statusParam === "rejected"
      ? statusParam
      : undefined;
  const articleId = articleIdParam ? parseInt(articleIdParam, 10) : undefined;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [{ comments, total }, pendingCount] = await Promise.all([
    listAllComments({ status, articleId, page, pageSize: PAGE_SIZE }),
    getPendingCommentCount(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildHref(params: Record<string, string | undefined>) {
    const merged = { status: statusParam, articleId: articleIdParam, page: pageParam, ...params };
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/admin/comments${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Comments
          {pendingCount > 0 && (
            <span
              className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent)", color: "var(--cream)" }}
            >
              {pendingCount} pending
            </span>
          )}
        </h2>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map(({ label, value }) => {
          const active = status === value;
          return (
            <Link
              key={label}
              href={buildHref({ status: value, page: "1" })}
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 border transition-colors"
              style={
                active
                  ? { background: "var(--ink)", color: "var(--cream)", borderColor: "var(--ink)" }
                  : { borderColor: "var(--border)", color: "var(--muted)" }
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>User</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Article</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Comment</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Date</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--ink)" }}>
                  {comment.username}
                </td>
                <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: "var(--muted)" }}>
                  {comment.articleTitle}
                </td>
                <td className="px-4 py-3 text-xs max-w-xs" style={{ color: "var(--ink)" }}>
                  {comment.body.length > 150 ? comment.body.slice(0, 150) + "…" : comment.body}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 border"
                    style={
                      comment.status === "approved"
                        ? { borderColor: "var(--ink)", color: "var(--ink)" }
                        : comment.status === "rejected"
                        ? { borderColor: "var(--muted)", color: "var(--muted)" }
                        : { borderColor: "var(--border)", color: "var(--muted)" }
                    }
                  >
                    {comment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <CommentActions id={comment.id} status={comment.status} />
                </td>
              </tr>
            ))}
            {comments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
                  No comments found.
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

import Link from "next/link";
import { db } from "@/lib/db";
import { videoPosts } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import DeleteVideoButton from "./_components/DeleteVideoButton";

const PAGE_SIZE = 20;

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: videoPosts.id,
        title: videoPosts.title,
        status: videoPosts.status,
        createdAt: videoPosts.createdAt,
      })
      .from(videoPosts)
      .orderBy(desc(videoPosts.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ total: sql<number>`cast(count(*) as int)` }).from(videoPosts),
  ]);

  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Videos
        </h2>
        <Link
          href="/admin/videos/new"
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          + New Video
        </Link>
      </div>

      <div className="border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Title</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Date</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((video) => (
              <tr key={video.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium max-w-sm truncate" style={{ color: "var(--ink)" }}>
                  {video.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 border"
                    style={
                      video.status === "published"
                        ? { borderColor: "var(--ink)", color: "var(--ink)" }
                        : video.status === "archived"
                        ? { borderColor: "var(--muted)", color: "var(--muted)" }
                        : { borderColor: "var(--border)", color: "var(--muted)" }
                    }
                  >
                    {video.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(video.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/videos/${video.id}/edit`}
                      className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors hover:bg-ink hover:text-cream"
                      style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
                    >
                      Edit
                    </Link>
                    <DeleteVideoButton id={video.id} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
                  No videos yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/videos?page=${p}`}
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

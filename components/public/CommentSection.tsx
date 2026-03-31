import Link from "next/link";
import { UserSession } from "@/lib/user-auth";
import { getApprovedCommentsByArticle } from "@/lib/queries/comments";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  articleId: number;
  user: UserSession | null;
}

export default async function CommentSection({ articleId, user }: CommentSectionProps) {
  const comments = await getApprovedCommentsByArticle(articleId);

  return (
    <section className="mt-10 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-lg font-black uppercase tracking-widest mb-6" style={{ color: "var(--ink)" }}>
        Comments
      </h2>

      {user ? (
        <CommentForm articleId={articleId} />
      ) : (
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--ink)" }}>
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--ink)" }}>
            register
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      <div className="mt-8 space-y-6">
        {comments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b pb-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                  {comment.username}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
                {comment.body}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";

interface CommentFormProps {
  articleId: number;
}

export default function CommentForm({ articleId }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, body }),
      });

      if (res.status === 201) {
        setSuccess(true);
        setBody("");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setError("Your account has been suspended.");
      } else if (res.status === 422) {
        setError(data.error || "Invalid comment.");
      } else if (res.status === 429) {
        setError("Too many comments. Try again in a minute.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {success ? (
        <p
          className="px-4 py-3 text-sm border"
          style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}
        >
          Comment submitted for review.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div
              className="px-4 py-3 text-sm border"
              style={{ background: "#fef2f2", borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              {error}
            </div>
          )}
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
            maxLength={2000}
            rows={4}
            required
            placeholder="Write a comment…"
            className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1 resize-none"
            style={{
              background: "var(--cream-dark)",
              borderColor: "var(--border)",
              color: "var(--ink)",
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {body.length} / 2000
            </span>
            <button
              type="submit"
              disabled={loading || body.trim().length === 0}
              className="px-5 py-2 text-sm font-semibold tracking-widest uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

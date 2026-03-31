"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CommentActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleAction(action: "approve" | "reject" | "delete") {
    if (action === "delete" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(action);
    if (action === "delete") {
      await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected" }),
      });
    }
    setLoading(null);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {status !== "approved" && (
        <button
          onClick={() => handleAction("approve")}
          disabled={loading !== null}
          className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
        >
          {loading === "approve" ? "…" : "Approve"}
        </button>
      )}
      {status !== "rejected" && (
        <button
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--muted)", color: "var(--muted)" }}
        >
          {loading === "reject" ? "…" : "Reject"}
        </button>
      )}
      <button
        onClick={() => handleAction("delete")}
        disabled={loading !== null}
        className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-50"
        style={
          confirmDelete
            ? { borderColor: "var(--accent)", color: "var(--cream)", background: "var(--accent)" }
            : { borderColor: "var(--accent)", color: "var(--accent)" }
        }
      >
        {loading === "delete" ? "…" : confirmDelete ? "Confirm" : "Delete"}
      </button>
    </div>
  );
}

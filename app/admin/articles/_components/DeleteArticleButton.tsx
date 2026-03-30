"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteArticleButton({ id }: { id: number }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-50"
      style={confirm
        ? { borderColor: "var(--accent)", color: "var(--cream)", background: "var(--accent)" }
        : { borderColor: "var(--accent)", color: "var(--accent)" }}
    >
      {loading ? "…" : confirm ? "Confirm" : "Delete"}
    </button>
  );
}

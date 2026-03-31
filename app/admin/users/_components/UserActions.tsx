"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const newStatus = status === "banned" ? "active" : "banned";
    setLoading(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  const isBanned = status === "banned";

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-50"
      style={
        isBanned
          ? { borderColor: "var(--ink)", color: "var(--ink)" }
          : { borderColor: "var(--accent)", color: "var(--accent)" }
      }
    >
      {loading ? "…" : isBanned ? "Unban" : "Ban"}
    </button>
  );
}

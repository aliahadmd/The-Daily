"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TaxonomyForm, { TaxonomyFormData } from "@/components/admin/TaxonomyForm";

interface Country {
  id: number;
  name: string;
  slug: string;
  isoCode: string;
  articleCount: number;
}

export default function CountriesClient({ countries }: { countries: Country[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function handleCreate(data: TaxonomyFormData) {
    await fetch("/api/admin/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowNew(false);
    router.refresh();
  }

  async function handleUpdate(id: number, data: TaxonomyFormData) {
    await fetch(`/api/admin/countries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/countries/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        {showNew ? (
          <div className="border p-4" style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
              New Country
            </p>
            <TaxonomyForm type="country" onSubmit={handleCreate} />
            <button
              onClick={() => setShowNew(false)}
              className="mt-2 text-xs underline"
              style={{ color: "var(--muted)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            + New Country
          </button>
        )}
      </div>

      <div className="border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)", background: "var(--cream-dark)" }}>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Name</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>ISO</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Slug</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Articles</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <>
                <tr key={country.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>{country.name}</td>
                  <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: "var(--ink)" }}>{country.isoCode}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>{country.slug}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{country.articleCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingId(editingId === country.id ? null : country.id)}
                      className="text-xs font-bold uppercase tracking-wider px-2 py-1 border transition-colors hover:bg-ink hover:text-cream"
                      style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
                    >
                      {editingId === country.id ? "Close" : "Edit"}
                    </button>
                  </td>
                </tr>
                {editingId === country.id && (
                  <tr key={`edit-${country.id}`} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td colSpan={5} className="px-4 py-4" style={{ background: "var(--cream-dark)" }}>
                      <TaxonomyForm
                        type="country"
                        initialData={{ id: country.id, name: country.name, slug: country.slug, isoCode: country.isoCode }}
                        onSubmit={(data) => handleUpdate(country.id, data)}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {countries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
                  No countries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ArticleForm, { ArticleFormData } from "@/components/admin/ArticleForm";

type SelectOption = { id: number; name: string; slug: string };

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [tags, setTags] = useState<SelectOption[]>([]);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/tags").then((r) => r.json()),
      fetch("/api/admin/countries").then((r) => r.json()),
    ]).then(([cats, tgs, ctrs]) => {
      setCategories(cats);
      setTags(tgs);
      setCountries(ctrs);
    });
  }, []);

  async function handleSubmit(data: ArticleFormData) {
    setError(null);
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create article");
      return;
    }
    router.push("/admin/articles");
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          New Article
        </h2>
      </div>
      {error && (
        <div className="mb-4 px-4 py-3 text-sm border" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          {error}
        </div>
      )}
      <ArticleForm
        categories={categories}
        tags={tags}
        countries={countries}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

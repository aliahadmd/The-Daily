"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ArticleForm, { ArticleFormData } from "@/components/admin/ArticleForm";

interface Props {
  articleId: number;
  initialData: Partial<ArticleFormData>;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  countries: { id: number; name: string; slug: string }[];
}

export default function EditArticleClient({ articleId, initialData, categories, tags, countries }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: ArticleFormData) {
    setError(null);
    const res = await fetch(`/api/admin/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to update article");
      return;
    }
    router.push("/admin/articles");
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Edit Article
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
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

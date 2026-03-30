"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VideoPostForm, { VideoPostFormData } from "@/components/admin/VideoPostForm";

type SelectOption = { id: number; name: string; slug: string };

export default function NewVideoPage() {
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

  async function handleSubmit(data: VideoPostFormData) {
    setError(null);
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create video post");
      return;
    }
    router.push("/admin/videos");
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          New Video Post
        </h2>
      </div>
      {error && (
        <div className="mb-4 px-4 py-3 text-sm border" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          {error}
        </div>
      )}
      <VideoPostForm
        categories={categories}
        tags={tags}
        countries={countries}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import VideoPostForm, { VideoPostFormData } from "@/components/admin/VideoPostForm";

interface Props {
  videoId: number;
  initialData: Partial<VideoPostFormData>;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  countries: { id: number; name: string; slug: string }[];
}

export default function EditVideoClient({ videoId, initialData, categories, tags, countries }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: VideoPostFormData) {
    setError(null);
    const res = await fetch(`/api/admin/videos/${videoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to update video post");
      return;
    }
    router.push("/admin/videos");
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
          Edit Video Post
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
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

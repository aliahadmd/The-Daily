"use client";

import { useState, useEffect } from "react";
import { slugify } from "@/lib/slugify";
import MediaUpload from "./MediaUpload";

export interface VideoPostFormData {
  title: string;
  slug: string;
  description: string;
  categoryId: number | null;
  tagIds: number[];
  countryId: number | null;
  coverImageId: number | null;
  coverImageUrl: string | null;
  videoMediaId: number | null;
  videoEmbedUrl: string;
  status: "draft" | "published" | "archived";
}

interface VideoPostFormProps {
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  countries: { id: number; name: string; slug: string }[];
  initialData?: Partial<VideoPostFormData>;
  onSubmit: (data: VideoPostFormData) => Promise<void>;
}

const defaultData: VideoPostFormData = {
  title: "",
  slug: "",
  description: "",
  categoryId: null,
  tagIds: [],
  countryId: null,
  coverImageId: null,
  coverImageUrl: null,
  videoMediaId: null,
  videoEmbedUrl: "",
  status: "draft",
};

export default function VideoPostForm({ categories, tags, countries, initialData, onSubmit }: VideoPostFormProps) {
  const [data, setData] = useState<VideoPostFormData>({ ...defaultData, ...initialData });
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [videoMode, setVideoMode] = useState<"embed" | "upload">(
    initialData?.videoEmbedUrl ? "embed" : "upload"
  );
  const [errors, setErrors] = useState<Partial<Record<keyof VideoPostFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugManual) {
      setData((d) => ({ ...d, slug: slugify(d.title) }));
    }
  }, [data.title, slugManual]);

  function set<K extends keyof VideoPostFormData>(key: K, value: VideoPostFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleTag(id: number) {
    setData((d) => ({
      ...d,
      tagIds: d.tagIds.includes(id) ? d.tagIds.filter((t) => t !== id) : [...d.tagIds, id],
    }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof VideoPostFormData, string>> = {};
    if (!data.title.trim()) errs.title = "Title is required";
    if (!data.slug.trim()) errs.slug = "Slug is required";
    if (videoMode === "embed" && !data.videoEmbedUrl.trim()) errs.videoEmbedUrl = "Embed URL is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-border bg-cream px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink";
  const labelClass = "block text-xs font-bold uppercase tracking-widest text-ink-light mb-1";
  const errorClass = "mt-1 text-xs text-accent font-bold";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputClass}
          placeholder="Video post title"
        />
        {errors.title && <p className={errorClass}>{errors.title}</p>}
      </div>

      {/* Slug */}
      <div>
        <label className={labelClass}>Slug *</label>
        <input
          type="text"
          value={data.slug}
          onChange={(e) => { setSlugManual(true); set("slug", e.target.value); }}
          className={inputClass}
          placeholder="url-friendly-slug"
        />
        {errors.slug && <p className={errorClass}>{errors.slug}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className={inputClass}
          placeholder="Video description"
        />
      </div>

      {/* Category + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={data.categoryId ?? ""}
            onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <select
            value={data.countryId ?? ""}
            onChange={(e) => set("countryId", e.target.value ? Number(e.target.value) : null)}
            className={inputClass}
          >
            <option value="">None</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags</label>
        <div className="flex flex-wrap gap-2 p-3 border border-border bg-cream min-h-10">
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`text-xs px-2 py-1 border font-bold uppercase tracking-wider transition-colors
                ${data.tagIds.includes(t.id)
                  ? "bg-ink text-cream border-ink"
                  : "bg-cream text-ink-light border-border hover:border-ink"}`}
            >
              {t.name}
            </button>
          ))}
          {tags.length === 0 && <span className="text-xs text-muted">No tags available</span>}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelClass}>Status</label>
        <select
          value={data.status}
          onChange={(e) => set("status", e.target.value as VideoPostFormData["status"])}
          className={inputClass}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Cover Image */}
      <div>
        <label className={labelClass}>Cover Image</label>
        <MediaUpload
          accept="image"
          type="cover"
          slug={data.slug || "draft"}
          currentUrl={data.coverImageUrl ?? undefined}
          onUpload={(url, mediaId) => { set("coverImageId", mediaId); set("coverImageUrl", url); }}
        />
      </div>

      {/* Video source toggle */}
      <div>
        <label className={labelClass}>Video Source</label>
        <div className="flex gap-0 mb-3">
          <button
            type="button"
            onClick={() => setVideoMode("embed")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors
              ${videoMode === "embed" ? "bg-ink text-cream border-ink" : "bg-cream text-ink-light border-border hover:border-ink"}`}
          >
            Embed URL
          </button>
          <button
            type="button"
            onClick={() => setVideoMode("upload")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t border-b border-r transition-colors
              ${videoMode === "upload" ? "bg-ink text-cream border-ink" : "bg-cream text-ink-light border-border hover:border-ink"}`}
          >
            Upload File
          </button>
        </div>

        {videoMode === "embed" ? (
          <div>
            <input
              type="url"
              value={data.videoEmbedUrl}
              onChange={(e) => set("videoEmbedUrl", e.target.value)}
              className={inputClass}
              placeholder="https://youtube.com/embed/…"
            />
            {errors.videoEmbedUrl && <p className={errorClass}>{errors.videoEmbedUrl}</p>}
          </div>
        ) : (
          <MediaUpload
            accept="video"
            type="video"
            slug={data.slug || "draft"}
            onUpload={(_, mediaId) => set("videoMediaId", mediaId)}
          />
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-ink text-cream text-sm font-bold uppercase tracking-widest hover:bg-ink-light transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Video Post"}
        </button>
      </div>
    </form>
  );
}

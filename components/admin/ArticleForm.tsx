"use client";

import { useState, useEffect } from "react";
import { slugify } from "@/lib/slugify";
import MarkdownEditor from "./MarkdownEditor";
import MediaUpload from "./MediaUpload";

export interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  categoryId: number;
  tagIds: number[];
  countryId: number | null;
  authorName: string;
  isBreakingNews: boolean;
  isFeatured: boolean;
  coverImageId: number | null;
  coverImageUrl: string | null;
  videoId: number | null;
  videoEmbedUrl: string;
  status: "draft" | "published" | "archived";
}

interface ArticleFormProps {
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  countries: { id: number; name: string; slug: string }[];
  initialData?: Partial<ArticleFormData>;
  onSubmit: (data: ArticleFormData) => Promise<void>;
}

const defaultData: ArticleFormData = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  categoryId: 0,
  tagIds: [],
  countryId: null,
  authorName: "",
  isBreakingNews: false,
  isFeatured: false,
  coverImageId: null,
  coverImageUrl: null,
  videoId: null,
  videoEmbedUrl: "",
  status: "draft",
};

export default function ArticleForm({ categories, tags, countries, initialData, onSubmit }: ArticleFormProps) {
  const [data, setData] = useState<ArticleFormData>({ ...defaultData, ...initialData });
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [errors, setErrors] = useState<Partial<Record<keyof ArticleFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugManual) {
      setData((d) => ({ ...d, slug: slugify(d.title) }));
    }
  }, [data.title, slugManual]);

  function set<K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) {
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
    const errs: Partial<Record<keyof ArticleFormData, string>> = {};
    if (!data.title.trim()) errs.title = "Title is required";
    if (!data.slug.trim()) errs.slug = "Slug is required";
    if (!data.body.trim()) errs.body = "Body is required";
    if (!data.categoryId) errs.categoryId = "Category is required";
    if (!data.authorName.trim()) errs.authorName = "Author name is required";
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

  async function handleImageUpload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "body");
    formData.append("slug", data.slug || "draft");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();
    return url;
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
          placeholder="Article title"
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

      {/* Excerpt */}
      <div>
        <label className={labelClass}>Excerpt</label>
        <textarea
          value={data.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Short summary shown in article cards"
        />
      </div>

      {/* Author */}
      <div>
        <label className={labelClass}>Author Name *</label>
        <input
          type="text"
          value={data.authorName}
          onChange={(e) => set("authorName", e.target.value)}
          className={inputClass}
          placeholder="Jane Doe"
        />
        {errors.authorName && <p className={errorClass}>{errors.authorName}</p>}
      </div>

      {/* Category + Country row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category *</label>
          <select
            value={data.categoryId || ""}
            onChange={(e) => set("categoryId", Number(e.target.value))}
            className={inputClass}
          >
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className={errorClass}>{errors.categoryId}</p>}
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
          onChange={(e) => set("status", e.target.value as ArticleFormData["status"])}
          className={inputClass}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Flags */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isBreakingNews}
            onChange={(e) => set("isBreakingNews", e.target.checked)}
            className="w-4 h-4 accent-ink"
          />
          <span className="text-sm font-bold text-ink">Breaking News</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
            className="w-4 h-4 accent-ink"
          />
          <span className="text-sm font-bold text-ink">Featured</span>
        </label>
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

      {/* Video */}
      <div>
        <label className={labelClass}>Video Embed URL</label>
        <input
          type="url"
          value={data.videoEmbedUrl}
          onChange={(e) => set("videoEmbedUrl", e.target.value)}
          className={inputClass}
          placeholder="https://youtube.com/embed/…"
        />
        <p className="mt-1 text-xs text-muted">Or upload a video file:</p>
        <div className="mt-2">
          <MediaUpload
            accept="video"
            type="video"
            slug={data.slug || "draft"}
            onUpload={(_, mediaId) => set("videoId", mediaId)}
          />
        </div>
      </div>

      {/* Body */}
      <div>
        {errors.body && <p className={`${errorClass} mb-1`}>{errors.body}</p>}
        <MarkdownEditor
          value={data.body}
          onChange={(v) => set("body", v)}
          onImageUpload={handleImageUpload}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-ink text-cream text-sm font-bold uppercase tracking-widest hover:bg-ink-light transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Article"}
        </button>
      </div>
    </form>
  );
}

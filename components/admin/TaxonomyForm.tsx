"use client";

import { useState, useEffect } from "react";
import { slugify } from "@/lib/slugify";

export interface TaxonomyFormData {
  name: string;
  slug: string;
  description?: string;
  isoCode?: string;
}

interface TaxonomyFormProps {
  type: "category" | "tag" | "country";
  initialData?: { id?: number; name?: string; slug?: string; description?: string; isoCode?: string };
  onSubmit: (data: TaxonomyFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export default function TaxonomyForm({ type, initialData, onSubmit, onDelete }: TaxonomyFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [isoCode, setIsoCode] = useState(initialData?.isoCode ?? "");
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [errors, setErrors] = useState<{ name?: string; slug?: string; isoCode?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  function validate(): boolean {
    const errs: { name?: string; slug?: string; isoCode?: string } = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!slug.trim()) errs.slug = "Slug is required";
    if (type === "country" && !isoCode.trim()) errs.isoCode = "ISO code is required";
    if (type === "country" && isoCode.trim().length !== 2) errs.isoCode = "ISO code must be 2 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: TaxonomyFormData = { name: name.trim(), slug: slug.trim() };
      if (type === "category") payload.description = description.trim();
      if (type === "country") payload.isoCode = isoCode.trim().toUpperCase();
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (!initialData?.id || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialData.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const inputClass = "w-full border border-border bg-cream px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink";
  const labelClass = "block text-xs font-bold uppercase tracking-widest text-ink-light mb-1";
  const errorClass = "mt-1 text-xs text-accent font-bold";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className={labelClass}>{typeLabel} Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((err) => ({ ...err, name: undefined })); }}
          className={inputClass}
          placeholder={`e.g. ${type === "category" ? "World News" : type === "tag" ? "Climate" : "Germany"}`}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* Slug */}
      <div>
        <label className={labelClass}>Slug *</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlugManual(true); setSlug(e.target.value); setErrors((err) => ({ ...err, slug: undefined })); }}
          className={inputClass}
          placeholder="url-friendly-slug"
        />
        {errors.slug && <p className={errorClass}>{errors.slug}</p>}
      </div>

      {/* Description — categories only */}
      {type === "category" && (
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Optional description shown on the category page"
          />
        </div>
      )}

      {/* ISO Code — countries only */}
      {type === "country" && (
        <div>
          <label className={labelClass}>ISO 3166-1 Alpha-2 Code *</label>
          <input
            type="text"
            value={isoCode}
            onChange={(e) => { setIsoCode(e.target.value.toUpperCase()); setErrors((err) => ({ ...err, isoCode: undefined })); }}
            className={`${inputClass} uppercase`}
            maxLength={2}
            placeholder="DE"
          />
          {errors.isoCode && <p className={errorClass}>{errors.isoCode}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-ink text-cream text-xs font-bold uppercase tracking-widest hover:bg-ink-light transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : initialData?.id ? `Update ${typeLabel}` : `Create ${typeLabel}`}
        </button>

        {initialData?.id && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors disabled:opacity-50
              ${confirmDelete
                ? "bg-accent text-cream border-accent"
                : "bg-cream text-accent border-accent hover:bg-accent hover:text-cream"}`}
          >
            {deleting ? "Deleting…" : confirmDelete ? "Confirm Delete" : `Delete ${typeLabel}`}
          </button>
        )}
      </div>

      {confirmDelete && (
        <p className="text-xs text-accent">
          Click &ldquo;Confirm Delete&rdquo; again to permanently delete this {type}.{" "}
          <button type="button" onClick={() => setConfirmDelete(false)} className="underline">Cancel</button>
        </p>
      )}
    </form>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState } from "react";

interface MediaUploadProps {
  accept: "image" | "video";
  onUpload: (url: string, mediaId: number) => void;
  currentUrl?: string;
  slug: string;
  type: "cover" | "video" | "body";
}

export default function MediaUpload({ accept, onUpload, currentUrl, slug, type }: MediaUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("slug", slug);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url, mediaId } = await res.json();
      if (accept === "image") setPreviewUrl(url);
      onUpload(url, mediaId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const mimeAccept = accept === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm";

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-sm cursor-pointer transition-colors flex flex-col items-center justify-center min-h-32 p-4 text-center
          ${dragging ? "border-ink bg-cream-dark" : "border-border hover:border-ink-light"}
          ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          <span className="text-sm text-muted animate-pulse">Uploading…</span>
        ) : previewUrl && accept === "image" ? (
          <div className="relative w-full aspect-video">
            <Image src={previewUrl} alt="Preview" fill className="object-contain" sizes="400px" />
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-ink-light">
              Drag & drop or <span className="font-bold underline">browse</span>
            </p>
            <p className="text-xs text-muted mt-1">
              {accept === "image" ? "JPEG, PNG, WebP, GIF — max 20 MB" : "MP4, WebM — max 500 MB"}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={mimeAccept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previewUrl && accept === "image" && (
        <button
          type="button"
          onClick={() => setPreviewUrl(null)}
          className="text-xs text-muted hover:text-accent underline"
        >
          Remove
        </button>
      )}

      {error && <p className="text-xs text-accent font-bold">{error}</p>}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export default function MarkdownEditor({ value, onChange, onImageUpload }: MarkdownEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onImageUpload(file);
      const imageMarkdown = `\n![${file.name}](${url})\n`;
      onChange(value + imageMarkdown);
    } catch {
      alert("Image upload failed.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="border border-border rounded-sm overflow-hidden" data-color-mode="light">
      <div className="flex items-center gap-2 px-3 py-2 bg-cream-dark border-b border-border">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">Body</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-bold uppercase tracking-wider text-ink-light border border-border px-2 py-1 hover:bg-cream-dark transition-colors"
        >
          Insert Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? "")}
        height={480}
        preview="edit"
        hideToolbar={false}
        style={{ borderRadius: 0, border: "none" }}
      />
    </div>
  );
}

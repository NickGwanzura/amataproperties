"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";

export function DocumentUpload({
  value,
  onChange,
  label = "Upload document",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";

    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/document", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      onChange(data.url!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
          <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <FileText className="size-4" /> View uploaded document
          </a>
          <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-red-600" aria-label="Remove document">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {uploading ? <Loader2 className="size-4 animate-spin text-primary" /> : <Upload className="size-4 text-muted-foreground/60" />}
          {uploading ? "Uploading…" : label}
        </button>
      )}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: "video" | "square" | "4/3";
};

const aspectClasses: Record<NonNullable<Props["aspectRatio"]>, string> = {
  video: "aspect-video",
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
};

export function ImageUpload({ value, onChange, aspectRatio = "video" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cls = aspectClasses[aspectRatio];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";

    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
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
        <div className={`group relative overflow-hidden rounded-lg border bg-muted ${cls}`}>
          <Image src={value} alt="Uploaded image" fill className="object-cover" sizes="600px" unoptimized />
          <div className="absolute inset-0 flex items-start justify-end gap-1.5 p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-black/90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <ImagePlus className="size-3" />}
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="grid size-7 place-items-center rounded-md bg-black/70 text-white transition hover:bg-red-600/80"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50 ${cls}`}
        >
          {uploading
            ? <Loader2 className="size-7 animate-spin text-primary" />
            : <ImagePlus className="size-7 text-muted-foreground/50" />}
          <span className="font-medium">{uploading ? "Uploading…" : "Click to upload"}</span>
          <span className="text-xs opacity-60">JPEG · PNG · WebP · up to 10 MB</span>
        </button>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

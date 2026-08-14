"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { ImageUpload } from "@/components/image-upload";
import { PROPERTY_HERO_IMAGE } from "@/lib/brand-assets";

export function MarketingImageSettings() {
  const [marketingImageUrl, setMarketingImageUrl] = useState(PROPERTY_HERO_IMAGE);
  const [marketingLoading, setMarketingLoading] = useState(true);
  const [marketingStatus, setMarketingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [marketingError, setMarketingError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMarketingImage() {
      try {
        const response = await fetch("/api/admin/site-settings");
        const data = await response.json() as { marketingImageUrl?: string };
        if (active && response.ok && data.marketingImageUrl) {
          setMarketingImageUrl(data.marketingImageUrl);
        }
      } finally {
        if (active) setMarketingLoading(false);
      }
    }

    void loadMarketingImage();
    return () => {
      active = false;
    };
  }, []);

  async function saveMarketingImage() {
    setMarketingStatus("saving");
    setMarketingError("");
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingImageUrl }),
      });
      const data = await response.json() as { marketingImageUrl?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save marketing image.");
      setMarketingImageUrl(data.marketingImageUrl ?? marketingImageUrl);
      setMarketingStatus("saved");
      setTimeout(() => setMarketingStatus("idle"), 3000);
    } catch (error) {
      setMarketingStatus("error");
      setMarketingError(error instanceof Error ? error.message : "Could not save marketing image.");
    }
  }

  return (
    <section className="premium-panel p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Homepage & About Image</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This single image is used in the homepage hero, about hero, and about mission section.
          </p>
        </div>
        <button
          type="button"
          onClick={saveMarketingImage}
          disabled={marketingLoading || marketingStatus === "saving" || !marketingImageUrl}
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
        >
          {marketingLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Loading
            </>
          ) : marketingStatus === "saving" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving
            </>
          ) : marketingStatus === "saved" ? (
            <>
              <CheckCircle2 className="size-4" />
              Saved
            </>
          ) : (
            "Save Image"
          )}
        </button>
      </div>
      <div className="mt-5 max-w-3xl">
        <ImageUpload
          value={marketingImageUrl}
          onChange={setMarketingImageUrl}
          aspectRatio="video"
        />
        {marketingStatus === "error" ? (
          <p className="mt-2 text-sm font-medium text-red-600">{marketingError}</p>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
  const [shared, setShared] = useState(false);

  async function sharePage() {
    const shareData = {
      title: "Amata Properties — launching 01 September 2026",
      text: "A sharper way to buy, sell, rent and manage property across Zimbabwe.",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    } catch {
      // Ignore dismissals from the native share sheet.
    }
  }

  return (
    <button
      type="button"
      onClick={sharePage}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-white/75 transition hover:border-[#F0444C]/60 hover:bg-[#D71920]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0444C]"
      aria-label="Share the Amata Properties launch page"
    >
      {shared ? <Check className="size-4 text-[#F0444C]" /> : <Link2 className="size-4 text-[#F0444C]" />}
      {shared ? "Link copied" : "Share launch"}
    </button>
  );
}

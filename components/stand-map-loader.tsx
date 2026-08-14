"use client";

import dynamic from "next/dynamic";
import type { StandItem } from "@/components/stand-map";

const StandMap = dynamic(
  () => import("@/components/stand-map").then((m) => m.StandMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[620px] animate-pulse rounded-xl border border-border/50 bg-muted/30" />
    ),
  },
);

export function StandMapLoader({
  stands,
  geoJson,
}: {
  stands: StandItem[];
  geoJson?: unknown;
}) {
  return <StandMap stands={stands} geoJson={geoJson} />;
}

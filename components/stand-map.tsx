"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type StandStatus = "AVAILABLE" | "PRESALE" | "RESERVED" | "SOLD" | "BLOCKED";

export type StandItem = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: number;
  status: StandStatus;
};

const STAND_FILL: Record<StandStatus, string> = {
  AVAILABLE: "#1D6EEB",
  PRESALE:   "#EAB308",
  RESERVED:  "#F97316",
  SOLD:      "#0F172A",
  BLOCKED:   "#94A3B8",
};

const STAND_STROKE: Record<StandStatus, string> = {
  AVAILABLE: "#1558CC",
  PRESALE:   "#CA8A04",
  RESERVED:  "#EA580C",
  SOLD:      "#1E293B",
  BLOCKED:   "#64748B",
};

function featureStyle(type: string) {
  switch (type) {
    case "road":
      return { fillColor: "#94A3B8", color: "#78909C", weight: 0, fillOpacity: 1 };
    case "school":
    case "church":
    case "civic":
    case "commercial":
      return { fillColor: "#F59E0B", color: "#D97706", weight: 1, fillOpacity: 0.9 };
    case "park":
    case "open_space":
    case "reserve":
      return { fillColor: "#4ADE80", color: "#16A34A", weight: 1, fillOpacity: 0.85 };
    case "cluster":
    case "flats":
    case "garden":
      return { fillColor: "#A7F3D0", color: "#34D399", weight: 1, fillOpacity: 0.85 };
    case "boundary":
    case "site":
      return { fillColor: "#CBD5E1", color: "#94A3B8", weight: 1, fillOpacity: 0.4 };
    default:
      return { fillColor: "#E2E8F0", color: "#CBD5E1", weight: 1, fillOpacity: 0.6 };
  }
}

const LEGEND: Array<{ color: string; label: string }> = [
  { color: STAND_FILL.AVAILABLE, label: "Available" },
  { color: STAND_FILL.PRESALE,   label: "Presale" },
  { color: STAND_FILL.RESERVED,  label: "Reserved" },
  { color: STAND_FILL.SOLD,      label: "Sold" },
  { color: STAND_FILL.BLOCKED,   label: "Blocked" },
  { color: "#F59E0B",            label: "Amenity" },
  { color: "#A7F3D0",            label: "Open Space" },
];

export function StandMap({
  stands,
  geoJson,
}: {
  stands: StandItem[];
  geoJson?: unknown;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !geoJson) return;

    import("leaflet").then((L) => {
      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const byNumber = new Map(stands.map((s) => [s.standNumber, s]));

      const layer = L.geoJSON(geoJson as GeoJSON.GeoJsonObject, {
        style: (feature) => {
          const num = feature?.properties?.standNumber as string | undefined;
          if (num) {
            const s = byNumber.get(num);
            if (s) {
              return {
                fillColor: STAND_FILL[s.status],
                color: STAND_STROKE[s.status],
                weight: 1,
                fillOpacity: 0.9,
              };
            }
          }
          const type = (feature?.properties?.type ?? "").toLowerCase();
          return featureStyle(type);
        },

        onEachFeature: (feature, layer) => {
          const num = feature?.properties?.standNumber as string | undefined;
          const stand = num ? byNumber.get(num) : undefined;

          if (stand) {
            layer.bindTooltip(stand.standNumber, {
              permanent: true,
              direction: "center",
              className: "sn-label",
            });

            const path = layer as L.Path;
            path.on("mouseover", () => path.setStyle({ weight: 2, fillOpacity: 1 }));
            path.on("mouseout",  () => path.setStyle({ weight: 1, fillOpacity: 0.9 }));

            if (stand.status === "AVAILABLE") {
              path.on("click", () => {
                window.location.href = `?stand=${stand.id}#reserve`;
              });
              (path.getElement() as HTMLElement | null)?.style.setProperty("cursor", "pointer");
            }
          } else {
            const label = feature?.properties?.label as string | undefined;
            if (label) {
              layer.bindTooltip(label, {
                permanent: true,
                direction: "center",
                className: "sn-amenity-label",
              });
            }
          }
        },
      }).addTo(map);

      if (layer.getBounds().isValid()) {
        map.fitBounds(layer.getBounds(), { padding: [32, 32] });
      }

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!geoJson) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 shadow-sm">
      <div ref={containerRef} className="h-[620px] w-full bg-slate-100" />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t bg-card px-4 py-3">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

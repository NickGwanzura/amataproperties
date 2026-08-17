import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amataproperties.co.zw";

  const manifest = {
    name: "Amata Properties",
    short_name: "Amata",
    description:
      "A full-service real estate agency for buying, selling, leasing, and managing property across Zimbabwe.",
    start_url: "/",
    display: "standalone" as const,
    orientation: "portrait-primary" as const,
    background_color: "#FFFFFF",
    theme_color: "#B5121B",
    categories: ["real estate", "business", "property"],
    lang: "en-ZW",
    scope: "/",
    icons: [
      {
        src: `${baseUrl}/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable" as const,
      },
      {
        src: `${baseUrl}/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable" as const,
      },
    ],
    prefer_related_applications: false,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

import type { MetadataRoute } from "next";
import { appUrl } from "@/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/developments", "/services", "/about", "/contact", "/faq", "/news"];
  return routes.map((route) => ({
    url: appUrl(route),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));
}

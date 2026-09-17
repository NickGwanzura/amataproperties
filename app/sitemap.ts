import type { MetadataRoute } from "next";
import { appUrl } from "@/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/developments", "/services", "/properties", "/property-sales", "/rentals", "/valuations", "/about", "/contact", "/faq"];
  return routes.map((route) => ({
    url: appUrl(route),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));
}

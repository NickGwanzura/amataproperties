import type { MetadataRoute } from "next";
import { appUrl } from "@/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: appUrl("/coming-soon"),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }];
}

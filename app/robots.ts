import type { MetadataRoute } from "next";
import { appUrl } from "@/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/accounts/", "/agent/", "/ceo/", "/client/", "/group-admin/", "/sysadmin/", "/login", "/forgot-password", "/reset-password"] }],
    sitemap: appUrl("/sitemap.xml"),
    host: appUrl(),
  };
}

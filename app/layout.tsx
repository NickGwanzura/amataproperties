import type { Metadata, Viewport } from "next";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import { FooterWrapper } from "@/components/footer-wrapper";
import { AppHeader } from "@/components/app-header";
import { ToastProvider } from "@/components/toast";
import { app, appUrl, company } from "@/config";
import "./globals.css";

const DESCRIPTION =
  "Amata is a full-service real estate agency helping people buy, sell, lease, and manage exceptional property across Zimbabwe.";

export const metadata: Metadata = {
  metadataBase: new URL(app.url),
  title: {
    default: company.name,
    template: `%s | ${company.shortName}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: company.name,
    url: app.url,
    title: company.name,
    description: DESCRIPTION,
    images: [{ url: appUrl("/opengraph-image"), width: 1200, height: 630, alt: company.name }],
    locale: company.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: company.name,
    description: DESCRIPTION,
    images: [appUrl("/opengraph-image")],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/amata-mark.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/amata-mark.svg",
  },
  manifest: appUrl("/manifest"),
  alternates: { canonical: app.url },
  appleWebApp: { capable: true, title: company.shortName, statusBarStyle: "default" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const serviceWorkerScript = process.env.NODE_ENV === "production"
    ? `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/sw.js").catch(function(err) {
      console.warn("SW registration failed:", err);
    });
  });
}
`
    : `
// Do not let a production service worker serve stale bundles during local development.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async function() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (!registrations.length) return;
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    if (!sessionStorage.getItem("amata-dev-sw-cleared")) {
      sessionStorage.setItem("amata-dev-sw-cleared", "1");
      window.location.reload();
    }
  });
}
`;

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href={appUrl("/manifest")} />
      </head>
      <body className="font-sans antialiased">
        {/* Register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: serviceWorkerScript,
          }}
        />
        <ToastProvider>
          <AppHeader />
          {children}
          <FooterWrapper />
        </ToastProvider>
      </body>
    </html>
  );
}

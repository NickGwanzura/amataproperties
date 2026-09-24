import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Amata Properties uses cookies on its website and client portal.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Cookie Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: June 2026 · Amata Properties Private Limited
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold">What are cookies?</h2>
          <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
            Cookies are small text files stored on your device when you visit a website. They are
            widely used to make websites work, improve performance, and provide information to site
            owners.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">How we use cookies</h2>
          <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
            Amata Properties uses only essential session cookies required for the client portal to
            function. These cookies:
          </p>
          <ul className="mt-3 space-y-2 text-[15px] leading-7 text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              Authenticate you when you log in to your client account
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              Keep your session active while you navigate the portal
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              Are deleted automatically when you log out or close your browser
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Cookies we do NOT use</h2>
          <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
            We do not use advertising cookies, third-party tracking cookies, analytics cookies, or
            any cookies that profile your browsing behaviour across other websites.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Managing cookies</h2>
          <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
            You can control cookies through your browser settings. Note that disabling session
            cookies will prevent you from logging in to the client portal. For most browsers,
            cookie controls are found under Settings → Privacy or Settings → Security.
          </p>
        </section>
      </div>

      <div className="mt-12 rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
        <p>
          Questions about our cookie use?{" "}
          <Link href="/contact" className="font-semibold text-primary underline-offset-2 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

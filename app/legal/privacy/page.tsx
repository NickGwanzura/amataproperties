import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Amata Properties collects, uses, and protects your personal information.",
  alternates: { canonical: "/legal/privacy" },
};

const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, such as your name, phone number, email address, and enquiry details when you fill in a contact form, make a reservation, or create a client account. We also collect usage data when you interact with our website.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information to process reservations and sales, communicate with you about your enquiry or property, send account statements and receipts, and improve our services. We will never sell your personal data to third parties.",
  },
  {
    title: "3. WhatsApp Communications",
    body: "When you use our WhatsApp enquiry feature, your message is sent directly to our sales team via the WhatsApp platform. Please review WhatsApp's own privacy policy regarding how they handle message data.",
  },
  {
    title: "4. Data Security",
    body: "We take reasonable technical and organisational measures to protect your personal information from unauthorised access, loss, or misuse. Our client portal uses session-based authentication and encrypted communication.",
  },
  {
    title: "5. Data Retention",
    body: "We retain your personal information for as long as necessary to fulfil the purposes described in this policy, to comply with legal obligations, and to resolve disputes.",
  },
  {
    title: "6. Your Rights",
    body: "You have the right to access, correct, or request deletion of your personal data held by Amata Properties. To exercise these rights, please contact us at sales@amataproperties.com.",
  },
  {
    title: "7. Cookies",
    body: "Our website uses session cookies required for authentication. We do not use tracking or advertising cookies. Please see our Cookie Policy for more details.",
  },
  {
    title: "8. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. The date at the top of this page reflects when the policy was last revised. Continued use of our services constitutes acceptance of any changes.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: June 2026 · Amata Properties (Pvt) Ltd
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-muted/40 p-6 text-sm text-muted-foreground">
        <p>
          Privacy concerns?{" "}
          <Link href="/contact" className="font-semibold text-primary underline-offset-2 hover:underline">
            Contact our team
          </Link>{" "}
          and we will respond within two business days.
        </p>
      </div>
    </main>
  );
}

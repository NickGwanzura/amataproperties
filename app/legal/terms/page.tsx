import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the use of Amata Properties services and website.",
  alternates: { canonical: "/legal/terms" },
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing and using the Amata Properties website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.",
  },
  {
    title: "2. Property Sales and Reservations",
    body: "All stand reservations are subject to availability and formal approval by Amata Properties (Pvt) Ltd. A reservation form and deposit payment are required to secure a stand. Amata Properties reserves the right to cancel any reservation where payment obligations are not met within the agreed timeframe.",
  },
  {
    title: "3. Payment Plans",
    body: "Payment plan terms are set out in the individual Sale Agreement signed between Amata Properties and the purchaser. All payments must be made in accordance with the agreed schedule. Late payments may attract interest charges as specified in the Sale Agreement.",
  },
  {
    title: "4. Title and Transfer",
    body: "Title to any stand purchased will only transfer to the purchaser upon full settlement of the purchase price and all associated costs. Amata Properties will facilitate the title transfer process with the relevant land registry authorities in Zimbabwe.",
  },
  {
    title: "5. Website Use",
    body: "The content on this website is provided for informational purposes only. While we endeavour to keep all information accurate and up to date, Amata Properties makes no warranties regarding the completeness or accuracy of any information. Stand availability and pricing are subject to change without notice.",
  },
  {
    title: "6. Privacy",
    body: "Your use of our services is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.",
  },
  {
    title: "7. Dispute Resolution",
    body: "Any disputes arising from these Terms or your use of our services shall be governed by the laws of Zimbabwe. Both parties agree to first attempt resolution through good-faith negotiation before pursuing any legal remedies.",
  },
  {
    title: "8. Contact",
    body: "For questions about these Terms of Service, please contact us at sales@amataproperties.com or visit our office at 6A Chatham, Eastlea, Harare.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
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
          Questions about these terms?{" "}
          <Link href="/contact" className="font-semibold text-primary underline-offset-2 hover:underline">
            Contact our team
          </Link>{" "}
          and we will be happy to assist.
        </p>
      </div>
    </main>
  );
}

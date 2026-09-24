"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { SALES_LINES, waLink } from "@/lib/site-config";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interest: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    const text = [
      `Hello Amata Properties,`,
      ``,
      `Name: ${form.name}`,
      form.phone ? `Phone: ${form.phone}` : null,
      form.email ? `Email: ${form.email}` : null,
      form.interest ? `Topic: ${form.interest}` : null,
      ``,
      form.message || "I am interested in your developments.",
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.open(
      waLink(text),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
      {/* Left — why contact us */}
      <div>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Send an enquiry
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
          Tell us what you&apos;re looking for
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Fill in the form and we&apos;ll route your message directly to a sales agent via
          WhatsApp, the fastest way to get a real answer.
        </p>

        <div className="mt-10 space-y-6">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Instant WhatsApp response</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your enquiry opens a pre-filled WhatsApp message. Agents typically reply within
                minutes during office hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Prefer to call?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Direct lines to our sales team, with no call centres.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SALES_LINES.map(({ number, href }) => (
                  <a
                    key={number}
                    href={href}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold transition hover:border-primary/50 hover:text-primary"
                  >
                    {number}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Direct WhatsApp button */}
        <a
          href={waLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
        >
          <MessageCircle className="size-4" />
          Chat directly on WhatsApp
        </a>
      </div>

      {/* Right — form */}
      <form
        onSubmit={handleWhatsApp}
        className="rounded-2xl border bg-card p-7 shadow-sm"
      >
        <div className="space-y-5">
          <label className="form-label">
            Your name <span className="text-destructive">*</span>
            <input
              name="name"
              required
              placeholder="e.g. Tinashe Moyo"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="form-label">
              Phone number
              <input
                name="phone"
                type="tel"
                placeholder="+263 7X XXX XXXX"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 w-full"
              />
            </label>
            <label className="form-label">
              Email address
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full"
              />
            </label>
          </div>

          <label className="form-label">
            I&apos;m interested in
            <select
              name="interest"
              value={form.interest}
              onChange={handleChange}
              className="mt-1 w-full"
            >
              <option value="">Select a topic…</option>
              <option>Viewing available stands</option>
              <option>Reserving a stand</option>
              <option>Payment plan enquiry</option>
              <option>Existing reservation or instalment</option>
              <option>Selling a property</option>
              <option>Property marketing</option>
              <option>Developer partnership</option>
              <option>Agent enquiry</option>
              <option>General enquiry</option>
            </select>
          </label>

          <label className="form-label">
            Message
            <textarea
              name="message"
              placeholder="Tell us more about what you're looking for…"
              rows={4}
              value={form.message}
              onChange={handleChange}
              className="mt-1 w-full resize-none"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:translate-y-0"
        >
          <MessageCircle className="size-4" />
          Send via WhatsApp
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Opens a pre-filled WhatsApp message. Requires WhatsApp on this device.
        </p>
      </form>
    </div>
  );
}

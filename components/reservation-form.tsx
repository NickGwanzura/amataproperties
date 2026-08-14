"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import type { Development, Stand } from "@/lib/db/schema";
import { reserveStand, type ReservationState } from "@/lib/reservations";
import { money } from "@/lib/utils";

const initialState: ReservationState = { ok: false, message: "" };

function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-[11px] font-medium text-red-600">{msgs[0]}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </p>
  );
}

export function ReservationForm({
  development,
  preselectedStandId,
}: {
  development: Development & { stands: Stand[] };
  preselectedStandId?: string;
}) {
  const [state, formAction, pending] = useActionState(reserveStand, initialState);
  const availableStands = development.stands.filter((stand) => stand.status === "AVAILABLE");
  const inputClass = (name: string) =>
    `h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary${state.errors?.[name]?.length ? " border-red-400 ring-1 ring-red-300" : " border-border/70"}`;

  if (state.ok && state.message) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <span className="mb-4 grid size-16 place-items-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </span>
        <h3 className="text-lg font-semibold">Reservation Submitted!</h3>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">{state.message}</p>
        <div className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-[13px] text-amber-900">
          <strong className="font-semibold">Important:</strong> Your reservation holds the stand for{" "}
          <strong>24 hours</strong>. Please pay your deposit before it expires or the stand will be released.
        </div>
      </div>
    );
  }

  return (
    <form id="reserve" action={formAction} className="p-5">
      <input type="hidden" name="developmentSlug" value={development.slug} />

      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        {/* Full Name */}
        <div>
          <Label required>Full Name</Label>
          <input required name="fullName" placeholder="Jane Doe" className={inputClass("fullName")} />
          <FieldError name="fullName" errors={state.errors} />
        </div>

        {/* National ID */}
        <div>
          <Label required>National ID</Label>
          <input required name="nationalId" placeholder="e.g. 63-123456-A-70" className={inputClass("nationalId")} />
          <FieldError name="nationalId" errors={state.errors} />
        </div>

        {/* Phone */}
        <div>
          <Label required>Phone</Label>
          <input required name="phone" type="tel" placeholder="e.g. +263 71 234 5678" className={inputClass("phone")} />
          <FieldError name="phone" errors={state.errors} />
        </div>

        {/* Email */}
        <div>
          <Label required>Email</Label>
          <input required type="email" name="email" placeholder="jane@example.com" className={inputClass("email")} />
          <FieldError name="email" errors={state.errors} />
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <Label required>Physical Address</Label>
          <input required name="address" placeholder="123 Sam Nujoma St, Harare" className={inputClass("address")} />
          <FieldError name="address" errors={state.errors} />
        </div>

        {/* Preferred Stand */}
        <div className="sm:col-span-2">
          <Label required>Preferred Stand</Label>
          <select
            required
            name="standId"
            defaultValue={preselectedStandId ?? availableStands[0]?.id ?? ""}
            className={`h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary${state.errors?.standId?.length ? " border-red-400 ring-1 ring-red-300" : " border-border/70"}`}
          >
            {availableStands.length === 0 ? (
              <option value="">No stands available</option>
            ) : (
              availableStands.map((stand) => (
                <option key={stand.id} value={stand.id}>
                  {stand.standNumber}: {stand.sizeSqm} m² · {money(Number(stand.price))}
                </option>
              ))
            )}
          </select>
          <FieldError name="standId" errors={state.errors} />
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Message</p>
            <span className="text-[11px] text-muted-foreground/60">(optional)</span>
          </div>
          <textarea
            name="message"
            rows={3}
            placeholder="Preferred payment terms, site visit timing, or questions…"
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary${state.errors?.message?.length ? " border-red-400 ring-1 ring-red-300" : " border-border/70"}`}
          />
          <FieldError name="message" errors={state.errors} />
        </div>
      </div>

      {/* 24h notice */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
        <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Your stand is held for <strong className="text-foreground">24 hours</strong> after reservation.
          Deposit must be paid within this window to secure allocation.
        </p>
      </div>

      {state.message && !state.ok && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || availableStands.length === 0}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Reserve This Stand
          </>
        )}
      </button>
    </form>
  );
}

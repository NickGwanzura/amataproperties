"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  Banknote, CheckCircle2, DollarSign, Hash, MapPin, PlusCircle, User, X,
} from "lucide-react";
import { createDirectSaleAction, type DirectSaleState } from "@/lib/actions";
import { useToast } from "@/components/toast";
import { money } from "@/lib/utils";

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ECOCASH", label: "EcoCash" },
  { value: "VELOCITY", label: "Velocity" },
  { value: "OTHER", label: "Other" },
];

type Stand = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: string;
  development: { id: string; name: string; paymentDurationMonths: number };
};

const initialState: DirectSaleState = { ok: false, message: "" };

export function DirectSaleForm({ stands }: { stands: Stand[] }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createDirectSaleAction, initialState);
  const prevOkRef = useRef(false);
  const [selectedStandId, setSelectedStandId] = useState(stands[0]?.id ?? "");

  const developments = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const s of stands) map.set(s.development.id, { id: s.development.id, name: s.development.name });
    return Array.from(map.values());
  }, [stands]);

  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState(developments[0]?.id ?? "");
  const standsForDevelopment = stands.filter((s) => s.development.id === selectedDevelopmentId);
  const selectedStand = stands.find((s) => s.id === selectedStandId) ?? standsForDevelopment[0] ?? null;

  if (state.ok && !prevOkRef.current) {
    prevOkRef.current = true;
    toast.success("Sale created", state.message);
    setOpen(false);
  }
  if (!state.ok) prevOkRef.current = false;

  const inputCls = "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
  const err = (field: string) => state.errors?.[field]?.[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={stands.length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusCircle className="size-4" />
        Direct Sale
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-border/70 bg-card shadow-2xl my-8">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10">
                  <Banknote className="size-5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Direct Sale</p>
                  <p className="text-xs text-muted-foreground">Sell an available stand without a presale</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={formAction} className="space-y-4 p-5">
              {/* Client details */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5" /> Client
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input name="fullName" placeholder="Full name" required className={inputCls} />
                    {err("fullName") && <p className="mt-1 text-[11px] text-red-600">{err("fullName")}</p>}
                  </div>
                  <div>
                    <input name="nationalId" placeholder="National ID" required className={inputCls} />
                    {err("nationalId") && <p className="mt-1 text-[11px] text-red-600">{err("nationalId")}</p>}
                  </div>
                  <div>
                    <input name="phone" placeholder="Phone" required className={inputCls} />
                    {err("phone") && <p className="mt-1 text-[11px] text-red-600">{err("phone")}</p>}
                  </div>
                  <div className="col-span-2">
                    <input name="email" type="email" placeholder="Email" required className={inputCls} />
                    {err("email") && <p className="mt-1 text-[11px] text-red-600">{err("email")}</p>}
                  </div>
                  <div className="col-span-2">
                    <input name="address" placeholder="Physical address" required className={inputCls} />
                    {err("address") && <p className="mt-1 text-[11px] text-red-600">{err("address")}</p>}
                  </div>
                </div>
              </div>

              {/* Stand */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="size-3.5" /> Stand
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      name="developmentId"
                      required
                      className={inputCls}
                      value={selectedDevelopmentId}
                      onChange={(e) => {
                        setSelectedDevelopmentId(e.target.value);
                        const first = stands.find((s) => s.development.id === e.target.value);
                        setSelectedStandId(first?.id ?? "");
                      }}
                    >
                      {developments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {err("developmentId") && <p className="mt-1 text-[11px] text-red-600">{err("developmentId")}</p>}
                  </div>
                  <div>
                    <select
                      name="standId"
                      required
                      className={inputCls}
                      value={selectedStandId}
                      onChange={(e) => setSelectedStandId(e.target.value)}
                    >
                      {standsForDevelopment.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.standNumber} · {money(parseFloat(s.price))}
                        </option>
                      ))}
                    </select>
                    {err("standId") && <p className="mt-1 text-[11px] text-red-600">{err("standId")}</p>}
                  </div>
                </div>
                {selectedStand && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {selectedStand.sizeSqm} sqm &middot; Price {money(parseFloat(selectedStand.price))}
                  </p>
                )}
              </div>

              {/* Deposit */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <DollarSign className="size-3.5" /> Deposit
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      name="depositAmount"
                      min="0.01"
                      step="0.01"
                      placeholder="Amount (USD)"
                      required
                      className={`${inputCls} font-semibold`}
                    />
                    {err("depositAmount") && <p className="mt-1 text-[11px] text-red-600">{err("depositAmount")}</p>}
                  </div>
                  <div>
                    <select name="depositMethod" required className={inputCls} defaultValue="BANK_TRANSFER">
                      {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        name="depositReference"
                        placeholder="Reference / transaction ID"
                        required
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                    {err("depositReference") && <p className="mt-1 text-[11px] text-red-600">{err("depositReference")}</p>}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      name="months"
                      min="1"
                      step="1"
                      placeholder={`Installment months (default ${selectedStand?.development.paymentDurationMonths ?? "—"})`}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      name="depositNotes"
                      rows={2}
                      placeholder="Notes (optional)"
                      className="w-full rounded-lg border border-border/70 bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Admin fee */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Hash className="size-3.5" /> Admin Fee <span className="normal-case text-muted-foreground/60">(optional, billed on top of the price — it can also be recorded later from Payments)</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    name="adminFee"
                    min="0"
                    step="0.01"
                    placeholder="Amount (USD)"
                    className={inputCls}
                  />
                  <input
                    name="adminFeeReference"
                    placeholder="Reference"
                    className={inputCls}
                  />
                </div>
              </div>

              {!state.ok && state.message && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900">
                  {state.message}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border bg-background text-sm font-semibold transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !selectedStand}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {pending ? "Creating…" : "Create Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

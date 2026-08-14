"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { createAgentPresaleAction, type AgentPresaleState } from "@/lib/actions";
import { money } from "@/lib/utils";

type StandOption = {
  id: string;
  standNumber: string;
  sizeSqm: number;
  price: string;
  status: string;
};

type DevelopmentOption = {
  id: string;
  name: string;
  stands: StandOption[];
};

const initialState: AgentPresaleState = { ok: false, message: "" };

function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const error = errors?.[name]?.[0];
  return error ? <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p> : null;
}

export function AgentPresaleModal({ developments }: { developments: DevelopmentOption[] }) {
  const [open, setOpen] = useState(false);
  const [developmentId, setDevelopmentId] = useState(developments[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(createAgentPresaleAction, initialState);

  const availableStands = useMemo(() => {
    const development = developments.find((item) => item.id === developmentId);
    return development?.stands.filter((stand) => stand.status === "AVAILABLE") ?? [];
  }, [developments, developmentId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <Plus className="size-4" />
        Add Presale
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
          <div className="w-full max-w-3xl rounded-xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Add Presale</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Capture buyer details and reserve an available stand.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="grid size-9 place-items-center rounded-lg border bg-background text-muted-foreground transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {state.ok ? (
              <div className="px-5 py-8 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-7" />
                </span>
                <p className="mt-4 font-semibold">Presale created</p>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {state.message}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Done
                </button>
              </div>
            ) : (
              <form action={formAction} className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="form-label">Client Name</span>
                    <input name="fullName" required className="mt-1" placeholder="Jane Doe" />
                    <FieldError name="fullName" errors={state.errors} />
                  </label>
                  <label className="block">
                    <span className="form-label">National ID</span>
                    <input name="nationalId" required className="mt-1" placeholder="63-123456-A-70" />
                    <FieldError name="nationalId" errors={state.errors} />
                  </label>
                  <label className="block">
                    <span className="form-label">Phone</span>
                    <input name="phone" required type="tel" className="mt-1" placeholder="e.g. +263 71 234 5678" />
                    <FieldError name="phone" errors={state.errors} />
                  </label>
                  <label className="block">
                    <span className="form-label">Email</span>
                    <input name="email" required type="email" className="mt-1" placeholder="client@example.com" />
                    <FieldError name="email" errors={state.errors} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="form-label">Physical Address</span>
                    <input name="address" required className="mt-1" placeholder="Client address" />
                    <FieldError name="address" errors={state.errors} />
                  </label>
                  <label className="block">
                    <span className="form-label">Development</span>
                    <select
                      name="developmentId"
                      required
                      value={developmentId}
                      onChange={(event) => setDevelopmentId(event.target.value)}
                      className="mt-1"
                    >
                      {developments.map((development) => (
                        <option key={development.id} value={development.id}>
                          {development.name}
                        </option>
                      ))}
                    </select>
                    <FieldError name="developmentId" errors={state.errors} />
                  </label>
                  <label className="block">
                    <span className="form-label">Available Stand</span>
                    <select name="standId" required className="mt-1" disabled={availableStands.length === 0}>
                      {availableStands.length === 0 ? (
                        <option value="">No available stands</option>
                      ) : (
                        availableStands.map((stand) => (
                          <option key={stand.id} value={stand.id}>
                            {stand.standNumber}: {stand.sizeSqm} m2 - {money(Number(stand.price))}
                          </option>
                        ))
                      )}
                    </select>
                    <FieldError name="standId" errors={state.errors} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="form-label">Notes</span>
                    <textarea
                      name="notes"
                      rows={3}
                      className="mt-1"
                      placeholder="Deposit plan, site visit notes, buyer preferences..."
                    />
                  </label>
                </div>

                {state.message ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {state.message}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || availableStands.length === 0}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Create Presale
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

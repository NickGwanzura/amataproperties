"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Plus, UserPlus, X } from "lucide-react";
import { createAgentLeadAction, type AgentLeadState } from "@/lib/actions";

type DevelopmentOption = {
  id: string;
  name: string;
};

const initialState: AgentLeadState = { ok: false, message: "" };

function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const error = errors?.[name]?.[0];
  return error ? <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p> : null;
}

export function AgentLeadModal({
  developments,
  buttonLabel = "Add Lead",
  title = "Add Lead",
  description = "Capture a prospect before they choose a stand.",
}: {
  developments: DevelopmentOption[];
  buttonLabel?: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAgentLeadAction, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm"
      >
        <UserPlus className="size-4" />
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
          <div className="w-full max-w-3xl rounded-xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
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
                <p className="mt-4 font-semibold">Lead added</p>
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
                  <label className="block sm:col-span-2">
                    <span className="form-label">Interested Development</span>
                    <select name="developmentId" className="mt-1" defaultValue="">
                      <option value="">Not selected yet</option>
                      {developments.map((development) => (
                        <option key={development.id} value={development.id}>
                          {development.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="form-label">Notes</span>
                    <textarea
                      name="notes"
                      rows={3}
                      className="mt-1"
                      placeholder="Budget, preferred area, follow-up date, site visit details..."
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
                    disabled={pending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Save Lead
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

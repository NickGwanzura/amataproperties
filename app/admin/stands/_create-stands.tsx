"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, List, Plus, Regex } from "lucide-react";
import { createStandsAction } from "@/lib/actions";
import { useToast } from "@/components/toast";

type DevOption = { id: string; name: string };

export function CreateStandsForm({ developments }: { developments: DevOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await createStandsAction(fd);
    setSaving(false);

    if (result.ok) {
      toast.success("Stands created", "Stands added successfully.");
      ref.current?.reset();
      router.refresh();
    } else {
      toast.error("Failed", result.error ?? "Could not create stands.");
    }
  }

  return (
    <div className="premium-panel">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Plus className="size-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Create Stands</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Bulk create stands for a development</p>
          </div>
        </div>
        {open ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
      </button>

      {open && (
        <form ref={ref} onSubmit={handleSubmit} className="border-t px-5 py-5 space-y-5">
          <input type="hidden" name="mode" value={mode} />

          <label className="form-label">
            Development *
            <select name="developmentId" required className="mt-1">
              <option value="">Select a development</option>
              {developments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${mode === "auto" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground"}`}
            >
              <Regex className="size-4" /> Auto-generate
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${mode === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-muted-foreground"}`}
            >
              <List className="size-4" /> Enter custom numbers
            </button>
          </div>

          {mode === "auto" ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="form-label">
                Prefix *
                <input name="prefix" className="mt-1" placeholder="e.g. BW" required />
              </label>
              <label className="form-label">
                Start Number
                <input name="startNum" type="number" min="1" className="mt-1" defaultValue="1" />
              </label>
              <label className="form-label">
                Count *
                <input name="count" type="number" min="1" className="mt-1" placeholder="10" required />
              </label>
            </div>
          ) : (
            <label className="form-label">
              Stand Numbers *
              <textarea
                name="customNumbers"
                className="mt-1 min-h-[120px]"
                placeholder={"BW-001\nBW-002\nBW-003\nBW-005"}
                required
              />
              <span className="text-xs text-muted-foreground">One stand number per line</span>
            </label>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="form-label">
              Size (sqm) *
              <input name="sizeSqm" type="number" className="mt-1" defaultValue="300" required />
            </label>
            <label className="form-label">
              Price (USD) *
              <input name="price" type="number" className="mt-1" placeholder="25000" required />
            </label>
            <label className="form-label">
              Phase
              <input name="phase" className="mt-1" placeholder="Phase 1" />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            {saving ? "Creating..." : `Create Stands`}
          </button>
        </form>
      )}
    </div>
  );
}

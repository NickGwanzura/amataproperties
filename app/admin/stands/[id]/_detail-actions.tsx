"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, Loader2, Repeat, Trash2, Unlock } from "lucide-react";
import {
  archiveStandAction,
  deleteStandAction,
  releaseStandAction,
  reserveStandAction,
  restoreStandAction,
  transferStandAction,
} from "@/lib/actions";
import { useToast } from "@/components/toast";

type ClientOption = { id: string; name: string; email: string };

export function StandDetailActions({
  standId,
  status,
  archivedAt,
  deletedAt,
  clients,
}: {
  standId: string;
  status: string;
  archivedAt: Date | null;
  deletedAt: Date | null;
  clients: ClientOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [showReserve, setShowReserve] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  async function handle(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    try {
      const result = await fn();
      if (result.ok) {
        toast.success(label);
        router.refresh();
      } else {
        toast.error("Couldn't complete this action", result.error);
      }
    } catch {
      toast.error("Something went wrong", "Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (deletedAt || archivedAt) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => handle("Stand restored", () => restoreStandAction(standId))}
        className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ArchiveRestore className="size-4" />} Restore
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "AVAILABLE" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowReserve(true)}
          className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          Reserve
        </button>
      )}
      {status === "RESERVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handle("Stand released", () => releaseStandAction(standId))}
          className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          <Unlock className="size-4" /> Release
        </button>
      )}
      {status === "SOLD" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowTransfer(true)}
          className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          <Repeat className="size-4" /> Transfer to new owner
        </button>
      )}
      {status !== "SOLD" && status !== "RESERVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handle("Stand archived", () => archiveStandAction(standId))}
          className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          <Archive className="size-4" /> Archive
        </button>
      )}
      {status !== "SOLD" && status !== "RESERVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this stand? This cannot be undone.")) handle("Stand deleted", () => deleteStandAction(standId));
          }}
          className="inline-flex h-10 items-center gap-2 rounded border bg-background px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="size-4" /> Delete
        </button>
      )}

      {showReserve && (
        <ReserveModal
          standId={standId}
          clients={clients}
          onClose={() => setShowReserve(false)}
          onDone={() => {
            setShowReserve(false);
            router.refresh();
          }}
        />
      )}
      {showTransfer && (
        <TransferModal
          standId={standId}
          onClose={() => setShowTransfer(false)}
          onDone={() => {
            setShowTransfer(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReserveModal({
  standId,
  clients,
  onClose,
  onDone,
}: {
  standId: string;
  clients: ClientOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [clientQuery, setClientQuery] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const match = clients.find((c) => `${c.name} <${c.email}>` === clientQuery || c.email === clientQuery);
    if (!match) {
      toast.error("Select a client", "Pick a client from the list.");
      return;
    }
    setSaving(true);
    const result = await reserveStandAction(standId, match.id, reason);
    setSaving(false);
    if (result.ok) {
      toast.success("Stand reserved");
      onDone();
    } else {
      toast.error("Couldn't reserve", result.error);
    }
  }

  return (
    <Modal title="Reserve stand for a client" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="form-label">
          Client *
          <input
            list="client-options"
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
            placeholder="Search by name or email"
            className="mt-1"
            required
          />
          <datalist id="client-options">
            {clients.map((c) => (
              <option key={c.id} value={`${c.name} <${c.email}>`} />
            ))}
          </datalist>
        </label>
        <label className="form-label">
          Reason
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 min-h-[70px]" placeholder="Optional note" />
        </label>
        <button type="submit" disabled={saving} className="h-10 w-full rounded bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {saving ? "Reserving…" : "Reserve Stand"}
        </button>
      </form>
    </Modal>
  );
}

function TransferModal({ standId, onClose, onDone }: { standId: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await transferStandAction(standId, fd);
    setSaving(false);
    if (result.ok) {
      toast.success("Stand transferred", `New sale ${result.saleNumber} created.`);
      onDone();
    } else {
      toast.error("Couldn't transfer", result.error);
    }
  }

  return (
    <Modal title="Transfer stand to a new owner" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        This cancels the current sale and creates a fresh sale for the new owner, at the stand&apos;s current price.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-label">
            New Owner Name *
            <input name="clientName" className="mt-1" required />
          </label>
          <label className="form-label">
            National ID *
            <input name="nationalId" className="mt-1" required />
          </label>
          <label className="form-label">
            Phone *
            <input name="phone" className="mt-1" required />
          </label>
          <label className="form-label">
            Email *
            <input name="email" type="email" className="mt-1" required />
          </label>
        </div>
        <label className="form-label">
          Address *
          <input name="address" className="mt-1" required />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="form-label">
            Deposit Amount *
            <input name="depositAmount" type="number" step="0.01" className="mt-1" required />
          </label>
          <label className="form-label">
            Deposit Method
            <select name="depositMethod" className="mt-1" defaultValue="BANK_TRANSFER">
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ECOCASH">EcoCash</option>
              <option value="VELOCITY">Velocity</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="form-label">
            Deposit Reference *
            <input name="depositReference" className="mt-1" required />
          </label>
        </div>
        <label className="form-label">
          Reason for transfer
          <textarea name="reason" className="mt-1 min-h-[60px]" placeholder="Optional" />
        </label>
        <button type="submit" disabled={saving} className="h-10 w-full rounded bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {saving ? "Transferring…" : "Confirm Transfer"}
        </button>
      </form>
    </Modal>
  );
}

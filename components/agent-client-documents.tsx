"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Pencil, X } from "lucide-react";
import { updateAgentClientInfoAction, type AgentClientUpdateState } from "@/lib/actions";
import { StatusBadge } from "@/components/ui";

type ClientDoc = {
  key: "nationalIdFrontUrl" | "nationalIdBackUrl" | "passportCopyUrl" | "proofOfResidenceUrl" | "passportPhotoUrl";
  label: string;
};

type ClientItem = {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  kycStatus: string;
  nationalIdFrontUrl: string | null;
  nationalIdBackUrl: string | null;
  passportCopyUrl: string | null;
  proofOfResidenceUrl: string | null;
  passportPhotoUrl: string | null;
};

const DOCS: ClientDoc[] = [
  { key: "nationalIdFrontUrl", label: "National ID Front" },
  { key: "nationalIdBackUrl", label: "National ID Back" },
  { key: "passportCopyUrl", label: "Passport Copy" },
  { key: "proofOfResidenceUrl", label: "Proof of Residence" },
  { key: "passportPhotoUrl", label: "Passport Photo" },
];

const initialState: AgentClientUpdateState = { ok: false, message: "" };

function FieldError({ name, errors }: { name: string; errors?: Record<string, string[]> }) {
  const error = errors?.[name]?.[0];
  return error ? <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p> : null;
}

function ClientEditor({ client, onClose }: { client: ClientItem; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(updateAgentClientInfoAction, initialState);
  const [urls, setUrls] = useState<Record<ClientDoc["key"], string>>({
    nationalIdFrontUrl: client.nationalIdFrontUrl ?? "",
    nationalIdBackUrl: client.nationalIdBackUrl ?? "",
    passportCopyUrl: client.passportCopyUrl ?? "",
    proofOfResidenceUrl: client.proofOfResidenceUrl ?? "",
    passportPhotoUrl: client.passportPhotoUrl ?? "",
  });
  const [uploading, setUploading] = useState<ClientDoc["key"] | null>(null);
  const [uploadError, setUploadError] = useState("");

  async function uploadDocument(key: ClientDoc["key"], file: File | undefined) {
    if (!file) return;
    setUploading(key);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", client.id);
      const response = await fetch("/api/upload/document", { method: "POST", body: formData });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
      setUrls((current) => ({ ...current, [key]: data.url! }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Client Info & Documents</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{client.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <p className="mt-4 font-semibold">Client updated</p>
            <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            <button type="button" onClick={onClose} className="mt-5 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Done
            </button>
          </div>
        ) : (
          <form action={formAction} className="p-5">
            <input type="hidden" name="clientId" value={client.id} />
            {DOCS.map((doc) => (
              <input key={doc.key} type="hidden" name={doc.key} value={urls[doc.key]} />
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="form-label">Client Name</span>
                <input name="name" required defaultValue={client.name} className="mt-1" />
                <FieldError name="name" errors={state.errors} />
              </label>
              <label className="block">
                <span className="form-label">National ID</span>
                <input name="nationalId" required defaultValue={client.nationalId} className="mt-1" />
                <FieldError name="nationalId" errors={state.errors} />
              </label>
              <label className="block">
                <span className="form-label">Phone</span>
                <input name="phone" required defaultValue={client.phone} className="mt-1" />
                <FieldError name="phone" errors={state.errors} />
              </label>
              <label className="block">
                <span className="form-label">Email</span>
                <input name="email" required type="email" defaultValue={client.email} className="mt-1" />
                <FieldError name="email" errors={state.errors} />
              </label>
              <label className="block sm:col-span-2">
                <span className="form-label">Physical Address</span>
                <input name="address" required defaultValue={client.address} className="mt-1" />
                <FieldError name="address" errors={state.errors} />
              </label>
              <label className="block sm:col-span-2">
                <span className="form-label">KYC Status</span>
                <select name="kycStatus" defaultValue={client.kycStatus} className="mt-1">
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-lg border">
              <div className="border-b px-4 py-3">
                <p className="font-semibold">Documents</p>
                <p className="mt-0.5 text-xs text-muted-foreground">PDF, JPEG, PNG, or WebP up to 20 MB.</p>
              </div>
              <div className="divide-y">
                {DOCS.map((doc) => (
                  <div key={doc.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{doc.label}</p>
                      {urls[doc.key] ? (
                        <a href={urls[doc.key]} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                          View uploaded document
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not uploaded</p>
                      )}
                    </div>
                    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-xs font-semibold transition hover:bg-muted">
                      {uploading === doc.key ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
                      {urls[doc.key] ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploading != null}
                        onChange={(event) => void uploadDocument(doc.key, event.target.files?.[0])}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {uploadError ? <p className="mt-3 text-sm font-medium text-red-600">{uploadError}</p> : null}
            {state.message ? <p className="mt-3 text-sm font-medium text-red-600">{state.message}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="h-10 rounded-lg border bg-background px-4 text-sm font-semibold transition hover:bg-muted">
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || uploading != null}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Save Client
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AgentClientDocuments({ clients }: { clients: ClientItem[] }) {
  const [selected, setSelected] = useState<ClientItem | null>(null);

  return (
    <section id="client-documents" className="premium-panel mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold">Client Info & Documents</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Edit buyer details and upload KYC documents.</p>
        </div>
        <span className="text-sm text-muted-foreground">{clients.length} clients</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">KYC</th>
              <th className="px-4 py-3">Documents</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.slice(0, 8).map((client) => {
              const uploaded = DOCS.filter((doc) => Boolean(client[doc.key])).length;
              return (
                <tr key={client.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{client.name}</p>
                    <p className="kpi-number text-xs text-muted-foreground">{client.nationalId}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{client.phone}</p>
                    <p className="text-xs">{client.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.kycStatus.replaceAll("_", " ")} />
                  </td>
                  <td className="kpi-number px-4 py-3 font-semibold">
                    {uploaded}/{DOCS.length}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(client)}
                      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-semibold transition hover:bg-muted"
                    >
                      <Pencil className="size-3.5" />
                      Edit / Upload
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {clients.length > 8 ? (
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">Showing 8 recent clients. Use KYC Onboarding for the full register.</p>
      ) : null}
      {selected ? <ClientEditor client={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

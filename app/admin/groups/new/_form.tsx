"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, ChevronLeft, ChevronRight, Layers, Send, Users } from "lucide-react";
import { bulkAllocateGroupStandsAction, createGroupAction, inviteGroupAdminAction, publishGroupAction } from "@/lib/actions";
import { ImageUpload } from "@/components/image-upload";
import { DocumentUpload } from "@/components/document-upload";
import { StepStands } from "./_step-stands";
import { StepMembers, type StagedMember } from "./_step-members";
import { StepPublish } from "./_step-publish";

const ORG_TYPES = ["Company", "Church", "Cooperative", "Diaspora Association", "Other"];

export type GroupWizardData = {
  name: string; description: string; orgType: string; registrationNumber: string;
  contactPersonName: string; contactPersonEmail: string; contactPersonPhone: string; address: string;
  logoUrl: string; agreementDocUrl: string;
  developmentId: string;
  defaultPaymentPlanMonths: string; defaultDepositAmount: string;
};

const DEFAULTS: GroupWizardData = {
  name: "", description: "", orgType: "Company", registrationNumber: "",
  contactPersonName: "", contactPersonEmail: "", contactPersonPhone: "", address: "",
  logoUrl: "", agreementDocUrl: "",
  developmentId: "",
  defaultPaymentPlanMonths: "24", defaultDepositAmount: "",
};

export function CreateGroupForm({ developments }: { developments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<GroupWizardData>(DEFAULTS);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [selectedStandIds, setSelectedStandIds] = useState<string[]>([]);
  const [members, setMembers] = useState<StagedMember[]>([]);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("BANK_TRANSFER");
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof GroupWizardData>(field: K, value: GroupWizardData[K]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const STEPS = [
    { label: "Create Group", icon: Building2 },
    { label: "Assign Stands", icon: Layers },
    { label: "Bulk Member Import", icon: Users },
    { label: "Invite Admin & Publish", icon: Send },
  ];

  const goToStep = (s: number) => {
    setError("");
    setStep(s);
  };

  const handleCreateGroup = () => {
    setError("");
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description);
      fd.append("orgType", data.orgType);
      fd.append("registrationNumber", data.registrationNumber);
      fd.append("contactPersonName", data.contactPersonName);
      fd.append("contactPersonEmail", data.contactPersonEmail);
      fd.append("contactPersonPhone", data.contactPersonPhone);
      fd.append("address", data.address);
      fd.append("logoUrl", data.logoUrl);
      fd.append("agreementDocUrl", data.agreementDocUrl);
      fd.append("developmentId", data.developmentId);
      fd.append("defaultPaymentPlanMonths", data.defaultPaymentPlanMonths);
      fd.append("defaultDepositAmount", data.defaultDepositAmount);
      fd.append("publish", "false");

      const result = await createGroupAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setGroupId(result.id);
      goToStep(1);
    });
  };

  const handlePublish = () => {
    if (!groupId) return;
    setError("");
    startTransition(async () => {
      const importedMembers = members.filter((m) => m.imported);
      let hadPartialFailure = false;

      if (selectedStandIds.length > 0 && importedMembers.length > 0 && depositAmount && parseFloat(depositAmount) > 0) {
        const pairCount = Math.min(selectedStandIds.length, importedMembers.length);
        const rows = Array.from({ length: pairCount }).map((_, i) => ({
          clientId: importedMembers[i].id,
          standId: selectedStandIds[i],
        }));
        const allocResult = await bulkAllocateGroupStandsAction(
          groupId,
          rows,
          parseFloat(depositAmount),
          depositMethod as "CASH" | "BANK_TRANSFER" | "ECOCASH" | "VELOCITY" | "OTHER",
        );
        if (!allocResult.ok) {
          setError(allocResult.error);
          return;
        }
        const failedAllocations = allocResult.results.filter((r) => !r.ok);
        if (failedAllocations.length > 0) {
          hadPartialFailure = true;
          setError(`${failedAllocations.length} of ${pairCount} stand allocations failed. Review the group's members before leaving this page.`);
        }
      }

      if (adminName.trim() && adminEmail.trim()) {
        const inviteResult = await inviteGroupAdminAction(groupId, adminName, adminEmail);
        if (!inviteResult.ok) {
          setError(inviteResult.error);
          return;
        }
      }

      if (publish) {
        const result = await publishGroupAction(groupId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }

      if (!hadPartialFailure) router.push("/admin/groups");
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => i < step && groupId && goToStep(i)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
            <span className="ml-2 hidden text-sm font-semibold sm:block">{s.label}</span>
            {i < STEPS.length - 1 && <div className="mx-3 flex-1 border-t border-border" />}
          </div>
        ))}
      </div>

      <div className="premium-panel mt-8 p-6">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Create Group</h2>
            <label className="form-label">
              Group / Organisation Name *
              <input className="mt-1" value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Zion Fellowship Church" required />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Organisation Type *
                <select className="mt-1" value={data.orgType} onChange={(e) => set("orgType", e.target.value)}>
                  {ORG_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="form-label">
                Registration Number
                <input className="mt-1" value={data.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} />
              </label>
            </div>
            <label className="form-label">
              Description
              <textarea className="mt-1 min-h-[80px]" value={data.description} onChange={(e) => set("description", e.target.value)} />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Contact Person Name *
                <input className="mt-1" value={data.contactPersonName} onChange={(e) => set("contactPersonName", e.target.value)} required />
              </label>
              <label className="form-label">
                Contact Person Email *
                <input type="email" className="mt-1" value={data.contactPersonEmail} onChange={(e) => set("contactPersonEmail", e.target.value)} required />
              </label>
              <label className="form-label">
                Contact Person Phone *
                <input className="mt-1" value={data.contactPersonPhone} onChange={(e) => set("contactPersonPhone", e.target.value)} required />
              </label>
              <label className="form-label">
                Address
                <input className="mt-1" value={data.address} onChange={(e) => set("address", e.target.value)} />
              </label>
            </div>
            <label className="form-label">
              Development *
              <select className="mt-1" value={data.developmentId} onChange={(e) => set("developmentId", e.target.value)} required>
                <option value="">Select the development this group is buying into</option>
                {developments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Default Payment Plan (months)
                <input type="number" className="mt-1" value={data.defaultPaymentPlanMonths} onChange={(e) => set("defaultPaymentPlanMonths", e.target.value)} />
              </label>
              <label className="form-label">
                Default Deposit Amount
                <input type="number" step="0.01" className="mt-1" value={data.defaultDepositAmount} onChange={(e) => set("defaultDepositAmount", e.target.value)} />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="form-label">
                Group Logo
                <div className="mt-1"><ImageUpload value={data.logoUrl} onChange={(url) => set("logoUrl", url)} aspectRatio="square" /></div>
              </div>
              <div className="form-label">
                Agreement Document
                <div className="mt-1"><DocumentUpload value={data.agreementDocUrl} onChange={(url) => set("agreementDocUrl", url)} label="Upload signed agreement" /></div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && groupId && (
          <StepStands developmentId={data.developmentId} selectedStandIds={selectedStandIds} onChange={setSelectedStandIds} />
        )}

        {step === 2 && groupId && (
          <StepMembers groupId={groupId} members={members} onMembersChange={setMembers} />
        )}

        {step === 3 && groupId && (
          <StepPublish
            data={data}
            standCount={selectedStandIds.length}
            memberCount={members.filter((m) => m.imported).length}
            adminName={adminName}
            adminEmail={adminEmail}
            onAdminNameChange={setAdminName}
            onAdminEmailChange={setAdminEmail}
            depositAmount={depositAmount}
            depositMethod={depositMethod}
            onDepositAmountChange={setDepositAmount}
            onDepositMethodChange={setDepositMethod}
            publish={publish}
            onPublishChange={setPublish}
            groupId={groupId}
            selectedStandIds={selectedStandIds}
            members={members}
          />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step > 0 ? goToStep(step - 1) : router.back())}
          className="inline-flex h-11 items-center gap-2 rounded border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
        >
          <ChevronLeft className="size-4" /> {step === 0 ? "Cancel" : "Back"}
        </button>

        {step === 0 && (
          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={isPending || !data.name || !data.contactPersonName || !data.contactPersonEmail || !data.contactPersonPhone || !data.developmentId}
            className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Continue"} <ChevronRight className="size-4" />
          </button>
        )}
        {(step === 1 || step === 2) && (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5"
          >
            Continue <ChevronRight className="size-4" />
          </button>
        )}
        {step === 3 && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isPending ? "Finishing…" : publish ? "Publish Group" : "Save as Draft"}
          </button>
        )}
      </div>
    </div>
  );
}

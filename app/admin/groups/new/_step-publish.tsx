"use client";

import { CheckCircle2 } from "lucide-react";
import type { GroupWizardData } from "./_form";
import type { StagedMember } from "./_step-members";

export function StepPublish({
  data,
  standCount,
  memberCount,
  adminName,
  adminEmail,
  onAdminNameChange,
  onAdminEmailChange,
  depositAmount,
  depositMethod,
  onDepositAmountChange,
  onDepositMethodChange,
  publish,
  onPublishChange,
}: {
  data: GroupWizardData;
  standCount: number;
  memberCount: number;
  adminName: string;
  adminEmail: string;
  onAdminNameChange: (v: string) => void;
  onAdminEmailChange: (v: string) => void;
  depositAmount: string;
  depositMethod: string;
  onDepositAmountChange: (v: string) => void;
  onDepositMethodChange: (v: string) => void;
  publish: boolean;
  onPublishChange: (v: boolean) => void;
  groupId: string;
  selectedStandIds: string[];
  members: StagedMember[];
}) {
  const pairCount = Math.min(standCount, memberCount);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Invite Admin & Publish</h2>

      <div className="rounded-lg border p-4 text-sm">
        <p className="font-semibold">{data.name}</p>
        <p className="mt-1 text-muted-foreground">{data.orgType} · {data.contactPersonName}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div><span className="text-muted-foreground">Stands selected: </span><span className="font-semibold">{standCount}</span></div>
          <div><span className="text-muted-foreground">Members imported: </span><span className="font-semibold">{memberCount}</span></div>
          <div><span className="text-muted-foreground">Will be allocated now: </span><span className="font-semibold">{pairCount}</span></div>
        </div>
      </div>

      {pairCount > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Deposit for member allocations</p>
          <p className="mb-3 text-xs text-muted-foreground">
            The first {pairCount} imported member(s) will each be allocated one of the selected stands at this deposit amount, in the order imported.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-label">
              Deposit Amount per Member *
              <input type="number" step="0.01" className="mt-1" value={depositAmount} onChange={(e) => onDepositAmountChange(e.target.value)} />
            </label>
            <label className="form-label">
              Deposit Method
              <select className="mt-1" value={depositMethod} onChange={(e) => onDepositMethodChange(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ECOCASH">EcoCash</option>
                <option value="VELOCITY">Velocity</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">Group Administrator (optional)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-label">
            Admin Name
            <input className="mt-1" value={adminName} onChange={(e) => onAdminNameChange(e.target.value)} />
          </label>
          <label className="form-label">
            Admin Email
            <input type="email" className="mt-1" value={adminEmail} onChange={(e) => onAdminEmailChange(e.target.value)} />
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Leave blank to assign a group administrator later.</p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 font-semibold">Visibility</p>
        <div className="flex gap-3">
          <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${!publish ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" name="publish" checked={!publish} onChange={() => onPublishChange(false)} />
            <div>
              <p className="font-semibold">Save as Draft</p>
              <p className="text-xs text-muted-foreground">Group stays hidden until published</p>
            </div>
          </label>
          <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${publish ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" name="publish" checked={publish} onChange={() => onPublishChange(true)} />
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <div>
                <p className="font-semibold">Publish Now</p>
                <p className="text-xs text-muted-foreground">Group becomes active immediately</p>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

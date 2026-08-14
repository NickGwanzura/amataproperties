"use client";

import { CheckCircle2, FileText, Layers, MapPin } from "lucide-react";
import type { WizardData } from "./_form";
import type { ImportRow } from "./_step-import";

function money(currency: string, value: string) {
  const n = parseFloat(value);
  if (!n || isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function StepReview({
  data,
  importRows,
  onPublishChange,
}: {
  data: WizardData;
  importRows: ImportRow[];
  onPublishChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review & Publish</h2>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <MapPin className="size-4 text-primary" /> Development Info
        </div>
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <div><dt className="inline text-muted-foreground">Name: </dt><dd className="inline font-medium">{data.name || "—"}</dd></div>
          <div><dt className="inline text-muted-foreground">Slug: </dt><dd className="inline font-medium">{data.slug || "—"}</dd></div>
          <div><dt className="inline text-muted-foreground">Location: </dt><dd className="inline font-medium">{data.location || "—"}, {data.province}</dd></div>
          <div><dt className="inline text-muted-foreground">Type: </dt><dd className="inline font-medium">{data.developmentType}</dd></div>
          <div><dt className="inline text-muted-foreground">Currency: </dt><dd className="inline font-medium">{data.currency}</dd></div>
          <div><dt className="inline text-muted-foreground">Amenities: </dt><dd className="inline font-medium">{data.amenities.length || 0} selected</dd></div>
        </dl>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <Layers className="size-4 text-primary" /> Pricing & Stand Configuration
        </div>
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <div><dt className="inline text-muted-foreground">Starting Price: </dt><dd className="inline font-medium">{money(data.currency, data.startingPrice)}</dd></div>
          <div><dt className="inline text-muted-foreground">Price/m²: </dt><dd className="inline font-medium">{money(data.currency, data.pricePerSqm)}</dd></div>
          <div><dt className="inline text-muted-foreground">Deposit: </dt><dd className="inline font-medium">{data.depositAmount || "—"}{data.depositType === "percentage" ? "%" : ` ${data.currency}`}</dd></div>
          <div><dt className="inline text-muted-foreground">Reservation Fee: </dt><dd className="inline font-medium">{money(data.currency, data.reservationFeeAmount)}</dd></div>
          <div><dt className="inline text-muted-foreground">Installment Terms: </dt><dd className="inline font-medium">{data.installmentMonths.join(", ") || "—"} months</dd></div>
          <div><dt className="inline text-muted-foreground">Commission: </dt><dd className="inline font-medium">{data.commissionValue || "—"}{data.commissionType === "percentage" ? "%" : ` ${data.currency}`}</dd></div>
        </dl>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <FileText className="size-4 text-primary" /> Bulk Stand Import
        </div>
        {importRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stands staged — you can add stands later from the Stands page.</p>
        ) : (
          <p className="text-sm">
            <CheckCircle2 className="mr-1 inline size-4 text-emerald-600" />
            {importRows.length} stand{importRows.length === 1 ? "" : "s"} ready to import on publish.
          </p>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 font-semibold">Visibility</p>
        <div className="flex gap-3">
          <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${!data.publish ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" name="publish" checked={!data.publish} onChange={() => onPublishChange(false)} />
            <div>
              <p className="font-semibold">Save as Draft</p>
              <p className="text-xs text-muted-foreground">Hidden from the public site until published</p>
            </div>
          </label>
          <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${data.publish ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" name="publish" checked={data.publish} onChange={() => onPublishChange(true)} />
            <div>
              <p className="font-semibold">Publish Now</p>
              <p className="text-xs text-muted-foreground">Visible on the public site immediately</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

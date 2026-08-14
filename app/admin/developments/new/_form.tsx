"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, ChevronLeft, Building2, DollarSign, Upload, ClipboardCheck } from "lucide-react";
import { createDevelopmentAction, bulkImportStandsAction, updateDevelopmentGeoJsonAction } from "@/lib/actions";
import { ImageUpload } from "@/components/image-upload";
import { SITE } from "@/lib/site-config";
import { StepPricing } from "./_step-pricing";
import { StepImport, type ImportRow } from "./_step-import";
import { StepReview } from "./_step-review";

const AMENITY_OPTIONS = [
  "Electricity", "Water & Reticulation", "Tarred Roads", "Security Gate",
  "Drainage System", "Street Lighting", "Borehole", "Communal Ablution",
  "Recreational Park", "School Site", "Commercial Zone",
];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const DEVELOPMENT_TYPES = ["Residential", "Commercial", "Mixed-Use", "Industrial", "Agricultural"];
const CURRENCIES = ["USD", "ZWG", "ZAR"];

export type WizardData = {
  name: string; slug: string; location: string; province: string; description: string;
  developerName: string; developerContact: string;
  developmentType: string; currency: string; latitude: string; longitude: string;
  startingPrice: string; pricePerSqm: string; depositAmount: string; depositType: "fixed" | "percentage";
  interestRate: string; paymentDurationMonths: string; paymentTerms: string; termsAndConditions: string;
  infrastructureStatus: string; heroImage: string; amenities: string[]; geoJsonText: string;
  installmentMonths: number[];
  penaltyRatePercent: string; penaltyGraceDays: string;
  reservationFeeAmount: string;
  commissionType: "flat" | "percentage"; commissionValue: string;
  discountEarlySettlementPct: string; discountBulkThreshold: string; discountBulkDiscountPct: string;
  standNumberPrefix: string; standNumberAutoIncrement: boolean;
  standSizeSqm: string; standPrice: string; standPhase: string;
  publish: boolean;
};

const DEFAULTS: WizardData = {
  name: "", slug: "", location: "", province: "Harare", description: "",
  developerName: "Amata Properties", developerContact: SITE.phone1,
  developmentType: "Residential", currency: "USD", latitude: "", longitude: "",
  startingPrice: "", pricePerSqm: "", depositAmount: "", depositType: "fixed",
  interestRate: "0", paymentDurationMonths: "24",
  paymentTerms: "Deposit required to secure stand. Monthly instalments thereafter.",
  termsAndConditions: "All sales are final. Title deed transfer on full payment.",
  infrastructureStatus: "Services in progress", heroImage: "", amenities: [], geoJsonText: "",
  installmentMonths: [24],
  penaltyRatePercent: "", penaltyGraceDays: "",
  reservationFeeAmount: "",
  commissionType: "flat", commissionValue: "500",
  discountEarlySettlementPct: "", discountBulkThreshold: "", discountBulkDiscountPct: "",
  standNumberPrefix: "", standNumberAutoIncrement: true,
  standSizeSqm: "300", standPrice: "", standPhase: "Phase 1",
  publish: true,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CreateDevelopmentForm({ redirectTo = "/admin/developments" }: { redirectTo?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(DEFAULTS);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importAtomic, setImportAtomic] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const goToStep = (s: number) => {
    setError("");
    setStep(s);
  };

  const set = <K extends keyof WizardData>(field: K, value: WizardData[K]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const toggleAmenity = (a: string) => {
    const next = data.amenities.includes(a)
      ? data.amenities.filter((x) => x !== a)
      : [...data.amenities, a];
    set("amenities", next);
  };

  const handleSubmit = () => {
    setError("");
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("slug", data.slug);
      fd.append("location", data.location);
      fd.append("province", data.province);
      fd.append("description", data.description);
      fd.append("developerName", data.developerName);
      fd.append("developerContact", data.developerContact);
      fd.append("developmentType", data.developmentType);
      fd.append("currency", data.currency);
      fd.append("latitude", data.latitude);
      fd.append("longitude", data.longitude);
      fd.append("startingPrice", data.startingPrice);
      fd.append("pricePerSqm", data.pricePerSqm);
      fd.append("depositAmount", data.depositAmount);
      fd.append("depositType", data.depositType);
      fd.append("interestRate", data.interestRate);
      fd.append("paymentDurationMonths", data.paymentDurationMonths);
      fd.append("paymentTerms", data.paymentTerms);
      fd.append("termsAndConditions", data.termsAndConditions);
      fd.append("infrastructureStatus", data.infrastructureStatus);
      fd.append("heroImage", data.heroImage);
      fd.append("amenities", data.amenities.join(","));
      fd.append("installmentOptions", JSON.stringify(data.installmentMonths.map((m) => ({ months: m, label: `${m} months` }))));
      if (data.penaltyRatePercent || data.penaltyGraceDays) {
        fd.append("penaltyRules", JSON.stringify({ ratePercent: parseFloat(data.penaltyRatePercent) || 0, graceDays: parseInt(data.penaltyGraceDays, 10) || 0 }));
      }
      fd.append("reservationFeeAmount", data.reservationFeeAmount);
      fd.append("commissionRules", JSON.stringify({ type: data.commissionType, value: parseFloat(data.commissionValue) || 0 }));
      if (data.discountEarlySettlementPct || data.discountBulkThreshold || data.discountBulkDiscountPct) {
        fd.append("discountRules", JSON.stringify({
          earlySettlementPct: parseFloat(data.discountEarlySettlementPct) || undefined,
          bulkThreshold: parseInt(data.discountBulkThreshold, 10) || undefined,
          bulkDiscountPct: parseFloat(data.discountBulkDiscountPct) || undefined,
        }));
      }
      fd.append("standNumberPrefix", data.standNumberPrefix);
      fd.append("standNumberAutoIncrement", String(data.standNumberAutoIncrement));
      fd.append("publish", String(data.publish));

      const result = await createDevelopmentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Boundary GeoJSON, if provided, is applied via the same validated action the edit page uses.
      if (data.geoJsonText.trim()) {
        await updateDevelopmentGeoJsonAction(result.id, data.geoJsonText.trim());
      }

      // Bulk stand import (manual/CSV rows staged in Step 3), if any.
      if (importRows.length > 0) {
        const importFd = new FormData();
        importFd.append("rows", JSON.stringify(importRows));
        if (importAtomic) importFd.append("atomic", "on");
        await bulkImportStandsAction(result.id, importFd);
      }

      router.push(redirectTo);
    });
  };

  const STEPS = [
    { label: "Development Info", icon: Building2 },
    { label: "Pricing & Stand Config", icon: DollarSign },
    { label: "Bulk Stand Import", icon: Upload },
    { label: "Review & Publish", icon: ClipboardCheck },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => i < step && goToStep(i)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200"
                  : "bg-muted text-muted-foreground"
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

        {/* Step 0 — Development Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Development Information</h2>
            <label className="form-label">
              Development Name *
              <input
                className="mt-1"
                value={data.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!data.slug || data.slug === slugify(data.name))
                    set("slug", slugify(e.target.value));
                }}
                placeholder="e.g. Northgate Estate"
                required
              />
            </label>
            <label className="form-label">
              URL Slug *
              <input
                className="mt-1"
                value={data.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="northgate-estate"
                required
              />
              <span className="text-xs text-muted-foreground">Used in property listing URLs</span>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Province *
                <select className="mt-1" value={data.province} onChange={(e) => set("province", e.target.value)}>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="form-label">
                Area / Location *
                <input className="mt-1" value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Harare North" required />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Development Type
                <select className="mt-1" value={data.developmentType} onChange={(e) => set("developmentType", e.target.value)}>
                  {DEVELOPMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="form-label">
                Currency
                <select className="mt-1" value={data.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                GPS Latitude
                <input type="number" step="any" className="mt-1" value={data.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="-17.824858" />
              </label>
              <label className="form-label">
                GPS Longitude
                <input type="number" step="any" className="mt-1" value={data.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="31.053028" />
              </label>
            </div>
            <label className="form-label">
              Description *
              <textarea
                className="mt-1 min-h-[100px]"
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the development, its key features, and selling points..."
                required
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Developer Name *
                <input className="mt-1" value={data.developerName} onChange={(e) => set("developerName", e.target.value)} required />
              </label>
              <label className="form-label">
                Developer Contact *
                <input className="mt-1" value={data.developerContact} onChange={(e) => set("developerContact", e.target.value)} placeholder={SITE.phone1} required />
              </label>
            </div>
            <label className="form-label">
              Infrastructure Status
              <select className="mt-1" value={data.infrastructureStatus} onChange={(e) => set("infrastructureStatus", e.target.value)}>
                <option>Services in progress</option>
                <option>Fully serviced</option>
                <option>Planning phase</option>
                <option>Phase 1 complete</option>
                <option>Phase 2 complete</option>
              </select>
            </label>
            <div>
              <p className="mb-3 text-sm font-semibold">Amenities</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITY_OPTIONS.map((a) => (
                  <label key={a} className="flex cursor-pointer items-center gap-2 rounded border p-2.5 hover:bg-muted has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                    <input type="checkbox" checked={data.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="size-4" />
                    <span className="text-sm">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-label">
              Hero Image
              <div className="mt-1">
                <ImageUpload value={data.heroImage} onChange={(url) => set("heroImage", url)} />
              </div>
            </div>
            <label className="form-label">
              GeoJSON Boundary (optional)
              <textarea
                className="mt-1 min-h-[80px] font-mono text-xs"
                value={data.geoJsonText}
                onChange={(e) => set("geoJsonText", e.target.value)}
                placeholder='{"type":"FeatureCollection","features":[...]}'
              />
              <span className="text-xs text-muted-foreground">Paste a GeoJSON FeatureCollection to render the interactive stand map. Can be added later.</span>
            </label>
          </div>
        )}

        {/* Step 1 — Pricing & Stand Config */}
        {step === 1 && <StepPricing data={data} set={set} />}

        {/* Step 2 — Bulk Stand Import */}
        {step === 2 && (
          <StepImport
            defaultPrefix={data.standNumberPrefix}
            defaultSizeSqm={data.standSizeSqm}
            defaultPrice={data.standPrice || data.startingPrice}
            defaultPhase={data.standPhase}
            rows={importRows}
            onRowsChange={setImportRows}
            atomic={importAtomic}
            onAtomicChange={setImportAtomic}
          />
        )}

        {/* Step 3 — Review & Publish */}
        {step === 3 && <StepReview data={data} importRows={importRows} onPublishChange={(v) => set("publish", v)} />}
      </div>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step > 0 ? goToStep(step - 1) : router.back()}
          className="inline-flex h-11 items-center gap-2 rounded border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
        >
          <ChevronLeft className="size-4" /> {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5"
          >
            Continue <ChevronRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex h-11 items-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isPending ? "Creating…" : data.publish ? "Publish Development" : "Save as Draft"}
          </button>
        )}
      </div>
    </div>
  );
}

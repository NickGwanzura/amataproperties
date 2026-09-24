import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type DevelopmentFilters = {
  q?: string;
  location?: string;
  price?: string;
  size?: string;
  terms?: string;
};

/** Range buckets are encoded as "min-max"; an empty max means open-ended. */
export const PRICE_BUCKETS = [
  { value: "0-25000", label: "Under USD 25k" },
  { value: "25000-50000", label: "USD 25k – 50k" },
  { value: "50000-", label: "USD 50k+" },
];

export const SIZE_BUCKETS = [
  { value: "0-600", label: "Up to 600 m²" },
  { value: "600-900", label: "600 – 900 m²" },
  { value: "900-", label: "900 m²+" },
];

export function parseRange(value?: string): { min: number; max: number } | null {
  const match = value?.match(/^(\d+)-(\d*)$/);
  if (!match) return null;
  return { min: Number(match[1]), max: match[2] ? Number(match[2]) : Infinity };
}

export function SearchFilters({
  values,
  locations,
  terms,
}: {
  values: DevelopmentFilters;
  locations: string[];
  terms: number[];
}) {
  const active = Object.values(values).some(Boolean);

  // Plain GET form: filtering happens on the server, so it works without JavaScript.
  return (
    <form action="/developments" method="get" role="search" className="premium-panel grid gap-3 p-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
      <label className="flex items-center gap-2 rounded-lg border bg-background px-3 md:col-span-2 lg:col-span-1">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">Search</span>
        <input
          name="q"
          defaultValue={values.q}
          placeholder="Search location or development"
          className="min-h-11 w-full border-0 bg-transparent px-0 shadow-none outline-none focus:shadow-none"
        />
      </label>
      <select name="location" defaultValue={values.location ?? ""} aria-label="Location">
        <option value="">All locations</option>
        {locations.map((location) => <option key={location} value={location}>{location}</option>)}
      </select>
      <select name="price" defaultValue={values.price ?? ""} aria-label="Starting price">
        <option value="">Any price</option>
        {PRICE_BUCKETS.map((bucket) => <option key={bucket.value} value={bucket.value}>{bucket.label}</option>)}
      </select>
      <select name="size" defaultValue={values.size ?? ""} aria-label="Stand size">
        <option value="">Any size</option>
        {SIZE_BUCKETS.map((bucket) => <option key={bucket.value} value={bucket.value}>{bucket.label}</option>)}
      </select>
      <select name="terms" defaultValue={values.terms ?? ""} aria-label="Payment terms">
        <option value="">Any terms</option>
        {terms.map((months) => <option key={months} value={String(months)}>{months} months</option>)}
      </select>
      <div className="flex gap-2 md:col-span-2 lg:col-span-1">
        <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95">
          <SlidersHorizontal className="size-4" /> Filter
        </button>
        {active ? (
          <Link href="/developments" aria-label="Clear filters" className="inline-flex h-11 items-center justify-center rounded-lg border bg-background px-3 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </Link>
        ) : null}
      </div>
    </form>
  );
}

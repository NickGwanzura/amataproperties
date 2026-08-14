"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export function SearchFilters() {
  return (
    <form className="premium-panel grid gap-3 p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
      <label className="flex items-center gap-2 rounded border bg-background px-3">
        <Search className="size-4 text-muted-foreground" />
        <input name="q" placeholder="Search location or development" className="min-h-11 w-full border-0 bg-transparent px-0 shadow-none outline-none focus:shadow-none" />
      </label>
      <select name="location">
        <option>All locations</option>
        <option>Harare</option>
        <option>Mazowe</option>
        <option>Victoria Falls</option>
      </select>
      <select name="price">
        <option>Any price</option>
        <option>Under USD 25k</option>
        <option>USD 25k - 50k</option>
        <option>USD 50k+</option>
      </select>
      <select name="size">
        <option>Any size</option>
        <option>450 - 600 sqm</option>
        <option>600 - 900 sqm</option>
        <option>900+ sqm</option>
      </select>
      <select name="terms">
        <option>Any terms</option>
        <option>18 months</option>
        <option>24 months</option>
        <option>30 months</option>
      </select>
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95">
        <SlidersHorizontal className="size-4" /> Filter
      </button>
    </form>
  );
}

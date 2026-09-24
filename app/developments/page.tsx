export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Developments",
  description:
    "Explore property opportunities across Zimbabwe with clear information, local expertise, and support from Amata.",
  alternates: { canonical: "/developments" },
  openGraph: {
    url: "/developments",
    title: "Developments | Amata",
    description:
      "Explore property opportunities across Zimbabwe with clear information, local expertise, and support from Amata.",
  },
};
import { DevelopmentCard } from "@/components/development-card";
import { parseRange, SearchFilters, type DevelopmentFilters } from "@/components/search-filters";
import { SectionTitle } from "@/components/ui";
import { getAllDevelopments } from "@/lib/db/queries/developments";

type Development = Awaited<ReturnType<typeof getAllDevelopments>>[number];

function first(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

function matchesFilters(development: Development, filters: DevelopmentFilters) {
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    const haystack = `${development.name} ${development.location} ${development.developerName}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (filters.location && development.location !== filters.location) return false;

  const price = parseRange(filters.price);
  if (price) {
    const startingPrice = Number(development.startingPrice);
    if (startingPrice < price.min || startingPrice >= price.max) return false;
  }

  const size = parseRange(filters.size);
  if (size) {
    // A development matches when at least one stand buyers can act on is in range.
    const hasStand = development.stands.some(
      (stand) => stand.status === "AVAILABLE" && stand.sizeSqm >= size.min && stand.sizeSqm < size.max,
    );
    if (!hasStand) return false;
  }

  if (filters.terms && String(development.paymentDurationMonths) !== filters.terms) return false;
  return true;
}

export default async function DevelopmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: DevelopmentFilters = {
    q: first(params.q),
    location: first(params.location),
    price: first(params.price),
    size: first(params.size),
    terms: first(params.terms),
  };

  let developments = [] as Development[];
  try {
    developments = await getAllDevelopments();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load developments; rendering the empty state.", error);
    }
  }

  const locations = [...new Set(developments.map((d) => d.location))].sort();
  const terms = [...new Set(developments.map((d) => d.paymentDurationMonths))].sort((a, b) => a - b);
  const results = developments.filter((d) => matchesFilters(d, filters));
  const availableStands = results.reduce((s, d) => s + d.stands.filter((st) => st.status === "AVAILABLE").length, 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionTitle as="h1" eyebrow="Property opportunities" title="Find the right place for what comes next">
          Browse available opportunities with clear information, local context, and a team ready to help.
        </SectionTitle>
      </div>

      {developments.length > 0 && (
        <div className="mb-8">
          <SearchFilters values={filters} locations={locations} terms={terms} />
        </div>
      )}

      {developments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <Building2 className="mb-4 size-10 text-muted-foreground/40" />
          <p className="text-lg font-semibold">No developments listed yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon. New developments will appear here.</p>
          <Link href="/contact" className="mt-6 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Ask us about upcoming releases
          </Link>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <SearchX className="mb-4 size-10 text-muted-foreground/40" />
          <p className="text-lg font-semibold">No developments match those filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try widening your search, or tell us what you need and we&apos;ll look for you.</p>
          <div className="mt-6 flex gap-4 text-sm font-semibold">
            <Link href="/developments" className="text-primary underline-offset-4 hover:underline">Clear filters</Link>
            <Link href="/contact" className="text-foreground underline-offset-4 hover:underline">Contact Amata</Link>
          </div>
        </div>
      ) : results.length === 1 ? (
        <DevelopmentCard development={results[0]} horizontal />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((development) => (
            <DevelopmentCard key={development.id} development={development} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <p className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          {results.length} development{results.length !== 1 ? "s" : ""} · {availableStands} stand{availableStands !== 1 ? "s" : ""} available
        </p>
      )}
    </main>
  );
}

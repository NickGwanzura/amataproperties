export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Building2, MapPin } from "lucide-react";

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
import { SearchFilters } from "@/components/search-filters";
import { SectionTitle } from "@/components/ui";
import { getAllDevelopments } from "@/lib/db/queries/developments";

export default async function DevelopmentsPage() {
  let developments = [] as Awaited<ReturnType<typeof getAllDevelopments>>;
  try {
    developments = await getAllDevelopments();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load developments; rendering the empty state.", error);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionTitle eyebrow="Property opportunities" title="Find the right place for what comes next">
          Browse available opportunities with clear information, local context, and a team ready to help.
        </SectionTitle>
      </div>

      <div className="mb-8">
        <SearchFilters />
      </div>

      {developments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <Building2 className="mb-4 size-10 text-muted-foreground/40" />
          <p className="text-lg font-semibold text-muted-foreground">No developments listed yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Check back soon. New developments will appear here.</p>
        </div>
      ) : developments.length === 1 ? (
        <DevelopmentCard development={developments[0]} horizontal />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {developments.map((development) => (
            <DevelopmentCard key={development.id} development={development} />
          ))}
        </div>
      )}

      {developments.length > 0 && (
        <p className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          {developments.length} development{developments.length !== 1 ? "s" : ""} · {developments.reduce((s, d) => s + d.stands.filter((st) => st.status === "AVAILABLE").length, 0)} stands available
        </p>
      )}
    </main>
  );
}

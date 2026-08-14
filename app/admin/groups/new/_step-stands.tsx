"use client";

import { useEffect, useState } from "react";
import { listAvailableStandsForWizardAction } from "@/lib/actions";
import { money } from "@/lib/utils";

type AvailableStand = { id: string; standNumber: string; sizeSqm: number; price: string; phase: string };

export function StepStands({
  developmentId,
  selectedStandIds,
  onChange,
}: {
  developmentId: string;
  selectedStandIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [stands, setStands] = useState<AvailableStand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAvailableStandsForWizardAction(developmentId).then((rows) => {
      if (!cancelled) {
        setStands(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [developmentId]);

  const toggle = (id: string) => {
    onChange(selectedStandIds.includes(id) ? selectedStandIds.filter((x) => x !== id) : [...selectedStandIds, id]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Assign Stands</h2>
      <p className="text-sm text-muted-foreground">
        Select the pool of available stands this group will buy. Nothing is reserved yet — allocation to specific members happens in the final step.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading available stands…</p>
      ) : stands.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No available stands in this development. You can skip this step and assign stands later.
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold">{selectedStandIds.length} of {stands.length} selected</p>
          <div className="max-h-96 overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>
                  <th className="p-2"></th>
                  <th className="p-2">Stand #</th>
                  <th className="p-2">Size (m²)</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Phase</th>
                </tr>
              </thead>
              <tbody>
                {stands.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-muted/30">
                    <td className="p-2">
                      <input type="checkbox" checked={selectedStandIds.includes(s.id)} onChange={() => toggle(s.id)} className="size-4" />
                    </td>
                    <td className="p-2 font-semibold kpi-number">{s.standNumber}</td>
                    <td className="p-2">{s.sizeSqm}</td>
                    <td className="p-2 kpi-number">{money(parseFloat(s.price))}</td>
                    <td className="p-2 text-muted-foreground">{s.phase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

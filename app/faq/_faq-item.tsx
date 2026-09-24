"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonId = `${id}-question`;
  const panelId = `${id}-answer`;

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-foreground transition hover:text-primary"
        >
          {q}
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform group-hover:text-primary", open && "rotate-180")} />
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
        <p className="pb-5 pr-8 text-[14px] leading-relaxed text-muted-foreground">{a}</p>
      </div>
    </div>
  );
}

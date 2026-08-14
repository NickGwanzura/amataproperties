"use client";

import { Download } from "lucide-react";

export function StatementButton({ saleId }: { saleId: string }) {
  return (
    <a
      href={`/api/client/statement/${saleId}`}
      target="_blank"
      className="premium-panel flex w-full items-center justify-between p-4 text-left transition hover:bg-muted"
    >
      <div>
        <p className="font-semibold">Download Latest Statement</p>
        <p className="text-sm text-muted-foreground">Full payment history PDF</p>
      </div>
      <Download className="size-5 shrink-0 text-primary" />
    </a>
  );
}

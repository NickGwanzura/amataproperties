import { Building2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-xl bg-primary/10">
          <Building2 className="size-7 animate-pulse text-primary" />
        </span>
        <p className="text-sm font-semibold text-muted-foreground">Loading Amata…</p>
        <div className="flex gap-1">
          <span className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
          <span className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
          <span className="size-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

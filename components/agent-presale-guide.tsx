import Link from "next/link";
import { BookOpenCheck, CalendarCheck, Forward, Handshake, Landmark, Phone } from "lucide-react";

const PRESALE_GUIDE = [
  {
    title: "Qualify",
    detail: "Confirm budget, development, stand size, and timing.",
    icon: Phone,
  },
  {
    title: "Advance",
    detail: "Move the lead through each pipeline stage after contact.",
    icon: Forward,
  },
  {
    title: "Initiate",
    detail: "Create a presale once the buyer chooses a stand.",
    icon: Handshake,
  },
  {
    title: "Deposit",
    detail: "Move the presale to Await Deposit when payment is expected.",
    icon: Landmark,
  },
] as const;

export function AgentPresaleGuide() {
  return (
    <section className="premium-panel mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Presale Guide</h2>
        </div>
        <Link
          href="/agent/presales"
          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
        >
          <CalendarCheck className="size-3.5" />
          Allocation Queue
        </Link>
      </div>
      <div className="grid md:grid-cols-4">
        {PRESALE_GUIDE.map((step, index) => (
          <div
            key={step.title}
            className="border-b px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="kpi-number grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <step.icon className="size-4 text-primary" />
            </div>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

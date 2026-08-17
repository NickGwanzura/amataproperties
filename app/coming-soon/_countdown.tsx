"use client";

import { useEffect, useState } from "react";

const LAUNCH_AT = new Date("2026-09-01T00:00:00+02:00").getTime();

function getRemaining() {
  const distance = Math.max(0, LAUNCH_AT - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
    complete: distance === 0,
  };
}

export function LaunchCountdown() {
  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (remaining.complete) {
    return <p className="text-2xl font-semibold tracking-[-0.04em] text-[#F0444C]">We&apos;re live.</p>;
  }

  const units = [
    [remaining.days, "Days"],
    [remaining.hours, "Hours"],
    [remaining.minutes, "Minutes"],
    [remaining.seconds, "Seconds"],
  ] as const;

  return (
    <div className="grid max-w-xl grid-cols-4 gap-2 sm:gap-3" aria-label="Countdown to launch">
      {units.map(([value, label]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-4 text-center backdrop-blur-sm sm:px-4 sm:py-5">
          <p className="text-3xl font-semibold tabular-nums tracking-[-0.06em] sm:text-5xl">{String(value).padStart(2, "0")}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35 sm:text-[10px]">{label}</p>
        </div>
      ))}
    </div>
  );
}

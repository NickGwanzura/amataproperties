import Image from "next/image";
import { ArrowRight, BadgePercent, Flame, MapPin, Ruler, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { money } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PROPERTY_HERO_IMAGE } from "@/lib/brand-assets";

type CardStand = { status: string; sizeSqm: number };
type CardDevelopment = {
  id: string;
  slug: string;
  name: string;
  location: string;
  developerName: string;
  startingPrice: number | string;
  pricePerSqm: number | string;
  depositAmount: number | string;
  interestRate: number | string;
  paymentDurationMonths: number;
  heroImage: string;
  stands: CardStand[];
  promo?: boolean | null;
};

type Badge = { label: string; variant: string };

function getBadges(development: CardDevelopment): Badge[] {
  const total = development.stands.length;
  const available = development.stands.filter((s) => s.status === "AVAILABLE").length;
  const sold = development.stands.filter((s) => s.status === "SOLD").length;
  const reserved = development.stands.filter((s) => s.status === "RESERVED").length;
  const presale = development.stands.filter((s) => s.status === "PRESALE").length;
  const committed = sold + reserved + presale;
  const badges: Badge[] = [];

  if (available === 0) {
    badges.push({ label: "Sold Out", variant: "danger" });
  } else if (total > 0 && committed / total >= 0.5) {
    badges.push({ label: "On Sale", variant: "success" });
  } else if (total > 0 && committed / total >= 0.25) {
    badges.push({ label: "On Sale", variant: "warning" });
  }

  if (development.promo) badges.push({ label: "Promo", variant: "promo" });
  if (badges.length === 0) badges.push({ label: "Available", variant: "info" });

  return badges;
}

const badgeStyles: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  "Sold Out": { icon: Flame, bg: "bg-red-500/90", text: "text-white" },
  "On Sale": { icon: Sparkles, bg: "bg-emerald-500/90", text: "text-white" },
  Promo: { icon: BadgePercent, bg: "bg-amber-500/90", text: "text-white" },
  Available: { icon: () => null, bg: "bg-white/95", text: "text-emerald-800" },
};

export function DevelopmentCard({
  development,
  horizontal = false,
}: {
  development: CardDevelopment;
  horizontal?: boolean;
}) {
  const badges = getBadges(development);
  const available = development.stands.filter((s) => s.status === "AVAILABLE").length;
  const total = development.stands.length;
  const sold = development.stands.filter((s) => s.status === "SOLD").length;
  const reserved = development.stands.filter((s) => s.status === "RESERVED").length;
  const presale = development.stands.filter((s) => s.status === "PRESALE").length;
  const availabilityPct = Math.round((available / total) * 100);
  const sizes = development.stands.map((s) => s.sizeSqm);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  const heroImage = development.heroImage?.startsWith("/") ? development.heroImage : PROPERTY_HERO_IMAGE;

  return (
    <article
      className={cn(
        "scroll-reveal group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md shadow-black/[0.06] transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
        horizontal
          ? "flex flex-col lg:flex-row hover:-translate-y-1"
          : "flex flex-col hover:-translate-y-1.5",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden",
          horizontal
            ? "aspect-[16/10] lg:aspect-auto lg:w-[44%] lg:shrink-0"
            : "aspect-[16/10]",
        )}
      >
        <Image
          src={heroImage}
          alt={development.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={horizontal ? "(min-width: 1024px) 44vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          priority={horizontal}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {badges.map((badge: Badge) => {
            const style = badgeStyles[badge.label] ?? badgeStyles["Available"];
            const Icon = style.icon;
            return (
              <span
                key={badge.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm",
                  style.bg,
                  style.text,
                )}
              >
                {Icon && <Icon className="size-3" />}
                {badge.label}
              </span>
            );
          })}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-white">{development.developerName}</p>
            <p className={cn("font-semibold leading-tight text-white drop-shadow-sm", horizontal ? "text-xl lg:text-2xl" : "text-lg")}>{development.name}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Ruler className="size-3" />
            {minSize}–{maxSize} m²
          </span>
        </div>
      </div>

      {/* Body */}
      <div className={cn("flex flex-1 flex-col gap-4", horizontal ? "p-6 lg:p-8" : "p-5")}>
        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-primary" />
          <span>{development.location}</span>
        </div>

        {/* Price block */}
        <div className="rounded-lg border border-border/50 bg-muted/40 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Starting Price</p>
          <p className={cn("font-semibold tracking-tight text-foreground", horizontal ? "text-3xl" : "text-2xl")}>
            {money(development.startingPrice)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{money(development.pricePerSqm)} / m² · Deposit {money(development.depositAmount)}</p>
        </div>

        {/* Stats row */}
        <div className={cn("grid gap-2 text-sm", horizontal ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2")}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="size-3.5 shrink-0 text-primary" />
            <span>{development.paymentDurationMonths} mo terms</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="size-3.5 shrink-0 text-primary" />
            <span>{development.interestRate}% p.a.</span>
          </div>
          {horizontal && (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Ruler className="size-3.5 shrink-0 text-primary" />
                <span>{minSize}–{maxSize} m² stands</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="size-3.5 shrink-0" />
                <span>{available} stands left</span>
              </div>
            </>
          )}
        </div>

        {/* Availability bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              <span className="text-primary">{available}</span> of {total} stands available
            </span>
            <span className="font-medium text-muted-foreground">{availabilityPct}% open</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                availabilityPct > 50
                  ? "bg-gradient-to-r from-primary to-primary/70"
                  : availabilityPct > 25
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-red-500 to-orange-400",
              )}
              style={{ width: `${availabilityPct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px]">
            <span className="text-muted-foreground">{sold} sold · {reserved} reserved · {presale} on presale</span>
          </p>
        </div>

        {/* CTA buttons */}
        <div className={cn("mt-auto flex gap-2", horizontal ? "flex-col sm:flex-row lg:flex-row" : "flex-col sm:flex-row")}>
          <Link
            href={`/developments/${development.slug}`}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:-translate-y-px hover:shadow-md hover:shadow-primary/25",
              horizontal ? "h-11 px-6 text-sm" : "h-10 px-4 text-sm",
            )}
          >
            View Development
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href={`/developments/${development.slug}#reserve`}
            className={cn(
              "inline-flex flex-1 items-center justify-center rounded-lg border border-border/70 bg-background font-semibold text-foreground transition hover:border-primary/40 hover:bg-muted",
              horizontal ? "h-11 px-6 text-sm" : "h-10 px-4 text-sm",
            )}
          >
            Reserve Stand
          </Link>
        </div>
      </div>
    </article>
  );
}

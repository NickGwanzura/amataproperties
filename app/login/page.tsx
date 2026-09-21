import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { LoginForm } from "./_form";

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100dvh-57px)] lg:grid-cols-2">
      {/* ── Left: full-bleed image, no text ── */}
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?q=80&w=2400&auto=format&fit=crop"
          alt="Amata Properties development"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        {/* Subtle brand watermark at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Building2 className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-white">Amata</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-white">Zimbabwe</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex items-start justify-center bg-background px-6 pt-10 pb-12 sm:items-center sm:px-10 sm:py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo (hidden on desktop since left panel shows it) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">Amata</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Zimbabwe</span>
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Sign in to your workspace</p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New client?{" "}
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              Set or reset your password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

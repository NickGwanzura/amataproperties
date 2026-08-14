"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { resetPasswordAction } from "@/lib/actions";
import { Suspense } from "react";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [state, action, pending] = useActionState(resetPasswordAction, null);

  // On success, navigate to login after a brief success flash
  useEffect(() => {
    if (!state?.ok) return;
    const t = setTimeout(() => {
      router.replace("/login");
    }, 1800);
    return () => clearTimeout(t);
  }, [state?.ok, router]);

  if (!token || !email) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        <p className="font-semibold">Invalid reset link</p>
        <p className="mt-1 text-red-700">
          This link is missing required parameters.{" "}
          <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </span>
        <div>
          <p className="text-lg font-semibold text-emerald-900">Password updated!</p>
          <p className="mt-1.5 text-sm text-emerald-700">
            Taking you to sign in…
          </p>
        </div>
        <Loader2 className="size-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      {state && !state.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </div>
      )}

      <label className="form-label">
        New password
        <input
          type="password"
          name="password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1"
        />
      </label>
      <label className="form-label">
        Confirm new password
        <input
          type="password"
          name="confirm"
          placeholder="Repeat password"
          required
          autoComplete="new-password"
          className="mt-1"
        />
      </label>
      <button
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            Set New Password
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100dvh-57px)] items-start justify-center bg-background px-6 pt-10 pb-12 sm:items-center sm:py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Amata</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Zimbabwe</span>
          </span>
        </div>

        {/* Heading */}
        <div className="mb-7 flex items-start gap-3">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>
        </div>

        <Suspense>
          <ResetForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, ArrowLeft, Mail } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, null);

  return (
    <div className="flex min-h-[calc(100dvh-57px)] items-start justify-center bg-background px-6 pt-10 pb-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">Amata</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Zimbabwe</span>
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <div className="mt-7">
          {state?.ok ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-emerald-700">
                If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              {state && !state.ok && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  {state.error}
                </div>
              )}
              <label className="form-label">
                Email address
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    required
                    className="pl-9"
                    autoComplete="email"
                  />
                </div>
              </label>
              <button
                disabled={pending}
                className="h-11 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

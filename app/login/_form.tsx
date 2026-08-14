"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? null;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(authError.message ?? "Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Redirect based on role, or to the original requested page
    if (redirectTo && redirectTo.startsWith("/")) {
      router.push(redirectTo);
      return;
    }

    const user = data?.user as { role?: string } | undefined;
    const role = user?.role;
    if (role === "CLIENT") router.push("/client");
    else if (role === "AGENT") router.push("/agent");
    else if (role === "ACCOUNTS") router.push("/accounts");
    else if (role === "SYSTEM_ADMIN") router.push("/sysadmin");
    else if (role === "ADMINISTRATOR") router.push("/admin");
    else if (role === "CEO") router.push("/ceo");
    else router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}
      <label className="form-label">
        Email
        <input type="email" name="email" placeholder="name@example.com" required autoComplete="email" />
      </label>
      <label className="form-label">
        <div className="flex items-center justify-between">
          <span>Password</span>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <input type="password" name="password" placeholder="Enter password" required autoComplete="current-password" />
      </label>
      <button
        disabled={loading}
        className="h-11 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Log In"}
      </button>
    </form>
  );
}

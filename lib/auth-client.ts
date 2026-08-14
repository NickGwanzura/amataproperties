import type { Session } from "@/lib/auth-token";

type SignInInput = {
  email: string;
  password: string;
};

type AuthError = {
  message: string;
};

async function readError(response: Response): Promise<AuthError> {
  const body = await response.json().catch(() => null);
  return {
    message: body?.error?.message ?? "Authentication failed. Please try again.",
  };
}

export const authClient = {
  signIn: {
    email: async (input: SignInInput): Promise<{ data: Session | null; error: AuthError | null }> => {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        return { data: null, error: await readError(response) };
      }

      const body = await response.json();
      return { data: body.data, error: null };
    },
  },
  signOut: async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
  },
};

export type { Session };

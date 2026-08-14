"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ActionButtonProps = {
  action: () => Promise<void>;
  successMsg: string;
  successDesc?: string;
  errorMsg?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

/**
 * Wraps a server action with toast feedback and page refresh.
 * Drop this into any server-component page where inline `<form action={...}>`
 * is used, to give users visible confirmation that their action succeeded.
 */
export function ActionButton({
  action,
  successMsg,
  successDesc,
  errorMsg = "Action failed",
  children,
  className,
  disabled,
}: ActionButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      await action();
      toast.success(successMsg, successDesc);
    } catch {
      toast.error(errorMsg, "Please try again.");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }, [action, successMsg, successDesc, errorMsg, toast, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(loading && "pointer-events-none opacity-60", className)}
    >
      {children}
    </button>
  );
}

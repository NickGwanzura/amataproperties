"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const duration = toast.duration ?? (toast.variant === "loading" ? 999999 : 4000);

      setToasts((prev) => [...prev, { ...toast, id, duration }]);

      if (duration < 999999) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ variant: "success", title, description }),
    [addToast],
  );
  const error = useCallback(
    (title: string, description?: string) => addToast({ variant: "error", title, description, duration: 6000 }),
    [addToast],
  );
  const warning = useCallback(
    (title: string, description?: string) => addToast({ variant: "warning", title, description, duration: 5000 }),
    [addToast],
  );
  const info = useCallback(
    (title: string, description?: string) => addToast({ variant: "info", title, description }),
    [addToast],
  );
  const loading = useCallback(
    (title: string, description?: string) => addToast({ variant: "loading", title, description }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, loading }}>
      {children}

      {/* Toast container */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end sm:p-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Toast Item ──────────────────────────────────────────────────────────────

const variantIcons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  loading: "border-slate-200 bg-white text-slate-900 shadow-lg",
};

const iconStyles: Record<ToastVariant, string> = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-sky-500",
  loading: "text-primary",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = variantIcons[toast.variant];

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ring-1 ring-black/5 animate-slide-up sm:w-auto sm:min-w-[320px]",
        variantStyles[toast.variant],
      )}
    >
      <span className={cn("mt-0.5 shrink-0", iconStyles[toast.variant])}>
        <Icon className={cn("size-5", toast.variant === "loading" && "animate-spin")} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm leading-relaxed opacity-85">{toast.description}</p>
        )}
      </div>

      {toast.variant !== "loading" && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

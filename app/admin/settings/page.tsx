"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { MarketingImageSettings } from "@/components/marketing-image-settings";
import { SectionTitle } from "@/components/ui";
import { SITE } from "@/lib/site-config";

type AdminSettingsValues = {
  companyName: string;
  registrationNumber: string;
  primaryContactEmail: string;
  phone: string;
  defaultAgentCommission: string;
  reservationHoldDays: string;
  defaultInterestRate: string;
  inAppNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
};

const DEFAULT_ADMIN_SETTINGS: AdminSettingsValues = {
  companyName: "Amata Properties",
  registrationNumber: "",
  primaryContactEmail: "info@amataproperties.com",
  phone: SITE.phone1,
  defaultAgentCommission: "500",
  reservationHoldDays: "14",
  defaultInterestRate: "0",
  inAppNotifications: true,
  emailNotifications: false,
  smsNotifications: false,
};

function SaveButton({ pending, saved }: { pending: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Saving
        </>
      ) : saved ? (
        <>
          <CheckCircle2 className="size-4" />
          Saved
        </>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsValues>(DEFAULT_ADMIN_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/site-settings");
        const data = await response.json() as { adminSettings?: AdminSettingsValues };
        if (active && response.ok && data.adminSettings) {
          setSettings({ ...DEFAULT_ADMIN_SETTINGS, ...data.adminSettings });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof AdminSettingsValues>(key: K, value: AdminSettingsValues[K]) {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminSettings: settings }),
      });
      const data = await response.json() as { adminSettings?: AdminSettingsValues; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save settings.");
      if (data.adminSettings) setSettings({ ...DEFAULT_ADMIN_SETTINGS, ...data.adminSettings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-page">
      <SectionTitle eyebrow="Admin: Settings" title="System configuration" />
      {error ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MarketingImageSettings />
        </div>

        <section className="premium-panel p-6">
          <h2 className="text-xl font-semibold">Company Information</h2>
          <form className="mt-5 space-y-4" onSubmit={saveSettings}>
            <label className="form-label">
              Company Name
              <input
                className="mt-1"
                value={settings.companyName}
                onChange={(event) => set("companyName", event.target.value)}
                disabled={loading}
                required
              />
            </label>
            <label className="form-label">
              Registration Number
              <input
                className="mt-1"
                value={settings.registrationNumber}
                onChange={(event) => set("registrationNumber", event.target.value)}
                placeholder="e.g. 12345/2020"
                disabled={loading}
              />
            </label>
            <label className="form-label">
              Primary Contact Email
              <input
                type="email"
                className="mt-1"
                value={settings.primaryContactEmail}
                onChange={(event) => set("primaryContactEmail", event.target.value)}
                disabled={loading}
                required
              />
            </label>
            <label className="form-label">
              Phone
              <input
                className="mt-1"
                value={settings.phone}
                onChange={(event) => set("phone", event.target.value)}
                disabled={loading}
                required
              />
            </label>
            <SaveButton pending={saving || loading} saved={saved} />
          </form>
        </section>

        <section className="premium-panel p-6">
          <h2 className="text-xl font-semibold">Default Commission Settings</h2>
          <form className="mt-5 space-y-4" onSubmit={saveSettings}>
            <label className="form-label">
              Default Agent Commission (USD)
              <input
                type="number"
                className="mt-1"
                value={settings.defaultAgentCommission}
                onChange={(event) => set("defaultAgentCommission", event.target.value)}
                disabled={loading}
              />
            </label>
            <label className="form-label">
              Reservation Hold Period (days)
              <input
                type="number"
                className="mt-1"
                value={settings.reservationHoldDays}
                onChange={(event) => set("reservationHoldDays", event.target.value)}
                disabled={loading}
              />
            </label>
            <label className="form-label">
              Default Interest Rate (%)
              <input
                type="number"
                step="0.01"
                className="mt-1"
                value={settings.defaultInterestRate}
                onChange={(event) => set("defaultInterestRate", event.target.value)}
                disabled={loading}
              />
            </label>
            <SaveButton pending={saving || loading} saved={saved} />
          </form>
        </section>

        <section className="premium-panel p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Notification Channels</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure which channels are active for system notifications.
          </p>
          <div className="mt-4 space-y-3">
            {[
              { key: "inAppNotifications" as const, label: "In-App Notifications", desc: "Real-time alerts inside the platform" },
              { key: "emailNotifications" as const, label: "Email Notifications", desc: "Send event emails via SMTP" },
              { key: "smsNotifications" as const, label: "SMS Notifications", desc: "Send via bulk SMS gateway" },
            ].map((channel) => (
              <label
                key={channel.label}
                className="flex cursor-pointer items-center justify-between rounded border p-4 hover:bg-muted"
              >
                <div>
                  <p className="font-semibold">{channel.label}</p>
                  <p className="text-sm text-muted-foreground">{channel.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[channel.key]}
                  onChange={(event) => set(channel.key, event.target.checked)}
                  disabled={loading}
                  className="size-5"
                />
              </label>
            ))}
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={saving || loading}
              className="inline-flex h-11 items-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
            >
              {saving || loading ? <Loader2 className="size-4 animate-spin" /> : saved ? <CheckCircle2 className="size-4" /> : null}
              {saving || loading ? "Saving" : saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

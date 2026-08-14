import postgres from "postgres";

import { PROPERTY_HERO_IMAGE } from "@/lib/brand-assets";

export const MARKETING_IMAGE_SETTING_KEY = "marketing_image_url";
export const ADMIN_SETTINGS_KEY = "admin_settings";

export type AdminSettings = {
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

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  companyName: "Amata Properties",
  registrationNumber: "",
  primaryContactEmail: "info@amataproperties.com",
  phone: "+263 774 574 989",
  defaultAgentCommission: "500",
  reservationHoldDays: "14",
  defaultInterestRate: "0",
  inAppNotifications: true,
  emailNotifications: false,
  smsNotifications: false,
};

type SiteSettingRow = {
  value: string | null;
};

let siteSettingsTableReady: Promise<void> | null = null;

let sqlClient: ReturnType<typeof postgres> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = postgres(process.env.DATABASE_URL);
  return sqlClient;
}

async function ensureSiteSettingsTable() {
  if (!siteSettingsTableReady) {
    siteSettingsTableReady = (async () => {
      const sql = getSql();
      if (!sql) return;
      await sql`
        create table if not exists site_settings (
          key text primary key,
          value text not null,
          updated_at timestamptz not null default now()
        )
      `;
    })();
  }
  return siteSettingsTableReady;
}

export async function getSiteSetting(key: string) {
  const sql = getSql();
  if (!sql) return null;

  await ensureSiteSettingsTable();
  const [row] = await sql`
    select value from site_settings where key = ${key} limit 1
  `;
  const setting = row as SiteSettingRow | undefined;
  return setting?.value?.trim() || null;
}

export async function setSiteSetting(key: string, value: string) {
  const sql = getSql();
  if (!sql) throw new Error("Database is not configured.");

  await ensureSiteSettingsTable();
  await sql`
    insert into site_settings (key, value, updated_at)
    values (${key}, ${value}, now())
    on conflict (key) do update
    set value = excluded.value,
        updated_at = now()
  `;
}

export async function getMarketingImageUrl() {
  // The public marketing hero is intentionally local so the agency site does
  // not depend on R2 or a remote image service during page rendering.
  return PROPERTY_HERO_IMAGE;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const raw = await getSiteSetting(ADMIN_SETTINGS_KEY);
  if (!raw) return DEFAULT_ADMIN_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export async function setAdminSettings(settings: AdminSettings) {
  await setSiteSetting(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
}

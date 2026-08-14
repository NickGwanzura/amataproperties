import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  type AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  getAdminSettings,
  getMarketingImageUrl,
  MARKETING_IMAGE_SETTING_KEY,
  setAdminSettings,
  setSiteSetting,
} from "@/lib/site-settings";
import { getSessionUser } from "@/lib/session";

const ADMIN_ROLES = new Set(["ADMINISTRATOR", "SYSTEM_ADMIN"]);

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.has(user.role)) return null;
  return user;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [marketingImageUrl, adminSettings] = await Promise.all([
    getMarketingImageUrl(),
    getAdminSettings(),
  ]);

  return NextResponse.json({ marketingImageUrl, adminSettings });
}

export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { marketingImageUrl?: unknown; adminSettings?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const marketingImageUrl =
    typeof body.marketingImageUrl === "string" ? body.marketingImageUrl.trim() : undefined;

  let savedMarketingImageUrl: string | undefined;
  let savedAdminSettings: AdminSettings | undefined;

  if (marketingImageUrl !== undefined) {
    if (!marketingImageUrl) {
      return NextResponse.json({ error: "Upload an image before saving." }, { status: 400 });
    }

    if (
      !marketingImageUrl.startsWith("/") &&
      !marketingImageUrl.startsWith("https://")
    ) {
      return NextResponse.json({ error: "Image URL must be local or HTTPS." }, { status: 400 });
    }

    await setSiteSetting(MARKETING_IMAGE_SETTING_KEY, marketingImageUrl);
    savedMarketingImageUrl = marketingImageUrl;
    revalidatePath("/");
    revalidatePath("/about");
  }

  if (body.adminSettings !== undefined) {
    if (!body.adminSettings || typeof body.adminSettings !== "object" || Array.isArray(body.adminSettings)) {
      return NextResponse.json({ error: "Invalid admin settings." }, { status: 400 });
    }

    const input = body.adminSettings as Partial<AdminSettings>;
    savedAdminSettings = {
      ...DEFAULT_ADMIN_SETTINGS,
      companyName: typeof input.companyName === "string" ? input.companyName.trim() : DEFAULT_ADMIN_SETTINGS.companyName,
      registrationNumber: typeof input.registrationNumber === "string" ? input.registrationNumber.trim() : "",
      primaryContactEmail: typeof input.primaryContactEmail === "string" ? input.primaryContactEmail.trim() : DEFAULT_ADMIN_SETTINGS.primaryContactEmail,
      phone: typeof input.phone === "string" ? input.phone.trim() : DEFAULT_ADMIN_SETTINGS.phone,
      defaultAgentCommission: typeof input.defaultAgentCommission === "string" ? input.defaultAgentCommission.trim() : DEFAULT_ADMIN_SETTINGS.defaultAgentCommission,
      reservationHoldDays: typeof input.reservationHoldDays === "string" ? input.reservationHoldDays.trim() : DEFAULT_ADMIN_SETTINGS.reservationHoldDays,
      defaultInterestRate: typeof input.defaultInterestRate === "string" ? input.defaultInterestRate.trim() : DEFAULT_ADMIN_SETTINGS.defaultInterestRate,
      inAppNotifications: Boolean(input.inAppNotifications),
      emailNotifications: Boolean(input.emailNotifications),
      smsNotifications: Boolean(input.smsNotifications),
    };

    if (!savedAdminSettings.companyName || !savedAdminSettings.primaryContactEmail || !savedAdminSettings.phone) {
      return NextResponse.json({ error: "Company name, email, and phone are required." }, { status: 400 });
    }

    await setAdminSettings(savedAdminSettings);
  }

  if (!savedMarketingImageUrl && !savedAdminSettings) {
    return NextResponse.json({ error: "No settings were provided." }, { status: 400 });
  }

  return NextResponse.json({
    marketingImageUrl: savedMarketingImageUrl ?? await getMarketingImageUrl(),
    adminSettings: savedAdminSettings ?? await getAdminSettings(),
  });
}

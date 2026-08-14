import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { getGroupByAdminUserId, getGroupById, getGroupMembers } from "@/lib/db/queries/groups";
import { generateSalesReportPdf } from "@/lib/documents";

const ADMIN_ROLES = ["ADMINISTRATOR", "SYSTEM_ADMIN"] as const;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const requestedGroupId = searchParams.get("groupId");

  let groupId: string | null = null;
  if (user.role === "GROUP_ADMIN") {
    const own = await getGroupByAdminUserId(user.id);
    if (!own) return NextResponse.json({ error: "No group assigned" }, { status: 404 });
    groupId = own.id;
  } else if (ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
    groupId = requestedGroupId;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

  const [group, members] = await Promise.all([getGroupById(groupId), getGroupMembers(groupId)]);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const salesRows = members.flatMap((m) =>
    (m.sales ?? []).map((s) => ({
      saleNumber: s.saleNumber,
      status: s.status,
      clientName: m.name,
      developmentName: group.development?.name ?? "—",
      standNumber: s.stand?.standNumber ?? "—",
      agentName: "—",
      purchasePrice: parseFloat(s.purchasePrice),
      depositPaid: parseFloat(s.depositPaid),
      outstandingBalance: parseFloat(s.outstandingBalance),
    })),
  );

  const pdfBuffer = await generateSalesReportPdf({ sales: salesRows });
  const uint8 = new Uint8Array(pdfBuffer);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store, must-revalidate",
      "Content-Disposition": `attachment; filename="${group.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report-${date}.pdf"`,
    },
  });
}

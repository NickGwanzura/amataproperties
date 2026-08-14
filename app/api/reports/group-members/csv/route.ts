import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { getGroupByAdminUserId, getGroupById, getGroupMembers } from "@/lib/db/queries/groups";
import { toCsv } from "@/lib/csv";

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

  const header = ["Name", "Email", "Phone", "National ID", "Stand", "Sale Status", "Outstanding Balance"];
  const rows = members.map((m) => {
    const sale = m.sales?.[0];
    const reservation = m.reservations?.[0];
    return [
      m.name,
      m.email,
      m.phone,
      m.nationalId,
      sale?.stand?.standNumber ?? reservation?.stand?.standNumber ?? "",
      sale?.status ?? reservation?.status ?? "UNALLOCATED",
      sale ? parseFloat(sale.outstandingBalance).toFixed(2) : "",
    ];
  });

  const csv = toCsv([header, ...rows]);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${group.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-members-${date}.csv"`,
    },
  });
}

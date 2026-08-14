import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

const ALLOWED = ["GROUP_ADMIN", "ADMINISTRATOR", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const header = ["name", "nationalId", "phone", "email", "address"];
  const example = ["Jane Moyo", "63-123456A78", "0771234567", "jane.moyo@example.com", "12 Church Street, Harare"];

  const buffer = toXlsxBuffer(header, [example], "Members");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="group-members-template.xlsx"`,
    },
  });
}

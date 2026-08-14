import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth-token";
import { toXlsxBuffer, XLSX_CONTENT_TYPE } from "@/lib/xlsx";

const ALLOWED = ["ADMINISTRATOR", "SYSTEM_ADMIN"] as const;

export async function GET() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session?.user || !ALLOWED.includes(session.user.role as typeof ALLOWED[number]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const header = ["standNumber", "sizeSqm", "price", "section", "phase", "block", "road", "notes"];
  const example = ["A-001", 300, 15000, "Section A", "Phase 1", "Block 1", "Main Road", ""];

  const buffer = toXlsxBuffer(header, [example], "Stands");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="stand-import-template.xlsx"`,
    },
  });
}

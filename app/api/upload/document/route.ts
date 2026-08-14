import { NextRequest, NextResponse } from "next/server";
import { uploadFile, isStorageConfigured } from "@/lib/storage";
import { getSessionUser } from "@/lib/session";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentProfiles, leads, reservations, sales } from "@/lib/db/schema";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const UPLOAD_ROLES = new Set(["SYSTEM_ADMIN", "ADMINISTRATOR", "ACCOUNTS", "AGENT"]);

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !UPLOAD_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Storage is not configured on this server." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const clientId = typeof form.get("clientId") === "string" ? (form.get("clientId") as string).trim() : "";

  if (user.role === "AGENT") {
    if (!clientId) {
      return NextResponse.json({ error: "Client context is required for agent uploads." }, { status: 400 });
    }

    const agent = await db.query.agentProfiles.findFirst({
      where: eq(agentProfiles.userId, user.id),
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent profile not found." }, { status: 403 });
    }

    const [lead, reservation, sale] = await Promise.all([
      db.query.leads.findFirst({
        where: and(eq(leads.clientId, clientId), eq(leads.agentId, agent.id)),
        columns: { id: true },
      }),
      db.query.reservations.findFirst({
        where: and(eq(reservations.clientId, clientId), eq(reservations.agentId, agent.id)),
        columns: { id: true },
      }),
      db.query.sales.findFirst({
        where: and(eq(sales.clientId, clientId), eq(sales.agentId, agent.id)),
        columns: { id: true },
      }),
    ]);
    const ownsClient = Boolean(lead || reservation || sale);
    if (!ownsClient) {
      return NextResponse.json({ error: "You can only upload documents for assigned clients." }, { status: 403 });
    }
  }

  const file = form.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPEG, PNG, and WebP files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds the 20 MB size limit." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const key = `client-documents/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadFile(key, buffer, file.type);
    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

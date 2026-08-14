import { NextRequest, NextResponse } from "next/server";
import { uploadFile, isStorageConfigured } from "@/lib/storage";
import { getSessionUser } from "@/lib/session";
import { randomUUID } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_ROLES = new Set(["SYSTEM_ADMIN", "ADMINISTRATOR"]);

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

  const file = form.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and AVIF images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10 MB size limit." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `developments/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadFile(key, buffer, file.type);
    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

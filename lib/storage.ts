import { createHash, createHmac } from "crypto";

// ── env helpers ───────────────────────────────────────────────────────────
const BUCKET = process.env.S3_BUCKET_NAME ?? "";
const REGION = process.env.S3_REGION ?? "auto";
const PUBLIC_URL = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");

function cfg() {
  return {
    endpoint: (process.env.S3_ENDPOINT ?? "").replace(/\/$/, ""),
    id: process.env.S3_ACCESS_KEY_ID ?? "",
    secret: process.env.S3_SECRET_ACCESS_KEY ?? "",
  };
}

// ── SigV4 primitives ──────────────────────────────────────────────────────
function sha256hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, msg: string): Buffer {
  return createHmac("sha256", key).update(msg).digest();
}

function signingKey(secret: string, ds: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, ds), REGION), "s3"), "aws4_request");
}

function isoTs(d: Date): string {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20231015T123456Z
}

// ── signed fetch (Authorization-header style) ─────────────────────────────
async function s3fetch(
  method: "PUT" | "DELETE",
  key: string,
  payload: Buffer | undefined,
  contentType?: string,
): Promise<Response> {
  const { endpoint, id, secret } = cfg();
  if (!endpoint) throw new Error("Storage is not configured.");

  const url = new URL(`${endpoint}/${BUCKET}/${key}`);
  const now = new Date();
  const ts = isoTs(now);
  const ds = ts.slice(0, 8);
  const payloadHash = payload ? sha256hex(payload) : sha256hex("");

  const hdrs: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": ts,
  };
  if (contentType) hdrs["content-type"] = contentType;

  const sortedKeys = Object.keys(hdrs).sort();
  const canonHeaders = sortedKeys.map((k) => `${k}:${hdrs[k]}\n`).join("");
  const signedHeaders = sortedKeys.join(";");
  const credScope = `${ds}/${REGION}/s3/aws4_request`;

  const canonRequest = [method, url.pathname, "", canonHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", ts, credScope, sha256hex(canonRequest)].join("\n");
  const sig = hmac(signingKey(secret, ds), stringToSign).toString("hex");

  const fetchHeaders: Record<string, string> = {
    ...hdrs,
    authorization: `AWS4-HMAC-SHA256 Credential=${id}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  };
  if (payload) fetchHeaders["content-length"] = String(payload.length);

  const body = payload
    ? payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength) as ArrayBuffer
    : null;
  return fetch(url.toString(), { method, headers: fetchHeaders, body });
}

// ── presigned URL (query-param signature) ─────────────────────────────────
function presign(method: "GET" | "PUT", key: string, expiresIn: number): string {
  const { endpoint, id, secret } = cfg();
  if (!endpoint) throw new Error("Storage is not configured.");

  const now = new Date();
  const ts = isoTs(now);
  const ds = ts.slice(0, 8);
  const credScope = `${ds}/${REGION}/s3/aws4_request`;
  const url = new URL(`${endpoint}/${BUCKET}/${key}`);

  const qp = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${id}/${credScope}`,
    "X-Amz-Date": ts,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  });
  qp.sort();

  const canonQs = qp.toString();
  const canonRequest = [
    method,
    url.pathname,
    canonQs,
    `host:${url.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", ts, credScope, sha256hex(canonRequest)].join("\n");
  const sig = hmac(signingKey(secret, ds), stringToSign).toString("hex");
  qp.set("X-Amz-Signature", sig);

  return `${url.origin}${url.pathname}?${qp.toString()}`;
}

// ── public API ────────────────────────────────────────────────────────────
export type UploadResult = { key: string; url: string };

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<UploadResult> {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const res = await s3fetch("PUT", key, buf, contentType);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }
  const { endpoint } = cfg();
  const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : `${endpoint}/${BUCKET}/${key}`;
  return { key, url };
}

export async function deleteFile(key: string): Promise<void> {
  const res = await s3fetch("DELETE", key, undefined);
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 delete failed (${res.status}): ${text}`);
  }
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return presign("GET", key, expiresIn);
}

export async function getPresignedUploadUrl(
  key: string,
  _contentType: string,
  expiresIn = 300,
): Promise<string> {
  return presign("PUT", key, expiresIn);
}

export function kycKey(clientId: string, docType: string, filename: string) {
  return `kyc/${clientId}/${docType}/${filename}`;
}

export function saleDocKey(saleId: string, docType: string, filename: string) {
  return `sales/${saleId}/${docType}/${filename}`;
}

export function groupDocKey(groupId: string, docType: string, filename: string) {
  return `groups/${groupId}/${docType}/${filename}`;
}

export function isStorageConfigured() {
  return Boolean(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY,
  );
}

/** @deprecated use isStorageConfigured */
export const isR2Configured = isStorageConfigured;

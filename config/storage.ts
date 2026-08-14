/**
 * File storage configuration (S3-compatible, e.g. Cloudflare R2).
 *
 * All values from environment variables for environment-portability.
 */

export const storage = {
  /** S3 endpoint URL */
  endpoint: process.env.S3_ENDPOINT || "",

  /** Access key ID */
  accessKeyId: process.env.S3_ACCESS_KEY_ID || "",

  /** Secret access key */
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",

  /** Bucket name */
  bucket: process.env.S3_BUCKET_NAME || "",

  /** Public-facing URL for the bucket */
  publicUrl: process.env.S3_PUBLIC_URL || "",

  /** Region (defaults to "auto" for R2) */
  region: process.env.S3_REGION || "auto",

  /** Whether storage is configured */
  isConfigured: !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  ),

  /** UploadThing token (alternative to S3) */
  uploadThingToken: process.env.UPLOADTHING_TOKEN || "",

  /** Whether UploadThing is configured */
  uploadThingConfigured: !!(process.env.UPLOADTHING_TOKEN),
} as const;

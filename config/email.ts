/**
 * Email configuration for Resend.
 *
 * All values come from environment variables so changing the sending domain
 * is a config-only operation.
 */

export const email = {
  /** Resend API key */
  apiKey: process.env.RESEND_API_KEY || "",

  /** From: address for transactional emails */
  from: process.env.EMAIL_FROM || "notifications@amataproperties.com",

  /** From: name displayed to recipients */
  fromName: process.env.EMAIL_FROM_NAME || "Amata Properties",

  /** Reply-to address */
  replyTo: process.env.EMAIL_REPLY_TO || "info@amataproperties.com",

  /** Whether email sending is configured */
  isConfigured: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
} as const;

/**
 * Central site configuration — the single source of truth for all contact
 * information. Every component, email template, script, and page should
 * reference these values rather than hardcoding phone numbers or emails.
 *
 * If you need to update a number or email, change it here and it propagates
 * everywhere.
 *
 * NOTE: Company name now comes from @/config/company; this file is kept as a
 * convenience re-export for backward compatibility and for contact details.
 */

import { company, SALES_LINES as configSalesLines, waLink as configWaLink } from "@/config";

export const SITE = {
  name: company.name,
  email: company.email,
  accountsEmail: company.accountsEmail,

  /** Sales line 1 (display format) */
  phone1: company.phone1,
  phone1Tel: company.phone1Tel,

  /** Sales line 2 */
  phone2: company.phone2,
  phone2Tel: company.phone2Tel,

  /** Sales line 3 */
  phone3: company.phone3,
  phone3Tel: company.phone3Tel,

  /** Sales line 4 */
  phone4: company.phone4,
  phone4Tel: company.phone4Tel,

  /** Accounts team */
  accountsPhone: company.accountsPhone,
  accountsPhoneTel: company.accountsPhoneTel,

  /** WhatsApp number (no + prefix, digits only) */
  whatsapp: company.whatsapp,
} as const;

/** The four sales lines as an array for iterating in footers / contact pages. */
export const SALES_LINES = configSalesLines;

/** WhatsApp link builder */
export function waLink(text?: string): string {
  return configWaLink(text);
}

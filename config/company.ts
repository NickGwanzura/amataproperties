/**
 * Company configuration — single source of truth for all Amata Properties
 * Agency branding and contact information.
 *
 * Every component, email, PDF, dashboard, and page should import from here
 * instead of hardcoding company details.
 */

export const company = {
  /** Legal trading name */
  name: "Amata Properties",

  /** Short display name used in navigation, titles, and tight spaces */
  shortName: "Amata",

  /** Legal suffix used on formal documents */
  legalSuffix: "(Pvt) Ltd",

  /** Registered company / business number */
  registrationNumber: "",

  /** Tagline */
  tagline: "A full-service real estate agency for living, investing, and growing.",

  /** Primary contact email */
  email: "enquiries@amataproperties.co.zw",

  /** Accounts / finance department email */
  accountsEmail: "admin@amataproperties.co.zw",

  /** Info / general enquiries */
  infoEmail: "enquiries@amataproperties.co.zw",

  /** Sales phone lines */
  phone1: "+263 790 054 017",
  phone1Tel: "+263790054017",

  phone2: "+263 790 054 018",
  phone2Tel: "+263790054018",

  phone3: "+263 790 054 017",
  phone3Tel: "+263790054017",

  phone4: "+263 790 054 018",
  phone4Tel: "+263790054018",

  /** Accounts team */
  accountsPhone: "+263 790 054 017",
  accountsPhoneTel: "+263790054017",

  /** WhatsApp number (digits only, no +) */
  whatsapp: "263790054017",

  /** Physical address */
  address: "50 Greendale Avenue, Greendale, Zimbabwe",

  /** Country of operation */
  country: "Zimbabwe",

  /** Currency code */
  currency: "USD",

  /** Locale */
  locale: "en_ZW",
} as const;

/** Sales phone lines as an array for iteration */
export const SALES_LINES = [
  { number: company.phone1, href: `tel:${company.phone1Tel}` },
  { number: company.phone2, href: `tel:${company.phone2Tel}` },
] as const;

/** WhatsApp link builder */
export function waLink(text?: string): string {
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${company.whatsapp}${msg}`;
}

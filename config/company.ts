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
  email: "sales@amataproperties.com",

  /** Accounts / finance department email */
  accountsEmail: "accounts@amataproperties.com",

  /** Info / general enquiries */
  infoEmail: "info@amataproperties.com",

  /** Sales phone lines */
  phone1: "0774 574 989",
  phone1Tel: "+263774574989",

  phone2: "077 886 6613",
  phone2Tel: "+263778866613",

  phone3: "078 031 9278",
  phone3Tel: "+263780319278",

  phone4: "071 668 4531",
  phone4Tel: "+263716684531",

  /** Accounts team */
  accountsPhone: "+263 78 231 7127",
  accountsPhoneTel: "+263782317127",

  /** WhatsApp number (digits only, no +) */
  whatsapp: "263774574989",

  /** Physical address */
  address: "Zimbabwe",

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
  { number: company.phone3, href: `tel:${company.phone3Tel}` },
  { number: company.phone4, href: `tel:${company.phone4Tel}` },
] as const;

/** WhatsApp link builder */
export function waLink(text?: string): string {
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${company.whatsapp}${msg}`;
}

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
  accountsEmail: "enquiries@amataproperties.co.zw",

  /** Info / general enquiries */
  infoEmail: "enquiries@amataproperties.co.zw",

  /** Sales phone lines */
  phone1: "+263 78 699 9404",
  phone1Tel: "+263786999404",

  phone2: "+263 78 699 9404",
  phone2Tel: "+263786999404",

  phone3: "+263 78 699 9404",
  phone3Tel: "+263786999404",

  phone4: "+263 78 699 9404",
  phone4Tel: "+263786999404",

  /** Accounts team */
  accountsPhone: "+263 78 699 9404",
  accountsPhoneTel: "+263786999404",

  /** WhatsApp number (digits only, no +) */
  whatsapp: "263786999404",

  /** Physical address */
  address: "Office 210, Century House, 49 Nelson Mandela Avenue, Harare, Zimbabwe",

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
] as const;

/** WhatsApp link builder */
export function waLink(text?: string): string {
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${company.whatsapp}${msg}`;
}

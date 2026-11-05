// lib/labInfo.ts — details about the lab shown under the sign-in card.
// Each one is optional and only shown when it is set, so the page never links to something that doesn't exist.
// Set them in source/frontend/.env.local (local dev) or as build args (Docker):
//   NEXT_PUBLIC_LAB_HOURS="Mon–Fri 09:00–17:00"
//   NEXT_PUBLIC_LAB_CONTACT_EMAIL="physics-lab@example.ac.th"
//   NEXT_PUBLIC_LAB_RULES_URL="https://…/lab-safety-rules.pdf"

export type LabInfo = {
  hours: string | null;
  contactEmail: string | null;
  rulesUrl: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_URL = /^(https?:\/\/|\/)/i; // no javascript: or other schemes

const clean = (value: string | undefined) => value?.trim() || null;

export function readLabInfo(raw: { hours?: string; contactEmail?: string; rulesUrl?: string }): LabInfo {
  const contactEmail = clean(raw.contactEmail);
  const rulesUrl = clean(raw.rulesUrl);
  return {
    hours: clean(raw.hours),
    contactEmail: contactEmail && EMAIL.test(contactEmail) ? contactEmail : null,
    rulesUrl: rulesUrl && SAFE_URL.test(rulesUrl) ? rulesUrl : null,
  };
}

/** mailto: link with a ready subject line, so reports are easy to spot in the inbox. */
export function reportProblemHref(email: string) {
  return `mailto:${email}?subject=${encodeURIComponent('[Vase Lab] Problem report')}`;
}

// written out in full: Next.js only inlines NEXT_PUBLIC_ variables it can see by name
export const labInfo = readLabInfo({
  hours: process.env.NEXT_PUBLIC_LAB_HOURS,
  contactEmail: process.env.NEXT_PUBLIC_LAB_CONTACT_EMAIL,
  rulesUrl: process.env.NEXT_PUBLIC_LAB_RULES_URL,
});

/**
 * The official public address of the website.
 *
 * Change it in ONE place without touching code: set NEXT_PUBLIC_SITE_URL
 * in Vercel (Settings > Environment Variables). The fallback below is the
 * domain registered for the project.
 *
 * Login, sign-up and password-reset links already use the address the person
 * is actually on, so they work on any domain you add. This value is for
 * things that need a fixed address, such as page previews and, later, the
 * links inside notification emails.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://verifiefroomie.com"
).replace(/\/$/, "");

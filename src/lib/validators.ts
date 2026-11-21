import { checkBio } from "./bioCheck";

export type CheckResult = { ok: true } | { ok: false; message: string };

// Letters from any language (including accents), with single spaces, hyphens
// or apostrophes between name parts. No numbers, symbols or emojis.
const NAME_RE = /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u;

export function checkFullName(raw: string): CheckResult {
  const name = raw.trim().replace(/\s+/g, " ");

  if (name.length < 2) {
    return { ok: false, message: "Please enter your full name." };
  }
  if (name.length > 60) {
    return { ok: false, message: "Full name is too long." };
  }
  if (/\p{Nd}/u.test(name.normalize("NFKC"))) {
    return { ok: false, message: "Full name can only contain letters. Please remove any numbers." };
  }
  if (!NAME_RE.test(name)) {
    return {
      ok: false,
      message: "Full name can only contain letters, spaces, hyphens and apostrophes.",
    };
  }
  // No contact details or spelled-out numbers hidden inside the name
  if (!checkBio(name).ok) {
    return { ok: false, message: "Full name should be your real name only." };
  }
  return { ok: true };
}

// Real-looking email: name@domain.tld (no spaces, no double dots, has a proper ending)
const EMAIL_RE =
  /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export function checkEmail(raw: string): CheckResult {
  const email = raw.trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return {
      ok: false,
      message: "Please enter a valid email address, for example name@gmail.com.",
    };
  }
  return { ok: true };
}
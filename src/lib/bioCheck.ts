// Shared checks that stop people sharing contact details in free-text fields.
// Contact details are only revealed after two people connect (Connect Points).

export type BioCheck = { ok: true } | { ok: false; message: string };

const MAX_NUMBER_WORDS = 1; // strict fields (bio, name): 2 or more spelled-out numbers is rejected

const UNITS = "one|two|three|four|five|six|seven|eight|nine";
const TENS = "twenty|thirty|forty|fourty|fifty|sixty|seventy|eighty|ninety";
const OTHERS =
  "zero|nought|naught|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundred|thousand|million";

// "twenty five" or "twenty-five" counts as ONE number word
const NUMBER_WORD_SOURCE = `\\b(?:(?:${TENS})(?:[\\s-]+(?:${UNITS}))?|${UNITS}|${OTHERS})\\b`;

const DIGIT_OF: Record<string, string> = {
  zero: "0", nought: "0", naught: "0",
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9",
  ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14",
  fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19",
  twenty: "2", thirty: "3", forty: "4", fourty: "4", fifty: "5",
  sixty: "6", seventy: "7", eighty: "8", ninety: "9",
  hundred: "00", thousand: "000", million: "000000",
};
const TENS_ONLY = new Set([
  "twenty", "thirty", "forty", "fourty", "fifty", "sixty", "seventy", "eighty", "ninety",
]);

// Patterns that show someone is trying to share a way to contact them
const CONTACT_PATTERNS: RegExp[] = [
  /@/, // email addresses and @handles
  /[[({]\s*(?:at|dot)\s*[\])}]/, // (at) [dot]
  /\b[a-z0-9._-]{2,}\s+at\s+[a-z0-9-]{2,}\s+dot\s+[a-z]{2,}\b/, // name at gmail dot com
  /\b(?:gmail|yahoo|hotmail|outlook|icloud|protonmail)\b/,
  /\bhttps?\b|\bwww\b|:\/\//, // links
  /\b[a-z0-9-]{2,}\.(?:com|net|org|ng|io|info|biz|xyz|app|link)\b/, // web addresses
  /\b(?:wa\.me|t\.me|bit\.ly|tinyurl)\b/,
  /whats\s?-?app|watsapp|whatsap/,
  /\b(?:telegram|instagram|insta|facebook|snapchat|tiktok|twitter|linkedin)\b/,
  /\b(?:dm|inbox|ping|reach|contact|message|text|email|e-mail|mail|whatsapp)\s+(?:me|us)\b/,
  /\b(?:call|text)\s+(?:me\s+)?(?:on|at|via)\b/,
  /\bhit\s+(?:me|my)\b/,
  /\b(?:my|our)\s+(?:number|digits|contact|email|e-mail|handle)\b/,
  /\b(?:phone|mobile|cell|telephone)\s+(?:number|no)\b/,
];

function normalize(raw: string): string {
  let t = raw
    .normalize("NFKC") // fancy and full-width characters become normal ones
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "") // hidden zero-width characters
    .toLowerCase();

  // Join letters spaced out on purpose: "z e r o", "t.w.o", "w h a t s a p p"
  t = t.replace(/\b[a-z](?:[\s._*-]+[a-z]){2,}\b/g, (m) =>
    m.replace(/[\s._*-]+/g, "")
  );
  return t;
}

function checkContact(t: string): BioCheck {
  if (CONTACT_PATTERNS.some((re) => re.test(t))) {
    return {
      ok: false,
      message:
        "Contact details can't be shared here. They're shared automatically once people connect.",
    };
  }
  return { ok: true };
}

function wordToDigits(m: string): string {
  const parts = m.split(/[\s-]+/);
  if (parts.length === 1 && TENS_ONLY.has(parts[0])) return DIGIT_OF[parts[0]] + "0";
  return parts.map((p) => DIGIT_OF[p] ?? "").join("");
}

// True when digits and/or spelled-out numbers add up to a phone number
function looksLikePhone(t: string): boolean {
  // Money such as 1,200,000 is fine
  let d = t.replace(/\b[1-9]\d{0,2}(?:,\d{3})+(?!\d)/g, "#");

  // Spelled-out numbers become digits
  d = d.replace(new RegExp(NUMBER_WORD_SOURCE, "g"), wordToDigits);
  d = d
    .replace(/\b(?:double|dubble)[\s-]+(\d)/g, "$1$1")
    .replace(/\btriple[\s-]+(\d)/g, "$1$1$1");

  // "oh" or "o" used as zero next to digits
  d = d.replace(/\b(?:oh|o)\b(?=[\s,.\-]*\d)/g, "0");
  d = d.replace(/(\d[\s,.\-]*)\b(?:oh|o)\b/g, (_m, a: string) => a + "0");

  // Join digits split up by spaces, dots, dashes, commas, brackets or small filler words
  d = d.replace(
    /(\d)(?:[\s.,\-_()/+*~|]|\b(?:and|then|plus|next)\b)+(?=\d)/g,
    "$1"
  );

  // Nigerian-style numbers: start with 0 or 234 and run on for 10+ digits
  return /(?:234|0)\d{9,}/.test(d);
}

/**
 * Strict check for the bio and the full name.
 * Any digit is rejected, 2 or more spelled-out numbers are rejected, and so is any contact phrase.
 */
export function checkBio(raw: string): BioCheck {
  const t = normalize(raw);

  // Any digit from any writing system (0, 1, 2, ...)
  if (/\p{Nd}/u.test(t)) {
    return {
      ok: false,
      message: "Only text is allowed in your bio. Please remove any numbers.",
    };
  }

  const contact = checkContact(t);
  if (!contact.ok) return contact;

  const found = t.match(new RegExp(NUMBER_WORD_SOURCE, "g")) ?? [];
  if (found.length > MAX_NUMBER_WORDS) {
    return { ok: false, message: "Invalid characters entered." };
  }

  return { ok: true };
}

/**
 * Check for listing text (description, house rules, place name, area).
 * Numbers are allowed ("2 bedroom", "24 hours light", rent amounts),
 * but phone numbers and contact phrases are not.
 */
export function checkListingText(raw: string): BioCheck {
  const t = normalize(raw);

  const contact = checkContact(t);
  if (!contact.ok) return contact;

  if (looksLikePhone(t)) {
    return {
      ok: false,
      message:
        "Phone numbers can't be added here. Contact details are shared automatically once people connect.",
    };
  }

  return { ok: true };
}
// ---------- Listing form: stricter, with a limit across all fields ----------

const MAX_LISTING_NUMBERS = 6; // digits + spelled-out numbers allowed across the whole listing text

function countNumberTokens(t: string): number {
  const digits = (t.match(/\p{Nd}/gu) ?? []).length;
  const words = (t.match(new RegExp(NUMBER_WORD_SOURCE, "g")) ?? []).length;
  return digits + words;
}

/**
 * One listing field.
 * Description and house rules: no digits at all (write "two bedroom").
 * Estate/street and area: a house or plot number only (up to 4 digits in total).
 */
export function checkListingField(label: string, raw: string): BioCheck {
  const t = normalize(raw);

  const contact = checkContact(t);
  if (!contact.ok) return contact;

  if (looksLikePhone(t)) {
    return {
      ok: false,
      message:
        "Phone numbers can't be added here. Contact details are shared automatically once people connect.",
    };
  }

  const isAddress = /street|area/i.test(label);
  if (isAddress) {
    const digitCount = (t.match(/\p{Nd}/gu) ?? []).length;
    if (/\p{Nd}{4,}/u.test(t) || digitCount > 4) {
      return {
        ok: false,
        message:
          "Please keep numbers in the address to a house or plot number only (up to 4 digits in total).",
      };
    }
  } else if (/\p{Nd}/u.test(t)) {
    return {
      ok: false,
      message:
        "Numbers aren't allowed here. Write them in words if you need them, for example \"two bedroom\".",
    };
  }

  return { ok: true };
}

/**
 * All listing text together: stops a phone number being split into pieces
 * across the estate name, area, description and house rules.
 */
export function checkListingCombined(values: string[]): BioCheck {
  const total = values.reduce((sum, v) => sum + countNumberTokens(normalize(v)), 0);
  if (total > MAX_LISTING_NUMBERS) {
    return {
      ok: false,
      message:
        "There are too many numbers across your listing text. Please remove any numbers or number words you don't need.",
    };
  }
  return { ok: true };
}
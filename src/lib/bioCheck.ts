// Shared checks that stop people sharing contact details in free-text fields.
// Contact details are only revealed after two people connect (Connect Points).

export type BioCheck = { ok: true } | { ok: false; message: string };

// How many spelled-out numbers are allowed.
//  tight: this many in a row (with only commas or spaces between) are fine; more is rejected
//  loose: this many with up to two ordinary words between each are fine; more is rejected
//  total: this many in the whole text are fine; more is rejected
const BIO_LIMITS = { tight: 2, loose: 4, total: 6 };
const LISTING_LIMITS = { tight: 2, loose: 5, total: 8 };
const LOOSE_GAP_WORDS = 2;

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

type NumberHit = { start: number; end: number };

function numberHits(t: string): NumberHit[] {
  const hits: NumberHit[] = [];
  const re = new RegExp(NUMBER_WORD_SOURCE, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    hits.push({ start: m.index, end: m.index + m[0].length });
  }
  return hits;
}

// The longest run of spelled-out numbers with at most `maxGapWords` ordinary words between each
function longestChain(t: string, hits: NumberHit[], maxGapWords: number): number {
  let best = 0;
  let current = 0;
  for (let i = 0; i < hits.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const between = t.slice(hits[i - 1].end, hits[i].start);
      const words = (between.match(/[a-z']+/g) ?? []).length;
      current = words <= maxGapWords ? current + 1 : 1;
    }
    if (current > best) best = current;
  }
  return best;
}

// Spelled-out numbers are fine in normal sentences ("a nine to five", "just one roommate").
// They are rejected when they follow each other, are spread through a sentence with
// filler words between them, or when there are simply too many.
function checkSpelled(t: string, limits: { tight: number; loose: number; total: number }): BioCheck {
  const hits = numberHits(t);
  if (hits.length <= 1) return { ok: true };

  if (longestChain(t, hits, 0) > limits.tight) {
    return {
      ok: false,
      message:
        "Spelled-out numbers can't follow each other (for example “zero eight one”). Short phrases like “nine to five” or “one bedroom” are fine.",
    };
  }
  if (longestChain(t, hits, LOOSE_GAP_WORDS) > limits.loose) {
    return {
      ok: false,
      message:
        "Spelled-out numbers can't be spread through a sentence with other words in between. Short phrases like “nine to five” or “one bedroom” are fine.",
    };
  }
  if (hits.length > limits.total) {
    return {
      ok: false,
      message:
        "There are too many spelled-out numbers here. Short phrases like “nine to five” or “one bedroom” are fine, but please use fewer.",
    };
  }
  return { ok: true };
}

/**
 * Check for the bio ("about me") and the full name.
 * Digits are rejected, contact phrases are rejected, and spelled-out numbers are
 * allowed in normal sentences but not in a row or spread out to hide a number.
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

  return checkSpelled(t, BIO_LIMITS);
}

// Kept so older imports keep working
export function checkListingText(raw: string): BioCheck {
  return checkListingField("Short description", raw);
}

// ---------- Listing form ----------

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

  return checkSpelled(t, LISTING_LIMITS);
}

/**
 * All listing text together: stops a phone number being split into pieces
 * across the area, description and house rules.
 */
export function checkListingCombined(values: string[]): BioCheck {
  const total = values.reduce((sum, v) => sum + countNumberTokens(normalize(v)), 0);
  if (total > LISTING_LIMITS.total) {
    return {
      ok: false,
      message:
        "There are too many numbers across your listing text. Please remove any numbers or number words you don't need.",
    };
  }
  return { ok: true };
}
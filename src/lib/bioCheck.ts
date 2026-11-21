// Rejects bios that try to share contact details.
// Rule 1: any digit at all -> "only text allowed".
// Rule 2: more than MAX_NUMBER_WORDS spelled-out numbers -> "invalid characters".

const MAX_NUMBER_WORDS = 1; // 2 or more spelled-out numbers is rejected

const UNITS = "one|two|three|four|five|six|seven|eight|nine";
const TENS = "twenty|thirty|forty|fourty|fifty|sixty|seventy|eighty|ninety";
const OTHERS =
  "zero|nought|naught|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundred|thousand|million";

// "twenty five" or "twenty-five" counts as ONE number word
const NUMBER_WORD = new RegExp(
  `\\b(?:(?:${TENS})(?:[\\s-]+(?:${UNITS}))?|${UNITS}|${OTHERS})\\b`,
  "g"
);

export type BioCheck = { ok: true } | { ok: false; message: string };

export function checkBio(raw: string): BioCheck {
  // Normalise tricks: fancy/full-width characters, hidden zero-width characters, capitals
  let t = raw
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "")
    .toLowerCase();

  // Rule 1: any digit from any writing system (0, 1, 2, ...)
  if (/\p{Nd}/u.test(t)) {
    return {
      ok: false,
      message: "Only text is allowed in your bio. Please remove any numbers.",
    };
  }

  // Join letters spaced out on purpose: "z e r o", "t.w.o", "n-i-n-e"
  t = t.replace(/\b[a-z](?:[\s._*-]+[a-z]){2,}\b/g, (m) =>
    m.replace(/[\s._*-]+/g, "")
  );

  // Rule 2: spelled-out numbers, anywhere in the bio, with any words or commas between
  const found = t.match(NUMBER_WORD) ?? [];
  if (found.length > MAX_NUMBER_WORDS) {
    return { ok: false, message: "Invalid characters entered." };
  }

  return { ok: true };
}
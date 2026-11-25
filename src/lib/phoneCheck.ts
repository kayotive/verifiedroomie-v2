// Checks a Nigerian phone number and returns it in one standard format: 08012345678
export function checkPhone(
  input: string
): { ok: true; phone: string } | { ok: false; message: string } {
  const raw = input.trim();
  if (!raw) return { ok: false, message: "Please enter your phone number." };

  if (/[^\d\s+()-]/.test(raw)) {
    return { ok: false, message: "Phone number can only contain numbers." };
  }

  let digits = raw.replace(/\D/g, "");

  // +234 801 234 5678 or 2348012345678 -> 08012345678
  if (digits.startsWith("234")) digits = "0" + digits.slice(3);

  if (digits.length < 11) {
    return {
      ok: false,
      message: "Phone number is not complete. It must be 11 digits, for example 08012345678.",
    };
  }
  if (digits.length > 11) {
    return {
      ok: false,
      message: "Phone number is too long. It must be 11 digits, for example 08012345678.",
    };
  }
  if (!/^0[789][01]\d{8}$/.test(digits)) {
    return {
      ok: false,
      message: "That is not a valid Nigerian phone number. Example: 08012345678.",
    };
  }
  return { ok: true, phone: digits };
}
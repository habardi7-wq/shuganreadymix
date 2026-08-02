// Normalizes Saudi mobile numbers to the E.164-ish form used as the unique
// key everywhere: "9665XXXXXXXX" (no leading "+", no "00").
export function normalizeSaudiPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");

  let national: string | null = null;
  if (digits.startsWith("9665") && digits.length === 12) {
    national = digits;
  } else if (digits.startsWith("05") && digits.length === 10) {
    national = `966${digits.slice(1)}`;
  } else if (digits.startsWith("5") && digits.length === 9) {
    national = `966${digits}`;
  } else if (digits.startsWith("00966") && digits.length === 14) {
    national = digits.slice(2);
  }

  if (!national) return null;
  return national;
}

export function formatPhoneForDisplay(phone: string): string {
  if (phone.startsWith("966") && phone.length === 12) {
    return `+${phone}`;
  }
  return phone;
}

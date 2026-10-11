/**
 * Only allow local, origin-relative redirects after authentication.
 * Backslashes may be normalized by browsers into protocol-relative URLs.
 */
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length > 2048
      || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")
      || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }
  try {
    const base = "https://auto-minas.invalid";
    if (new URL(value, base).origin !== base) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/**
 * Safe date formatting utilities that prevent "Invalid Date" errors
 * across all client and server components.
 */

export function isValidDate(val: any): boolean {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

export function formatDateSafe(
  val: any,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-IN",
  fallback: string = "—"
): string {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
}

export function formatDateTimeSafe(
  val: any,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-IN",
  fallback: string = "—"
): string {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString(locale, options);
  } catch {
    return fallback;
  }
}

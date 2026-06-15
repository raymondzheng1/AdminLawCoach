/** BYO Anthropic key — held only in the browser, sent as a header, never persisted/logged server-side (§6, PRD §6.9). */
const BYO_STORAGE_KEY = "alc_byo_key";

export function getByoKey(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(BYO_STORAGE_KEY);
  return v && v.trim() ? v.trim() : null;
}

export function setByoKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) window.localStorage.setItem(BYO_STORAGE_KEY, trimmed);
  else window.localStorage.removeItem(BYO_STORAGE_KEY);
}

export function clearByoKey(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(BYO_STORAGE_KEY);
}

export function maskKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

export function isValidByoKeyShape(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

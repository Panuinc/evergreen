import { ZPL_CONFIG } from "./config";

export function mmToDots(mm: number): number {
  return Math.round(mm * ZPL_CONFIG.dotsPerMm);
}

export function sanitizeText(text: string | null | undefined, maxLen = 100): string {
  if (!text) return "";
  return String(text).replace(/[\^~]/g, "").substring(0, maxLen);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

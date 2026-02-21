import { ZPL_CONFIG } from "./config.js";

export function mmToDots(mm) {
  return Math.round(mm * ZPL_CONFIG.dotsPerMm);
}

export function sanitizeText(text, maxLen = 100) {
  if (!text) return "";
  return String(text).replace(/[\^~]/g, "").substring(0, maxLen);
}

export function calculateTotalPieces(order) {
  return getItemLines(order).reduce(
    (sum, line) => sum + (line.quantity || 0),
    0,
  );
}

export function getItemLines(order) {
  return (order?.salesOrderLines || []).filter((l) => l.lineType === "Item");
}

export function getCommentLines(order) {
  return (order?.salesOrderLines || []).filter((l) => l.lineType === "Comment");
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function splitText(text, maxCharsPerLine) {
  if (!text) return [];

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxCharsPerLine) {
        let remaining = word;
        while (remaining.length > maxCharsPerLine) {
          lines.push(remaining.substring(0, maxCharsPerLine));
          remaining = remaining.substring(maxCharsPerLine);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : [""];
}

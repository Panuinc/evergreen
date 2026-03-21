import { LABEL_SIZES } from "./config";
import { mmToDots, sanitizeText } from "./utils";
import { generatePlainEPC } from "./epc";

const PAD = {
  top: mmToDots(2),
  left: mmToDots(4),
  right: mmToDots(4),
};

interface GraphicResult {
  command: string;
  width: number;
  height: number;
}

export async function textToGraphic(
  text: string,
  options: { fontSize?: number; maxWidth?: number; bold?: boolean } = {},
): Promise<GraphicResult | null> {
  const { fontSize = 32, maxWidth = 800, bold = false } = options;

  try {
    const { createCanvas } = await import("canvas");

    const fontWeight = bold ? "bold " : "";
    const fontStr = `${fontWeight}${fontSize}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;

    const measureCanvas = createCanvas(1, 1);
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = fontStr;
    const metrics = measureCtx.measureText(text);

    const textWidth = Math.min(Math.ceil(metrics.width) + 10, maxWidth);
    const textHeight = fontSize + 10;

    const canvas = createCanvas(textWidth, textHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, textWidth, textHeight);
    ctx.fillStyle = "black";
    ctx.font = fontStr;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 5, textHeight / 2);

    const imageData = ctx.getImageData(0, 0, textWidth, textHeight);
    const { data, width, height } = imageData;

    const bytesPerRow = Math.ceil(width / 8);
    const totalBytes = bytesPerRow * height;
    const bitmapData = new Uint8Array(totalBytes);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const avgColor = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
        if (avgColor < 128) {
          const byteIndex = y * bytesPerRow + Math.floor(x / 8);
          bitmapData[byteIndex] |= 1 << (7 - (x % 8));
        }
      }
    }

    let hexData = "";
    for (let i = 0; i < bitmapData.length; i++) {
      hexData += bitmapData[i].toString(16).padStart(2, "0").toUpperCase();
    }

    return {
      command: `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}`,
      width,
      height,
    };
  } catch (error) {
    console.error("[zpl] textToGraphic failed:", (error as Error).message);
    return null;
  }
}

function estimateTextWidth(text: string, fontSize: number): number {
  return Math.ceil(text.length * fontSize * 0.55);
}

function getShortItemNumber(fullNumber: string): string {
  const parts = fullNumber.split("-");
  return parts.length >= 3 ? parts.slice(2).join("-") : fullNumber;
}

export interface BuildLabelOptions {
  itemNumber: string;
  rfidCode?: string | null;
  displayName: string;
  projectName?: string | null;
  sequenceNumber?: number;
  totalQuantity?: number;
  epcData?: string | null;
  labelSize?: { width: number; height: number };
  printMethod?: string;
  enableRFID?: boolean;
}

export async function buildThaiRFIDLabel(options: BuildLabelOptions): Promise<string> {
  const {
    itemNumber,
    rfidCode = null,
    displayName,
    projectName = null,
    sequenceNumber = 1,
    totalQuantity = 1,
    epcData = null,
    labelSize = LABEL_SIZES.RFID,
    printMethod = "TT",
    enableRFID = true,
  } = options;

  const w = mmToDots(labelSize.width);
  const h = mmToDots(labelSize.height);
  const usableWidth = w - PAD.left - PAD.right;

  const epcKey = rfidCode ?? itemNumber;
  const epc = epcData || generatePlainEPC(epcKey, sequenceNumber, totalQuantity);
  const printModeCmd = printMethod === "TT" ? "^MTT" : "^MTD";

  let zpl = `^XA${printModeCmd}^PW${w}^LL${h}^CI28`;

  // Row 1: short item number (left) + sequence (right)
  const row1Y = PAD.top;
  const shortItemNumber = getShortItemNumber(itemNumber);
  const itemFontSize = shortItemNumber.length > 12 ? 36 : 44;
  zpl += `^FO${PAD.left},${row1Y}^A0N,${itemFontSize},${itemFontSize}^FD${sanitizeText(shortItemNumber, 20)}^FS`;

  const sequenceText = `${sequenceNumber}/${totalQuantity}`;
  const seqFontSize = 32;
  const seqX = w - estimateTextWidth(sequenceText, seqFontSize) - PAD.right;
  zpl += `^FO${seqX},${row1Y}^A0N,${seqFontSize},${seqFontSize}^FD${sequenceText}^FS`;

  // Row 2: project name (centered, Thai bitmap)
  const row2Y = PAD.top + mmToDots(8);
  const projectText = projectName || "-";
  const projectGraphic = await textToGraphic(projectText, { fontSize: 32, maxWidth: usableWidth, bold: true });
  if (projectGraphic) {
    const projectX = Math.max(PAD.left, Math.floor((w - projectGraphic.width) / 2));
    zpl += `^FO${projectX},${row2Y}${projectGraphic.command}^FS`;
  } else {
    const projectX = Math.max(PAD.left, Math.floor((w - estimateTextWidth(projectText, 36)) / 2));
    zpl += `^FO${projectX},${row2Y}^A0N,36,36^FD${sanitizeText(projectText, 30)}^FS`;
  }

  // Row 3: product description (centered, Thai bitmap)
  const row3Y = PAD.top + mmToDots(14);
  const nameGraphic = await textToGraphic(displayName, { fontSize: 30, maxWidth: usableWidth, bold: true });
  if (nameGraphic) {
    const nameX = Math.max(PAD.left, Math.floor((w - nameGraphic.width) / 2));
    zpl += `^FO${nameX},${row3Y}${nameGraphic.command}^FS`;
  } else {
    const fallbackText = sanitizeText(displayName, 24);
    const fallbackX = Math.max(PAD.left, Math.floor((w - estimateTextWidth(fallbackText, 36)) / 2));
    zpl += `^FO${fallbackX},${row3Y}^A0N,36,36^FD${fallbackText}^FS`;
  }

  if (enableRFID) {
    zpl += `^RS8^RFW,H^FD${epc}^FS`;
  }

  zpl += `^PQ1^XZ`;
  return zpl;
}

export interface LabelResult {
  zpl: string;
  sequenceNumber: number;
  totalQuantity: number;
  epc: string;
}

export async function buildThaiRFIDLabels(options: {
  itemNumber: string;
  rfidCode?: string | null;
  displayName: string;
  projectName?: string | null;
  quantity?: number;
  labelSize?: { width: number; height: number };
  printMethod?: string;
  enableRFID?: boolean;
}): Promise<LabelResult[]> {
  const {
    itemNumber,
    rfidCode = null,
    displayName,
    projectName = null,
    quantity = 1,
    labelSize = LABEL_SIZES.RFID,
    printMethod = "TT",
    enableRFID = true,
  } = options;

  const epcKey = rfidCode ?? itemNumber;
  const labels: LabelResult[] = [];

  for (let i = 1; i <= quantity; i++) {
    const epc = generatePlainEPC(epcKey, i, quantity);
    const zpl = await buildThaiRFIDLabel({
      itemNumber,
      rfidCode,
      displayName,
      projectName,
      sequenceNumber: i,
      totalQuantity: quantity,
      epcData: epc,
      labelSize,
      printMethod,
      enableRFID,
    });
    labels.push({ zpl, sequenceNumber: i, totalQuantity: quantity, epc });
  }

  return labels;
}

export const PrinterCommands = {
  HOST_STATUS: "~HS",
  CANCEL_ALL: "~JA",
  CANCEL_CURRENT: "~JX",
  CLEAR_BUFFER: "^XA^MCY^XZ",
  RESET_PRINTER: "~JR",
  POWER_ON_RESET: "~JP",
  CALIBRATE_MEDIA: "~JC",
  FEED_LABEL: "~TA000",
  PAUSE: "~PP",
  RESUME: "~PS",
};

import { ZPL_CONFIG, LABEL_SIZES } from "./config.js";
import { mmToDots, sanitizeText } from "./utils.js";
import { generatePlainEPC } from "./epc.js";

const PAD = {
  top: mmToDots(2),
  left: mmToDots(2),
};

export async function textToGraphic(text, options = {}) {
  const { fontSize = 32, maxWidth = 800 } = options;

  try {
    const { createCanvas } = await import("canvas");

    const measureCanvas = createCanvas(1, 1);
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = `${fontSize}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
    const metrics = measureCtx.measureText(text);

    const textWidth = Math.min(Math.ceil(metrics.width) + 10, maxWidth);
    const textHeight = fontSize + 10;

    const canvas = createCanvas(textWidth, textHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, textWidth, textHeight);

    ctx.fillStyle = "black";
    ctx.font = `${fontSize}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
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
        const avgColor =
          (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
        const isBlack = avgColor < 128;

        if (isBlack) {
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
    console.error("[zpl] Text to graphic conversion failed:", error.message);
    return null;
  }
}

function estimateTextWidth(text, fontSize) {
  const avgCharWidth = fontSize * 0.55;
  return Math.ceil(text.length * avgCharWidth);
}

function getShortItemNumber(fullNumber) {
  if (!fullNumber) return fullNumber;
  const parts = fullNumber.split("-");
  if (parts.length >= 3) {
    return parts.slice(-2).join("-");
  }
  return fullNumber;
}

export async function buildThaiRFIDLabel(options) {
  const {
    itemNumber,
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

  const usableWidth = w - PAD.left * 2;

  const epc =
    epcData || generatePlainEPC(itemNumber, sequenceNumber, totalQuantity);

  const printModeCmd = printMethod === "TT" ? "^MTT" : "^MTD";

  let zpl = `^XA${printModeCmd}^PW${w}^LL${h}^CI28`;

  const row1Y = PAD.top;
  const shortItemNumber = getShortItemNumber(itemNumber);
  const itemFontSize = shortItemNumber.length > 12 ? 48 : 56;
  const itemText = sanitizeText(shortItemNumber, 20);

  zpl += `^FO${PAD.left},${row1Y}^A0N,${itemFontSize},${itemFontSize}^FD${itemText}^FS`;

  const sequenceText = `${sequenceNumber}/${totalQuantity}`;
  const seqFontSize = 40;
  const seqWidth = estimateTextWidth(sequenceText, seqFontSize);
  const seqX = w - seqWidth - PAD.left;
  zpl += `^FO${seqX},${row1Y}^A0N,${seqFontSize},${seqFontSize}^FD${sequenceText}^FS`;

  const row2Y = PAD.top + mmToDots(8);
  const projectText = projectName || "-";
  const projectFontSize = 36;
  const projectWidth = estimateTextWidth(projectText, projectFontSize);
  const projectX = Math.max(PAD.left, Math.floor((w - projectWidth) / 2));
  zpl += `^FO${projectX},${row2Y}^A0N,${projectFontSize},${projectFontSize}^FD${sanitizeText(projectText, 30)}^FS`;

  const row3Y = PAD.top + mmToDots(14);
  const nameGraphic = await textToGraphic(displayName, {
    fontSize: 32,
    maxWidth: usableWidth,
  });

  if (nameGraphic) {
    const nameX = Math.max(PAD.left, Math.floor((w - nameGraphic.width) / 2));
    zpl += `^FO${nameX},${row3Y}${nameGraphic.command}^FS`;
  } else {
    const fallbackText = sanitizeText(displayName, 24);
    const fallbackWidth = estimateTextWidth(fallbackText, 36);
    const fallbackX = Math.max(PAD.left, Math.floor((w - fallbackWidth) / 2));
    zpl += `^FO${fallbackX},${row3Y}^A0N,36,36^FD${fallbackText}^FS`;
  }

  const row4Y = PAD.top + mmToDots(20);
  const epcLabelFontSize = 24;
  zpl += `^FO${PAD.left},${row4Y}^A0N,${epcLabelFontSize},${epcLabelFontSize}^FDRFID EPC:^FS`;

  const row4bY = PAD.top + mmToDots(23);
  const epcDisplayFontSize = 20;
  zpl += `^FO${PAD.left},${row4bY}^A0N,${epcDisplayFontSize},${epcDisplayFontSize}^FD${epc}^FS`;

  if (enableRFID) {
    zpl += `^RS8^RFW,H^FD${epc}^FS`;
  }

  zpl += `^PQ1^XZ`;
  return zpl;
}

export async function buildThaiRFIDLabels(options) {
  const {
    itemNumber,
    displayName,
    projectName = null,
    quantity = 1,
    labelSize = LABEL_SIZES.RFID,
    printMethod = "TT",
    enableRFID = true,
  } = options;

  const labels = [];

  for (let i = 1; i <= quantity; i++) {
    const epc = generatePlainEPC(itemNumber, i, quantity);

    const zpl = await buildThaiRFIDLabel({
      itemNumber,
      displayName,
      projectName,
      sequenceNumber: i,
      totalQuantity: quantity,
      epcData: epc,
      labelSize,
      printMethod,
      enableRFID,
    });

    labels.push({
      zpl,
      sequenceNumber: i,
      totalQuantity: quantity,
      sequenceText: `${i}/${quantity}`,
      epc,
    });
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
  RFID_CALIBRATE: "^XA^HR^XZ",
  FEED_LABEL: "~TA000",
  PAUSE: "~PP",
  RESUME: "~PS",
  SET_DIRECT_THERMAL: "^XA^MTD^XZ",
  SET_THERMAL_TRANSFER: "^XA^MTT^XZ",
};

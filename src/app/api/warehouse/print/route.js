import { NextResponse } from "next/server";
import net from "net";
import { createCanvas } from "canvas";
import zlib from "zlib";

const PRINTER_HOST = process.env.RFID_PRINTER_HOST || "192.168.1.43";
const PRINTER_PORT = Number(process.env.RFID_PRINTER_PORT) || 9100;
const TIMEOUT = 15000;

function sendToPrinter(data, host = PRINTER_HOST, port = PRINTER_PORT) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(TIMEOUT);

    socket.connect(port, host, () => {
      socket.write(data, "utf8", () => {
        socket.end();
        resolve({ success: true, message: "Sent successfully" });
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`Connection timed out (${host}:${port})`));
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(new Error(`Send failed: ${err.message}`));
    });
  });
}

function testConnection(host = PRINTER_HOST, port = PRINTER_PORT) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(port, host, () => {
      socket.end();
      resolve({ success: true, status: "Connected", printer: `${host}:${port}` });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ success: false, error: "เชื่อมต่อไม่ได้ (timeout)" });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({ success: false, error: "ไม่พบเครื่องพิมพ์" });
    });
  });
}

function buildEpc(itemNumber, pieceNumber, totalPieces) {
  const payload = `${itemNumber}|${pieceNumber}|${totalPieces}`;

  let hex = "";
  for (let i = 0; i < payload.length; i++) {
    hex += payload.charCodeAt(i).toString(16).toUpperCase().padStart(2, "0");
  }

  if (hex.length % 4 !== 0) {
    hex = hex.padEnd(hex.length + (4 - (hex.length % 4)), "0");
  }

  return hex;
}

function crc16ccitt(buf) {
  let crc = 0xffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function textToZplGraphic(text, maxWidthDots, fontSizePx) {
  const canvas = createCanvas(maxWidthDots, fontSizePx * 3);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  ctx.font = `${fontSizePx}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 0);

  const textHeight = Math.ceil(fontSizePx * 1.4);

  const imgWidth = Math.ceil(maxWidthDots / 8) * 8;
  const bytesPerRow = imgWidth / 8;
  const imgData = ctx.getImageData(0, 0, imgWidth, textHeight);
  const pixels = imgData.data;

  const monoBytes = [];
  for (let y = 0; y < textHeight; y++) {
    for (let xByte = 0; xByte < bytesPerRow; xByte++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = xByte * 8 + bit;
        const idx = (y * imgWidth + x) * 4;
        const r = pixels[idx] || 255;
        const g = pixels[idx + 1] || 255;
        const b = pixels[idx + 2] || 255;
        if ((r + g + b) / 3 < 128) {
          byte |= 1 << (7 - bit);
        }
      }
      monoBytes.push(byte);
    }
  }

  const totalBytes = monoBytes.length;
  const compressed = zlib.deflateSync(Buffer.from(monoBytes));
  const b64 = compressed.toString("base64");
  const crc = crc16ccitt(compressed);

  return { zpl: `^GFA,${totalBytes},${totalBytes},${bytesPerRow},:Z64:${b64}:${crc}`, height: textHeight };
}

function buildZpl(item, pieceNumber, totalPieces, cfg) {
  const dpm = Math.round(cfg.dpi / 25.4);
  const pw = Math.round(cfg.labelWidth * dpm);
  const ll = Math.round(cfg.labelHeight * dpm);
  const fs = cfg.fontSize || 40;
  const ls = Math.round((cfg.labelShift || 0) * dpm);

  const mx = Math.round(3 * dpm);
  const my = Math.round(2.5 * dpm);
  const usableW = pw - mx * 2;

  let zpl = `^XA^MTT^PW${pw}^LL${ll}^LS${ls}^CI28`;
  zpl += `^FO${mx},${my}^A0N,${fs},${fs}^FD${item.number}^FS`;

  if (cfg.showPieceNumber) {
    const sf = Math.max(Math.round(fs * 0.75), 20);
    const seqText = `${pieceNumber}/${totalPieces}`;
    const seqWidth = Math.ceil(seqText.length * sf * 0.6);
    const seqX = pw - mx - seqWidth;
    zpl += `^FO${seqX},${my}^A0N,${sf},${sf}^FD${seqText}^FS`;
  }

  if (item.displayName) {
    const df = Math.max(Math.round(fs * 0.6), 24);
    const nameY = my + fs + Math.round(1.5 * dpm);
    const gfx = textToZplGraphic(item.displayName, usableW, df);
    zpl += `^FO${mx},${nameY}${gfx.zpl}^FS`;
  }

  if (cfg.showBarcode) {
    const df = Math.max(Math.round(fs * 0.6), 24);
    const by = item.displayName
      ? my + fs + Math.round(1.5 * dpm) + Math.ceil(df * 1.4) + Math.round(1 * dpm)
      : my + fs + Math.round(1.5 * dpm);
    const bh = Math.max(ll - by - my, 20);
    zpl += `^FO${mx},${by}^BY2^BCN,${bh},Y,N,N^FD${item.number}^FS`;
  }

  if (cfg.encodeRfid) {
    const epc = buildEpc(item.number, pieceNumber, totalPieces);
    zpl += `^RS8^RFW,H^FD${epc}^FS`;
  }

  zpl += "^PQ1^XZ";
  return zpl;
}

function renderPreview(item, quantity, cfg) {
  const PREVIEW_WIDTH = 600;
  const ratio = cfg.labelHeight / cfg.labelWidth;
  const previewH = Math.round(PREVIEW_WIDTH * ratio);
  const s = PREVIEW_WIDTH / cfg.labelWidth;

  const mx = Math.round(3 * s);
  const my = Math.round(2.5 * s);
  const fTitle = Math.round(4.5 * s);
  const fSeq = Math.round(3.4 * s);
  const fName = Math.round(2.8 * s);

  const retina = 2;
  const canvas = createCanvas(PREVIEW_WIDTH * retina, previewH * retina);
  const ctx = canvas.getContext("2d");
  ctx.scale(retina, retina);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, previewH);
  ctx.strokeStyle = "#BBBBBB";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, PREVIEW_WIDTH - 1, previewH - 1);

  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";

  ctx.font = `bold ${fTitle}px sans-serif`;
  ctx.fillText(item.number, mx, my);

  if (cfg.showPieceNumber) {
    const seqText = `1/${quantity}`;
    ctx.font = `bold ${fSeq}px sans-serif`;
    const seqW = ctx.measureText(seqText).width;
    ctx.fillText(seqText, PREVIEW_WIDTH - seqW - mx, my);
  }

  if (item.displayName) {
    const nameY = my + fTitle + Math.round(1.5 * s);
    ctx.font = `${fName}px sans-serif`;
    ctx.fillText(item.displayName, mx, nameY, PREVIEW_WIDTH - mx * 2);
  }

  if (cfg.encodeRfid) {
    ctx.fillStyle = "#999999";
    const rfidFs = Math.round(1.4 * s);
    ctx.font = `italic ${rfidFs}px sans-serif`;
    ctx.fillText("RFID", mx, previewH - rfidFs - my);
  }

  return canvas.toBuffer("image/png").toString("base64");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = "print", item, quantity = 1, config = {} } = body;

    if (action === "testConnection") {
      const result = await testConnection();
      return NextResponse.json({ success: result.success, data: result });
    }

    if (!item?.number) {
      return NextResponse.json(
        { success: false, error: "Item number is required" },
        { status: 400 },
      );
    }

    const cfg = {
      dpi: 300,
      labelWidth: 73,
      labelHeight: 21,
      labelShift: 7,
      fontSize: 40,
      showBarcode: false,
      showPieceNumber: true,
      encodeRfid: true,
      ...config,
    };

    if (action === "preview") {
      const preview = renderPreview(item, quantity, cfg);
      return NextResponse.json({ success: true, preview });
    }

    let allZpl = "";
    for (let i = 1; i <= quantity; i++) {
      allZpl += buildZpl(item, i, quantity, cfg);
    }

    const result = await sendToPrinter(allZpl);
    return NextResponse.json({ success: true, data: result, quantity });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

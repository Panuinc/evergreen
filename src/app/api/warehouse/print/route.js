import { NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const PRINTER_NAME =
  process.env.RFID_PRINTER_NAME || "CHAINWAY CP30 (300 dpi)";
const TIMEOUT = 15000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, "rawprint.ps1");

function sendToPrinter(data, printerName = PRINTER_NAME) {
  const tmpFile = path.join(tmpdir(), `zpl_${Date.now()}.bin`);
  return writeFile(tmpFile, data, "utf8").then(
    () =>
      new Promise((resolve, reject) => {
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${SCRIPT_PATH}" -PrinterName "${printerName}" -FilePath "${tmpFile}"`;
        exec(cmd, { timeout: TIMEOUT }, (err, stdout, stderr) => {
          unlink(tmpFile).catch(() => {});
          if (err) {
            reject(
              new Error(
                `Send failed: ${stderr?.trim() || err.message}`,
              ),
            );
          } else {
            resolve({ success: true, message: "Sent successfully" });
          }
        });
      }),
  );
}

function testConnection(printerName = PRINTER_NAME) {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile "(Get-Printer -Name '${printerName}' -ErrorAction SilentlyContinue).PrinterStatus"`,
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({ success: false, error: "ไม่พบเครื่องพิมพ์" });
        } else {
          const status = stdout.trim();
          resolve({
            success: status === "Normal" || status === "0",
            status,
            printer: printerName,
          });
        }
      },
    );
  });
}

function buildEpc(itemNumber, pieceNumber, totalPieces) {
  const bytes = 12;
  const seqChar =
    pieceNumber <= 9
      ? String(pieceNumber)
      : String.fromCharCode(55 + pieceNumber);
  const totalChar =
    totalPieces <= 9
      ? String(totalPieces)
      : String.fromCharCode(55 + totalPieces);

  const compact = itemNumber.replace(/-/g, "").substring(0, bytes - 3);
  const padded = compact.padEnd(bytes - 3, " ");
  const fullString = `${padded}/${seqChar}${totalChar}`;

  let hex = "";
  for (let i = 0; i < fullString.length; i++) {
    hex += fullString
      .charCodeAt(i)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
  }
  return hex.padEnd(bytes * 2, "00");
}

function buildZpl(item, pieceNumber, totalPieces, cfg) {
  const dpm = Math.round(cfg.dpi / 25.4);
  const pw = Math.round(cfg.labelWidth * dpm);
  const ll = Math.round(cfg.labelHeight * dpm);
  const fs = cfg.fontSize || 28;
  const ls = Math.round((cfg.labelShift || 0) * dpm);

  let zpl = `^XA^MTT^PW${pw}^LL${ll}^LS${ls}^CI28`;
  zpl += `^FO20,15^A0N,${fs},${fs}^FD${item.number}^FS`;

  if (cfg.showPieceNumber) {
    const sf = Math.max(Math.round(fs * 0.7), 14);
    const seqText = `${pieceNumber}/${totalPieces}`;
    const seqWidth = Math.ceil(seqText.length * sf * 0.55);
    const seqX = pw - seqWidth - 20;
    zpl += `^FO${seqX},15^A0N,${sf},${sf}^FD${seqText}^FS`;
  }

  if (cfg.showBarcode) {
    const by = 20 + fs + 5;
    const bh = Math.max(ll - by - 10, 20);
    zpl += `^FO20,${by}^BY2^BCN,${bh},Y,N,N^FD${item.number}^FS`;
  }

  if (cfg.encodeRfid) {
    const epc = buildEpc(item.number, pieceNumber, totalPieces);
    zpl += `^RS8^RFW,H^FD${epc}^FS`;
  }

  zpl += "^PQ1^XZ";
  return zpl;
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
      fontSize: 28,
      showBarcode: true,
      showPieceNumber: true,
      encodeRfid: false,
      ...config,
    };

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

import { NextResponse } from "next/server";
import net from "net";

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

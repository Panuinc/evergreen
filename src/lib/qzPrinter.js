import qz from "qz-tray";
import { getPrinterConfig } from "./printerConfig";

// Skip QZ Tray security prompts for internal use
qz.security.setCertificatePromise((resolve) => resolve(""));
qz.security.setSignatureAlgorithm("SHA512");
qz.security.setSignaturePromise(() => (resolve) => resolve(""));

export async function connectPrinter() {
  if (qz.websocket.isActive()) return;

  qz.websocket.setClosedCallbacks(() => {});
  await qz.websocket.connect();
}

export async function disconnectPrinter() {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }
}

export async function findPrinter(name) {
  await connectPrinter();
  if (name) return qz.printers.find(name);
  return qz.printers.getDefault();
}

export async function listPrinters() {
  await connectPrinter();
  return qz.printers.find();
}

function hashString(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

function buildEpc(itemNumber, pieceNumber) {
  const idHex = hashString(itemNumber);
  const pieceHex = pieceNumber.toString(16).padStart(8, "0");
  return (idHex + pieceHex).toUpperCase();
}

function buildTspl(item, pieceNumber, totalPieces, cfg, isFirst) {
  const epc = buildEpc(item.number, pieceNumber);
  const cmds = [];

  if (isFirst) {
    cmds.push(`SIZE ${cfg.labelWidth} mm, ${cfg.labelHeight} mm`);
    cmds.push(cfg.mediaType === "W" ? "GAP 3 mm, 0" : "GAP 0, 0");
    cmds.push(`SPEED ${cfg.printSpeed}`);
    cmds.push(`DENSITY ${cfg.darkness}`);
    cmds.push("DIRECTION 1");
  }

  cmds.push("CLS");
  cmds.push(`TEXT 10,5,"3",0,1,1,"${item.number}"`);

  if (cfg.showPieceNumber) {
    cmds.push(`TEXT 10,35,"2",0,1,1,"${pieceNumber}/${totalPieces}"`);
  }

  if (cfg.showBarcode) {
    cmds.push(`BARCODE 10,55,"128",50,1,0,2,2,"${item.number}"`);
  }

  if (cfg.encodeRfid) {
    cmds.push(`RFID "EPC","W",1,"24","${epc}"`);
  }

  cmds.push("PRINT 1");
  return cmds.join("\r\n");
}

function buildZpl(item, pieceNumber, totalPieces, cfg, isFirst) {
  const dpm = Math.round(cfg.dpi / 25.4);
  const epc = buildEpc(item.number, pieceNumber);
  const pw = Math.round(cfg.labelWidth * dpm);
  const ll = Math.round(cfg.labelHeight * dpm);
  const modeCmd = cfg.printMode === "TT" ? "^MMT" : "^MMD";
  const mediaCmd = `^MN${cfg.mediaType}`;
  const cmds = [];

  if (isFirst) {
    cmds.push("~JC");
  }

  cmds.push(
    "^XA",
    modeCmd,
    mediaCmd,
    `^PW${pw}`,
    `^LL${ll}`,
    `~SD${String(cfg.darkness).padStart(2, "0")}`,
    `^PR${cfg.printSpeed}`,
  );

  cmds.push(`^CF0,${cfg.fontSize}`);
  cmds.push(`^FO10,10^FD${item.number}^FS`);

  if (cfg.showPieceNumber) {
    const smallFont = Math.max(Math.round(cfg.fontSize * 0.7), 14);
    cmds.push(`^CF0,${smallFont}`);
    cmds.push(`^FO10,${10 + cfg.fontSize + 4}^FD${pieceNumber}/${totalPieces}^FS`);
  }

  if (cfg.showBarcode) {
    const barcodeY = 10 + cfg.fontSize + (cfg.showPieceNumber ? cfg.fontSize + 8 : 4);
    const barcodeH = Math.max(ll - barcodeY - 10, 20);
    cmds.push(`^FO10,${barcodeY}^BY1^BCN,${barcodeH},N,N,N^FD${item.number}^FS`);
  }

  if (cfg.encodeRfid) {
    cmds.push(`^RFW,H^FD${epc}^FS`);
  }

  cmds.push("^XZ");
  return cmds.join("\n");
}

function buildLabel(item, pieceNumber, totalPieces, cfg, isFirst) {
  if (cfg.printerLanguage === "TSPL") {
    return buildTspl(item, pieceNumber, totalPieces, cfg, isFirst);
  }
  return buildZpl(item, pieceNumber, totalPieces, cfg, isFirst);
}

export async function printRfidLabels(printerName, item, quantity) {
  await connectPrinter();
  const cfg = getPrinterConfig();

  const printer = printerName
    ? await qz.printers.find(printerName)
    : await qz.printers.getDefault();

  const commands = [];
  for (let i = 1; i <= quantity; i++) {
    commands.push(buildLabel(item, i, quantity, cfg, i === 1));
  }

  const config = qz.configs.create(printer, { copies: 1 });
  await qz.print(config, commands);
}

export async function printTestLabel(printerName) {
  await connectPrinter();
  const cfg = getPrinterConfig();

  const printer = printerName
    ? await qz.printers.find(printerName)
    : await qz.printers.getDefault();

  const testItem = { number: "TEST-001" };
  const cmd = buildLabel(testItem, 1, 1, cfg, true);

  const config = qz.configs.create(printer, { copies: 1 });
  await qz.print(config, [cmd]);
}

import { NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { PrinterService, PrintService } from "@/lib/chainWay/server";

/* ── helpers matching ZPL layout ── */
function getShortItemNumber(fullNumber) {
  if (!fullNumber) return fullNumber;
  const parts = fullNumber.split("-");
  if (parts.length >= 3) return parts.slice(-2).join("-");
  return fullNumber;
}

/* ── preview — matches ZPL buildThaiRFIDLabel layout ── */
function renderPreview(item, quantity) {
  // Label: 73mm x 21mm (same ratio as LABEL_SIZES.RFID)
  const PREVIEW_WIDTH = 600;
  const ratio = 21 / 73;
  const previewH = Math.round(PREVIEW_WIDTH * ratio);
  const s = PREVIEW_WIDTH / 73;

  const mx = Math.round(4 * s);
  const my = Math.round(2 * s);
  const usableW = PREVIEW_WIDTH - mx * 2;

  const retina = 2;
  const canvas = createCanvas(PREVIEW_WIDTH * retina, previewH * retina);
  const ctx = canvas.getContext("2d");
  ctx.scale(retina, retina);

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, previewH);
  ctx.strokeStyle = "#BBBBBB";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, PREVIEW_WIDTH - 1, previewH - 1);

  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";

  // Row 1: Short item number (left) + sequence (right) — matches ZPL row1
  const shortNumber = getShortItemNumber(item.number);
  const fItem = Math.round(3.5 * s);
  ctx.font = `bold ${fItem}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  ctx.fillText(shortNumber, mx, my);

  const seqText = `1/${quantity}`;
  const fSeq = Math.round(2.6 * s);
  ctx.font = `bold ${fSeq}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  const seqW = ctx.measureText(seqText).width;
  ctx.fillText(seqText, PREVIEW_WIDTH - seqW - mx, my);

  // Row 2: Project name (bold, centered) — matches ZPL row2
  const row2Y = my + Math.round(8 * s);
  const fProject = Math.round(2.8 * s);
  const projectText = item.projectName || "-";
  ctx.font = `bold ${fProject}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  const projectW = ctx.measureText(projectText).width;
  const projectX = Math.max(mx, Math.round((PREVIEW_WIDTH - projectW) / 2));
  ctx.fillText(projectText, projectX, row2Y);

  // Row 3: Display name in Thai (bold, centered) — matches ZPL row3
  const row3Y = my + Math.round(13 * s);
  const fName = Math.round(2.4 * s);
  if (item.displayName) {
    ctx.font = `bold ${fName}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
    const nameW = ctx.measureText(item.displayName).width;
    const nameX = Math.max(mx, Math.round((PREVIEW_WIDTH - nameW) / 2));
    ctx.fillText(item.displayName, nameX, row3Y, usableW);
  }

  return canvas.toBuffer("image/png").toString("base64");
}

/* ── API route ── */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action = "print", item, quantity = 1, config = {} } = body;

    if (action === "testConnection") {
      const result = await PrinterService.testConnection();
      return NextResponse.json({ success: result.success, data: result });
    }

    if (action === "calibrateRfid") {
      const result = await PrinterService.calibrate();
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "cancelAll") {
      const result = await PrinterService.cancelAll();
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "reset") {
      const result = await PrinterService.reset();
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "fullReset") {
      const result = await PrinterService.fullReset();
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "status") {
      const result = await PrinterService.getStatus();
      return NextResponse.json({ success: true, data: result });
    }

    if (!item?.number) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุเลขที่สินค้า" },
        { status: 400 },
      );
    }

    if (action === "preview") {
      const preview = renderPreview(item, quantity);
      return NextResponse.json({ success: true, preview });
    }

    const enableRFID = config.encodeRfid === true;

    const result = await PrintService.printBatch([item], { quantity, enableRFID });

    return NextResponse.json({
      success: result.success,
      data: result,
      quantity,
      rfidEnabled: enableRFID,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

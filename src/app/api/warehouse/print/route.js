import { NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { PrinterService, PrintService } from "@/lib/chainWay/server";

/* ── preview ── */
function renderPreview(item, quantity) {
  const PREVIEW_WIDTH = 600;
  const ratio = 21 / 73;
  const previewH = Math.round(PREVIEW_WIDTH * ratio);
  const s = PREVIEW_WIDTH / 73;

  const mx = Math.round(2 * s);
  const my = Math.round(2 * s);
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

  ctx.font = `bold ${fTitle}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  ctx.fillText(item.number, mx, my);

  const seqText = `1/${quantity}`;
  ctx.font = `bold ${fSeq}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  const seqW = ctx.measureText(seqText).width;
  ctx.fillText(seqText, PREVIEW_WIDTH - seqW - mx, my);

  if (item.displayName) {
    const nameY = my + fTitle + Math.round(1.5 * s);
    ctx.font = `${fName}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
    ctx.fillText(item.displayName, mx, nameY, PREVIEW_WIDTH - mx * 2);
  }

  ctx.fillStyle = "#999999";
  const rfidFs = Math.round(1.4 * s);
  ctx.font = `italic ${rfidFs}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  ctx.fillText("RFID", mx, previewH - rfidFs - my);

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
        { success: false, error: "Item number is required" },
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

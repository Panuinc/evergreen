import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { RFIDPrinter } from "@/lib/chainWay/printer";
import { buildThaiRFIDLabels } from "@/lib/chainWay/zpl";
import { PRINTER_CONFIG } from "@/lib/chainWay/config";

// BcItem fields sent from the frontend
interface BcItem {
  bcItemNo: string;
  bcItemDescription: string;
  bcItemRfidCode?: string | null;
  projectName?: string | null;
  [key: string]: unknown;
}

function getShortItemNumber(fullNumber: string): string {
  const parts = fullNumber.split("-");
  return parts.length >= 3 ? parts.slice(2).join("-") : fullNumber;
}

function renderPreview(item: BcItem, quantity: number): string {
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

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, previewH);
  ctx.strokeStyle = "#BBBBBB";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, PREVIEW_WIDTH - 1, previewH - 1);
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";

  const shortNumber = getShortItemNumber(item.bcItemNo);
  const fItem = Math.round(3.5 * s);
  ctx.font = `bold ${fItem}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  ctx.fillText(shortNumber, mx, my);

  const seqText = `1/${quantity}`;
  const fSeq = Math.round(2.6 * s);
  ctx.font = `bold ${fSeq}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  const seqW = ctx.measureText(seqText).width;
  ctx.fillText(seqText, PREVIEW_WIDTH - seqW - mx, my);

  const row2Y = my + Math.round(8 * s);
  const projectText = item.projectName || "-";
  const fProject = Math.round(2.8 * s);
  ctx.font = `bold ${fProject}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
  const projectW = ctx.measureText(projectText).width;
  const projectX = Math.max(mx, Math.round((PREVIEW_WIDTH - projectW) / 2));
  ctx.fillText(projectText, projectX, row2Y);

  const row3Y = my + Math.round(13 * s);
  const fName = Math.round(2.4 * s);
  if (item.bcItemDescription) {
    ctx.font = `bold ${fName}px Arial, Tahoma, "Noto Sans Thai", sans-serif`;
    const nameW = ctx.measureText(item.bcItemDescription).width;
    const nameX = Math.max(mx, Math.round((PREVIEW_WIDTH - nameW) / 2));
    ctx.fillText(item.bcItemDescription, nameX, row3Y, usableW);
  }

  return canvas.toBuffer("image/png").toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      action?: string;
      item?: BcItem;
      quantity?: number;
      config?: { host?: string; port?: number; encodeRfid?: boolean };
    };

    const { action = "print", item, quantity = 1, config = {} } = body;

    const printerConfig = {
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    };

    if (action === "testConnection") {
      const printer = new RFIDPrinter(printerConfig);
      try {
        const result = await printer.testConnection();
        return NextResponse.json({ success: result.success, data: result });
      } finally {
        printer.closeAllConnections();
      }
    }

    if (action === "calibrateRfid") {
      const printer = new RFIDPrinter(printerConfig);
      try {
        const result = await printer.calibrate();
        return NextResponse.json({ success: true, data: result });
      } finally {
        printer.closeAllConnections();
      }
    }

    if (action === "cancelAll") {
      const printer = new RFIDPrinter(printerConfig);
      try {
        const result = await printer.cancelAll();
        return NextResponse.json({ success: true, data: result });
      } finally {
        printer.closeAllConnections();
      }
    }

    if (action === "reset") {
      const printer = new RFIDPrinter(printerConfig);
      try {
        const result = await printer.reset();
        return NextResponse.json({ success: true, data: result });
      } finally {
        printer.closeAllConnections();
      }
    }

    if (action === "fullReset") {
      const printer = new RFIDPrinter(printerConfig);
      try {
        const result = await printer.fullReset();
        return NextResponse.json({ success: true, data: result });
      } finally {
        printer.closeAllConnections();
      }
    }

    if (action === "status") {
      const printer = new RFIDPrinter(printerConfig);
      try {
        const result = await printer.getStatus();
        return NextResponse.json({ success: true, data: result });
      } finally {
        printer.closeAllConnections();
      }
    }

    if (!item?.bcItemNo) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุเลขที่สินค้า" },
        { status: 400 },
      );
    }

    if (action === "preview") {
      const preview = renderPreview(item, quantity);
      return NextResponse.json({ success: true, preview });
    }

    // action === "print"
    const enableRFID = config.encodeRfid === true;

    const labels = await buildThaiRFIDLabels({
      itemNumber: item.bcItemNo,
      rfidCode: item.bcItemRfidCode ?? null,
      displayName: item.bcItemDescription || item.bcItemNo,
      projectName: item.projectName ?? null,
      quantity,
      enableRFID,
    });

    const printer = new RFIDPrinter(printerConfig);
    let successCount = 0;
    let failCount = 0;
    const labelResults: unknown[] = [];

    try {
      for (const label of labels) {
        try {
          const result = await printer.sendWithRetry(label.zpl);
          if (result.success) {
            successCount++;
            labelResults.push({ success: true, sequenceNumber: label.sequenceNumber, epc: label.epc });
          } else {
            failCount++;
            labelResults.push({ success: false, sequenceNumber: label.sequenceNumber, error: result.error });
          }
        } catch (err) {
          failCount++;
          labelResults.push({ success: false, sequenceNumber: label.sequenceNumber, error: (err as Error).message });
        }
      }
    } finally {
      printer.closeAllConnections();
    }

    return NextResponse.json({
      success: failCount === 0,
      quantity,
      rfidEnabled: enableRFID,
      summary: { total: labels.length, success: successCount, failed: failCount },
      labels: labelResults,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

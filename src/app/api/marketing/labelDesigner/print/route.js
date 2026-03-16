import { NextResponse } from "next/server";
import net from "net";
import { createCanvas, loadImage } from "canvas";
import { SHIPPING_PRINTER_CONFIG } from "@/lib/chainWay/config";

function sendToTSC(buffer, config = {}) {
  const host = config.host || SHIPPING_PRINTER_CONFIG.host;
  const port = config.port || SHIPPING_PRINTER_CONFIG.port;
  const timeout = config.timeout || SHIPPING_PRINTER_CONFIG.timeout;

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setKeepAlive(false);
    socket.setNoDelay(true);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try { socket.destroy(); } catch {}
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({ success: true, message: "Sent (timeout)" });
    }, timeout);

    socket.connect(port, host, () => {
      socket.write(buffer, (err) => {
        if (err) {
          clearTimeout(timer);
          cleanup();
          reject(new Error(`Send failed: ${err.message}`));
          return;
        }
        setTimeout(() => {
          clearTimeout(timer);
          cleanup();
          resolve({ success: true, message: "Sent successfully" });
        }, 500);
      });
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      cleanup();
      reject(new Error(`Connection error: ${err.message}`));
    });
  });
}

async function sendWithRetry(buffer, config = {}) {
  const retries = config.retries || SHIPPING_PRINTER_CONFIG.retries;
  const retryDelay = config.retryDelay || SHIPPING_PRINTER_CONFIG.retryDelay;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await sendToTSC(buffer, config);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelay * attempt));
      }
    }
  }
  throw lastError;
}

async function imageToTSPL(base64Png, labelWidth, labelHeight, gap = 3) {
  const imgBuffer = Buffer.from(base64Png, "base64");
  const img = await loadImage(imgBuffer);

  // 203 DPI = 8 dots/mm
  const dotsPerMm = 203 / 25.4;
  const targetW = Math.round(labelWidth * dotsPerMm);
  const targetH = Math.round(labelHeight * dotsPerMm);

  const canvas = createCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const { data, width, height } = ctx.getImageData(0, 0, targetW, targetH);
  const bytesPerRow = Math.ceil(width / 8);
  const bitmapData = Buffer.alloc(bytesPerRow * height, 0xff);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const avg =
        (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
      if (avg < 128) {
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        bitmapData[byteIndex] &= ~(1 << (7 - (x % 8)));
      }
    }
  }

  const header = Buffer.from(
    `SIZE ${labelWidth} mm,${labelHeight} mm\r\n` +
      `GAP ${gap} mm,0\r\n` +
      `SPEED 4\r\n` +
      `DENSITY 8\r\n` +
      `DIRECTION 1\r\n` +
      `CLS\r\n` +
      `BITMAP 0,0,${bytesPerRow},${height},0,`,
  );
  const footer = Buffer.from(`\r\nPRINT 1,1\r\n`);

  return Buffer.concat([header, bitmapData, footer]);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      images,
      labelWidth = 100,
      labelHeight = 30,
      gap = 3,
      printerConfig,
    } = body;

    if (!images?.length) {
      return NextResponse.json(
        { success: false, error: "ไม่มีข้อมูลภาพสำหรับพิมพ์" },
        { status: 400 },
      );
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < images.length; i++) {
      try {
        const tsplBuffer = await imageToTSPL(
          images[i],
          labelWidth,
          labelHeight,
          gap,
        );
        const result = await sendWithRetry(tsplBuffer, printerConfig || {});
        if (result.success) {
          successCount++;
          results.push({ success: true, label: i + 1 });
        } else {
          failCount++;
          results.push({ success: false, label: i + 1, error: result.error });
        }
      } catch (err) {
        failCount++;
        results.push({ success: false, label: i + 1, error: err.message });
      }

      if (i < images.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return NextResponse.json({
      success: failCount === 0,
      data: {
        results,
        summary: {
          total: images.length,
          success: successCount,
          failed: failCount,
        },
      },
    });
  } catch (error) {
    console.error("[label-designer-print]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

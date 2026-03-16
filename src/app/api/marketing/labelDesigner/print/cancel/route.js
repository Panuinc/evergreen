import { NextResponse } from "next/server";
import net from "net";
import { SHIPPING_PRINTER_CONFIG } from "@/lib/chainWay/config";
import { activePrintJobs } from "../jobStore";

function sendCommand(command, config = {}) {
  const host = config.host || SHIPPING_PRINTER_CONFIG.host;
  const port = config.port || SHIPPING_PRINTER_CONFIG.port;

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setKeepAlive(false);
    socket.setNoDelay(true);

    const timer = setTimeout(() => {
      try { socket.destroy(); } catch {}
      resolve({ success: true, message: "Sent (timeout)" });
    }, 3000);

    socket.connect(port, host, () => {
      socket.write(command, (err) => {
        clearTimeout(timer);
        try { socket.destroy(); } catch {}
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, message: "Command sent" });
        }
      });
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      try { socket.destroy(); } catch {}
      resolve({ success: false, error: err.message });
    });
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { jobId, printerConfig } = body;

    // Mark the job as cancelled so the print loop stops
    if (jobId && activePrintJobs.has(jobId)) {
      activePrintJobs.get(jobId).cancelled = true;
    }

    // Send cancel commands to the printer (TSPL commands for TSC printers)
    // CANCEL command stops current print job
    await sendCommand("\x1B!C\r\n", printerConfig || {});
    // Also try ZPL cancel in case printer supports it
    await sendCommand("~JA", printerConfig || {});

    return NextResponse.json({
      success: true,
      message: "ยกเลิกงานพิมพ์แล้ว",
    });
  } catch (error) {
    console.error("[label-designer-cancel]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

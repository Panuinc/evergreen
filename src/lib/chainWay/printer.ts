import net from "net";
import { PRINTER_CONFIG, TIMEOUTS } from "./config";
import { PrinterCommands } from "./zpl";
import { delay } from "./utils";

interface PrinterConfig {
  host: string;
  port: number;
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface SendResult {
  success: boolean;
  message: string;
  response?: string | null;
  error?: string;
}

interface StatusResult {
  online: boolean;
  raw?: string;
  parsed?: {
    raw: string;
    hasError: boolean;
    isPaused: boolean;
    paperOut: boolean;
    ribbonOut: boolean;
  };
  error?: string;
}

export class RFIDPrinter {
  private config: PrinterConfig;
  private activeConnections: Set<net.Socket>;

  constructor(config: Partial<PrinterConfig> = {}) {
    this.config = { ...PRINTER_CONFIG, ...config };
    this.activeConnections = new Set();
  }

  private createSocket(): net.Socket {
    const socket = new net.Socket();
    socket.setKeepAlive(false);
    socket.setNoDelay(true);
    this.activeConnections.add(socket);
    socket.on("close", () => this.activeConnections.delete(socket));
    return socket;
  }

  private safeCloseSocket(socket: net.Socket | null): void {
    if (!socket) return;
    try {
      socket.removeAllListeners();
      if (!socket.destroyed) socket.destroy();
    } catch (e) {
      console.error("[rfid-printer] Socket close error:", (e as Error).message);
    }
    this.activeConnections.delete(socket);
  }

  closeAllConnections(): void {
    for (const socket of this.activeConnections) {
      this.safeCloseSocket(socket);
    }
    this.activeConnections.clear();
  }

  async testConnection(): Promise<SendResult> {
    return new Promise((resolve) => {
      const socket = this.createSocket();
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          this.safeCloseSocket(socket);
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve({ success: false, message: "Connection timeout", error: "Connection timeout" });
      }, TIMEOUTS.connection);

      socket.connect(this.config.port, this.config.host, () => {
        clearTimeout(timeout);
        cleanup();
        resolve({ success: true, message: `Connected to ${this.config.host}:${this.config.port}` });
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        cleanup();
        resolve({ success: false, message: err.message, error: err.message });
      });
    });
  }

  async send(zplCommand: string, options: { waitForResponse?: boolean; timeout?: number } = {}): Promise<SendResult> {
    const { waitForResponse = false, timeout = this.config.timeout } = options;

    return new Promise((resolve, reject) => {
      const socket = this.createSocket();
      let responseData = "";
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          this.safeCloseSocket(socket);
        }
      };

      const timeoutHandle = setTimeout(() => {
        cleanup();
        resolve({ success: true, message: "Sent (timeout)", response: responseData || null });
      }, timeout);

      socket.connect(this.config.port, this.config.host, () => {
        socket.write(zplCommand, "utf8", (err) => {
          if (err) {
            clearTimeout(timeoutHandle);
            cleanup();
            reject(new Error(`Send failed: ${err.message}`));
            return;
          }
          if (!waitForResponse) {
            setTimeout(() => {
              clearTimeout(timeoutHandle);
              cleanup();
              resolve({ success: true, message: "Sent successfully" });
            }, 300);
          }
        });
      });

      socket.on("data", (data) => {
        responseData += data.toString();
        if (waitForResponse && !resolved) {
          setTimeout(() => {
            if (!resolved) {
              clearTimeout(timeoutHandle);
              cleanup();
              resolve({ success: true, message: "Done", response: responseData });
            }
          }, 200);
        }
      });

      socket.on("error", (err) => {
        clearTimeout(timeoutHandle);
        cleanup();
        reject(new Error(`Connection error: ${err.message}`));
      });

      socket.on("close", () => {
        clearTimeout(timeoutHandle);
        if (!resolved) {
          resolved = true;
          resolve({ success: true, message: "Connection closed", response: responseData || null });
        }
      });
    });
  }

  async sendWithRetry(zplCommand: string, options: { waitForResponse?: boolean } = {}): Promise<SendResult> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await this.send(zplCommand, options);
      } catch (error) {
        lastError = error as Error;
        console.warn("[rfid-printer] send attempt failed", { attempt, error: lastError.message });
        if (attempt < this.config.retries) {
          await delay(this.config.retryDelay * attempt);
        }
      }
    }
    throw lastError;
  }

  async getStatus(): Promise<StatusResult> {
    try {
      const result = await this.send(PrinterCommands.HOST_STATUS, {
        waitForResponse: true,
        timeout: TIMEOUTS.connection,
      });
      return {
        online: true,
        raw: result.response ?? undefined,
        parsed: this.parseStatusResponse(result.response ?? ""),
      };
    } catch (error) {
      return { online: false, error: (error as Error).message };
    }
  }

  private parseStatusResponse(response: string) {
    return {
      raw: response,
      hasError: response.includes("ERROR") || response.includes("FAULT"),
      isPaused: response.includes("PAUSED"),
      paperOut: response.includes("PAPER OUT") || response.includes("MEDIA OUT"),
      ribbonOut: response.includes("RIBBON OUT"),
    };
  }

  async calibrate(): Promise<SendResult> {
    return this.sendWithRetry(PrinterCommands.CALIBRATE_MEDIA);
  }

  async cancelAll(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await this.send(PrinterCommands.CANCEL_ALL, { timeout: 3000 });
      await delay(200);
      await this.send(PrinterCommands.CANCEL_CURRENT, { timeout: 3000 });
      await delay(200);
      await this.send(PrinterCommands.CLEAR_BUFFER, { timeout: 3000 });
      await delay(200);
      return { success: true, message: "All jobs cancelled and buffer cleared" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async reset(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await this.cancelAll();
      await delay(500);
      await this.send(PrinterCommands.RESET_PRINTER, { timeout: 5000 });
      await delay(2000);
      return { success: true, message: "Printer reset initiated" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async fullReset(): Promise<{ success: boolean; message?: string; connectionTest?: SendResult; error?: string }> {
    try {
      this.closeAllConnections();
      await delay(500);
      try { await this.send(PrinterCommands.CANCEL_ALL, { timeout: 3000 }); } catch { /* ignore */ }
      await delay(300);
      try { await this.send(PrinterCommands.CLEAR_BUFFER, { timeout: 3000 }); } catch { /* ignore */ }
      await delay(300);
      try { await this.send(PrinterCommands.POWER_ON_RESET, { timeout: 5000 }); } catch { /* ignore */ }
      await delay(3000);
      const testResult = await this.testConnection();
      return {
        success: testResult.success,
        message: testResult.success ? "Full reset completed" : "Reset sent but connection test failed",
        connectionTest: testResult,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

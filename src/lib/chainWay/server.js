import { PRINTER_CONFIG, TIMEOUTS, LABEL_SIZES } from "./config.js";
import { delay } from "./utils.js";
import { EPCService } from "./epc.js";
import { RFIDPrinter } from "./printer.js";
import { buildThaiRFIDLabels } from "./zpl.js";

export { PRINTER_CONFIG, TIMEOUTS } from "./config.js";

export { RFIDPrinter } from "./printer.js";

export const PrinterService = {
  async testConnection(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.testConnection();
    } finally {
      printer.closeAllConnections();
    }
  },

  async getStatus(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.getStatus();
    } finally {
      printer.closeAllConnections();
    }
  },

  async calibrate(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.calibrate();
    } finally {
      printer.closeAllConnections();
    }
  },

  async reset(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.reset();
    } finally {
      printer.closeAllConnections();
    }
  },

  async fullReset(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.fullReset();
    } finally {
      printer.closeAllConnections();
    }
  },

  async cancelAll(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.cancelAll();
    } finally {
      printer.closeAllConnections();
    }
  },

  async feedLabel(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.feedLabel();
    } finally {
      printer.closeAllConnections();
    }
  },

  async pause(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.pause();
    } finally {
      printer.closeAllConnections();
    }
  },

  async resume(config = {}) {
    const printer = new RFIDPrinter({
      host: config.host || PRINTER_CONFIG.host,
      port: config.port || PRINTER_CONFIG.port,
    });
    try {
      return await printer.resume();
    } finally {
      printer.closeAllConnections();
    }
  },
};

export const PrintService = {
  async generateRFIDLabels(item, quantity, options = {}) {
    const { labelSize = LABEL_SIZES.RFID, enableRFID = true } = options;

    const labels = await buildThaiRFIDLabels({
      itemNumber: item.number,
      displayName: item.displayName || item.number,
      displayName2: item.displayName2 || "",
      quantity,
      labelSize,
      enableRFID,
    });

    return labels.map((label) => ({
      ...label,
      type: "thai-rfid",
      item: {
        ...item,
        epc: label.epc,
      },
      epcParsed: EPCService.parse(label.epc),
    }));
  },

  async preview(item, options = {}) {
    const { quantity = 1 } = options;

    const labels = await this.generateRFIDLabels(item, quantity, options);
    return {
      labels,
      type: "thai-rfid",
      item,
      quantity,
      enableRFID: true,
    };
  },

  async printBatch(items, options = {}) {
    const { delay: printDelay = 100, quantity = 1, ...labelOptions } = options;

    const results = [];
    let successCount = 0;
    let failCount = 0;

    const printer = new RFIDPrinter();

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const itemQuantity =
          options.useInventory && item.inventory > 0
            ? item.inventory
            : quantity;

        try {
          const labels = await this.generateRFIDLabels(
            item,
            itemQuantity,
            labelOptions,
          );

          let itemSuccess = true;
          const labelResults = [];

          for (let j = 0; j < labels.length; j++) {
            const label = labels[j];

            try {
              const result = await printer.sendWithRetry(label.zpl);

              if (result.success) {
                labelResults.push({
                  success: true,
                  sequenceNumber: label.sequenceNumber,
                  sequenceText: label.sequenceText,
                  epc: label.epc,
                });
              } else {
                itemSuccess = false;
                labelResults.push({
                  success: false,
                  sequenceNumber: label.sequenceNumber,
                  error: result.error || "Send failed",
                });
              }
            } catch (labelError) {
              itemSuccess = false;
              labelResults.push({
                success: false,
                sequenceNumber: label.sequenceNumber,
                error: labelError.message,
              });
            }

            if (j < labels.length - 1 && printDelay > 0) {
              await delay(printDelay);
            }
          }

          if (itemSuccess) {
            successCount++;
          } else {
            failCount++;
          }

          results.push({
            success: itemSuccess,
            item: { ...item, epc: labels[0]?.epc },
            type: "thai-rfid",
            quantity: itemQuantity,
            labels: labelResults,
          });
        } catch (error) {
          failCount++;
          results.push({ success: false, item, error: error.message });
        }

        if (i < items.length - 1 && printDelay > 0) {
          await delay(printDelay);
        }
      }

      return {
        success: failCount === 0,
        results,
        summary: {
          total: items.length,
          success: successCount,
          failed: failCount,
        },
      };
    } finally {
      printer.closeAllConnections();
    }
  },
};

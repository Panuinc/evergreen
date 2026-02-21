export const PRINTER_CONFIG = {
  host: process.env.RFID_PRINTER_IP || "192.168.1.43",
  port: parseInt(process.env.RFID_PRINTER_PORT || "9100", 10),
  timeout: 15000,
  retries: 3,
  retryDelay: 1000,
};

export const COMPANY_INFO = {
  name: "บริษัท ชื้ออะฮวด อุตสาหกรรม จำกัด",
  address1: "9/1 หมู่ 2 ถนนบางเลน-ลาดหลุมแก้ว",
  address2: "ต.ขุนศรี อ.ไทรน้อย จ.นนทบุรี 11150",
  phone: "02-921-9979,062-539-9980",
  get address() {
    return this.address1;
  },
  get district() {
    return this.address2;
  },
};

export const ZPL_CONFIG = {
  dotsPerMm: 11.8,
  padding: { top: 2, bottom: 5, left: 5, right: 5 },
};

export const LABEL_SIZES = {
  STANDARD: {
    width: 100,
    height: 30,
  },
  RFID: {
    width: 73,
    height: 21,
  },
  PACKING_SLIP: {
    width: 100,
    height: 150,
  },
};

export const PACKING_SLIP_LABEL = {
  WIDTH_MM: LABEL_SIZES.PACKING_SLIP.width,
  HEIGHT_MM: LABEL_SIZES.PACKING_SLIP.height,
  get WIDTH_DOTS() {
    return Math.round(this.WIDTH_MM * ZPL_CONFIG.dotsPerMm);
  },
  get HEIGHT_DOTS() {
    return Math.round(this.HEIGHT_MM * ZPL_CONFIG.dotsPerMm);
  },
  get MARGIN() {
    return Math.round(2 * ZPL_CONFIG.dotsPerMm);
  },
};

export const PRINT_TYPES = {
  "thai-rfid": {
    key: "thai-rfid",
    name: "TAG UHF",
    label: "TAG UHF",
    hasRFID: true,
  },
};

export const PRINT_TYPE_OPTIONS = Object.values(PRINT_TYPES);

export const TIMEOUTS = {
  print: 30000,
  connection: 5000,
  status: 10000,
  action: 15000,
  healthCheck: 5000,
  command: 30000,
};

export const STATUS_COLORS = {
  connected: "success",
  disconnected: "danger",
  checking: "warning",
  error: "danger",
  Active: "success",
  Blocked: "danger",
};

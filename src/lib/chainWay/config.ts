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
};

export const ZPL_CONFIG = {
  dotsPerMm: 11.8,
};

export const LABEL_SIZES = {
  RFID: { width: 73, height: 21 },
};

export const TIMEOUTS = {
  print: 30000,
  connection: 5000,
  status: 10000,
  command: 30000,
};

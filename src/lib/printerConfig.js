const STORAGE_KEY = "cp30-printer-config";

const DEFAULT_CONFIG = {
  dpi: 300,
  labelWidth: 73,
  labelHeight: 21,
  labelShift: 7,
  printSpeed: 4,
  darkness: 20,
  fontSize: 40,
  showBarcode: false,
  showPieceNumber: true,
  encodeRfid: false,
};

export function getPrinterConfig() {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
}

export function savePrinterConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

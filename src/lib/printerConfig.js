const STORAGE_KEY = "cp30-printer-config";

const DEFAULT_CONFIG = {
  printerName: "",
  printerLanguage: "TSPL",
  printMode: "DT",
  dpi: 300,
  labelWidth: 75,
  labelHeight: 20,
  printSpeed: 4,
  darkness: 15,
  mediaType: "W",
  fontSize: 28,
  showBarcode: true,
  showPieceNumber: true,
  encodeRfid: true,
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

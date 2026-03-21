const storageKey = "cp30-printer-config";

const defaultConfig = {
  dpi: 300,
  labelWidth: 73,
  labelHeight: 21,
  labelShift: 7,
  printSpeed: 4,
  darkness: 20,
  fontSize: 40,
  showBarcode: false,
  showPieceNumber: true,
  encodeRfid: true,
};

export function getPrinterConfig() {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
  } catch {}
  return defaultConfig;
}

export function savePrinterConfig(config) {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

export function getDefaultConfig() {
  return { ...defaultConfig };
}

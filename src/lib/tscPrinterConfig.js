const STORAGE_KEY = "tsc-te-printer-config";

const DEFAULT_CONFIG = {
  host: "192.168.1.117",
  port: 9100,
  dpi: 203,
  labelWidth: 100,
  labelHeight: 30,
  printSpeed: 4,
  darkness: 8,
  fontSize: 30,
};

export function getTscPrinterConfig() {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveTscPrinterConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getTscDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

export const KPI_CATEGORIES = [
  { key: "general", label: "ทั่วไป" },
  { key: "sales", label: "การขาย" },
  { key: "operations", label: "ปฏิบัติการ" },
  { key: "quality", label: "คุณภาพ" },
  { key: "finance", label: "การเงิน" },
  { key: "hr", label: "ทรัพยากรบุคคล" },
];

export const KPI_FREQUENCIES = [
  { key: "daily", label: "รายวัน" },
  { key: "weekly", label: "รายสัปดาห์" },
  { key: "monthly", label: "รายเดือน" },
  { key: "quarterly", label: "รายไตรมาส" },
  { key: "yearly", label: "รายปี" },
];

export const KPI_UNITS = [
  { key: "ชิ้น", label: "ชิ้น" },
  { key: "%", label: "%" },
  { key: "บาท", label: "บาท" },
  { key: "ครั้ง", label: "ครั้ง" },
  { key: "วัน", label: "วัน" },
  { key: "ราย", label: "ราย" },
  { key: "คะแนน", label: "คะแนน" },
];

export function computeKpiStatus(actualValue, targetValue, warningThreshold, criticalThreshold, higherIsBetter) {
  if (actualValue == null) return "none";

  if (higherIsBetter) {
    if (actualValue >= targetValue) return "success";
    if (warningThreshold != null && actualValue >= warningThreshold) return "warning";
    return "danger";
  } else {
    if (actualValue <= targetValue) return "success";
    if (warningThreshold != null && actualValue <= warningThreshold) return "warning";
    return "danger";
  }
}

export function getKpiStatusLabel(status) {
  switch (status) {
    case "success": return "ตามเป้า";
    case "warning": return "ใกล้เป้า";
    case "danger": return "ต่ำกว่าเป้า";
    default: return "ยังไม่มีข้อมูล";
  }
}

export function getKpiStatusColor(status) {
  switch (status) {
    case "success": return "success";
    case "warning": return "warning";
    case "danger": return "danger";
    default: return "default";
  }
}

export function computeKpiProgress(actualValue, targetValue, higherIsBetter) {
  if (!targetValue || targetValue === 0) return 0;
  if (higherIsBetter) {
    return Math.min(Math.round((actualValue / targetValue) * 100), 100);
  }
  // For lower-is-better: invert the ratio
  if (actualValue === 0) return 100;
  return Math.min(Math.round((targetValue / actualValue) * 100), 100);
}

export function getCategoryLabel(key) {
  return KPI_CATEGORIES.find((c) => c.key === key)?.label || key;
}

export function getFrequencyLabel(key) {
  return KPI_FREQUENCIES.find((f) => f.key === key)?.label || key;
}

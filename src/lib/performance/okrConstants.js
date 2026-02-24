export const OKR_STATUSES = [
  { key: "draft", label: "ร่าง", color: "default" },
  { key: "active", label: "ดำเนินการ", color: "primary" },
  { key: "completed", label: "สำเร็จ", color: "success" },
  { key: "cancelled", label: "ยกเลิก", color: "danger" },
];

export const KR_STATUSES = [
  { key: "on_track", label: "ตามเป้า", color: "success" },
  { key: "at_risk", label: "เสี่ยง", color: "warning" },
  { key: "behind", label: "ล่าช้า", color: "danger" },
  { key: "completed", label: "สำเร็จ", color: "success" },
];

export const METRIC_TYPES = [
  { key: "number", label: "จำนวน" },
  { key: "percentage", label: "เปอร์เซ็นต์" },
  { key: "currency", label: "จำนวนเงิน" },
  { key: "boolean", label: "สำเร็จ/ไม่สำเร็จ" },
];

export const VISIBILITY_OPTIONS = [
  { key: "personal", label: "ส่วนตัว" },
  { key: "team", label: "ทีม" },
  { key: "company", label: "บริษัท" },
];

export const QUARTER_OPTIONS = [
  { key: "1", label: "Q1 (ม.ค.-มี.ค.)" },
  { key: "2", label: "Q2 (เม.ย.-มิ.ย.)" },
  { key: "3", label: "Q3 (ก.ค.-ก.ย.)" },
  { key: "4", label: "Q4 (ต.ค.-ธ.ค.)" },
];

export function getStatusConfig(statusKey, list) {
  return list.find((s) => s.key === statusKey) || list[0];
}

export function computeKrProgress(kr) {
  if (kr.metricType === "boolean") {
    return kr.currentValue >= 1 ? 100 : 0;
  }
  const range = kr.targetValue - kr.startValue;
  if (range === 0) return kr.currentValue >= kr.targetValue ? 100 : 0;
  const progress = ((kr.currentValue - kr.startValue) / range) * 100;
  return Math.min(Math.max(Math.round(progress * 100) / 100, 0), 100);
}

export function computeObjectiveProgress(keyResults) {
  if (!keyResults || keyResults.length === 0) return 0;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const kr of keyResults) {
    const w = kr.weight || 1;
    weightedSum += computeKrProgress(kr) * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

export function autoKrStatus(kr) {
  const progress = computeKrProgress(kr);
  if (progress >= 100) return "completed";
  if (progress >= 70) return "on_track";
  if (progress >= 40) return "at_risk";
  return "behind";
}

import { computeGrade, getGradeColor } from "./evaluationCriteria";

export { computeGrade, getGradeColor };

export const RELATIONSHIP_TYPES = [
  { key: "self", label: "ประเมินตนเอง", labelShort: "ตนเอง", color: "#8b5cf6" },
  { key: "supervisor", label: "หัวหน้างาน", labelShort: "หัวหน้า", color: "#3b82f6" },
  { key: "peer", label: "เพื่อนร่วมงาน", labelShort: "เพื่อนร่วมงาน", color: "#10b981" },
  { key: "subordinate", label: "ผู้ใต้บังคับบัญชา", labelShort: "ลูกน้อง", color: "#f59e0b" },
];

export const CYCLE_STATUSES = [
  { key: "draft", label: "ร่าง", color: "default" },
  { key: "nominating", label: "เปิดเสนอชื่อ", color: "secondary" },
  { key: "active", label: "กำลังประเมิน", color: "primary" },
  { key: "completed", label: "เสร็จสิ้น", color: "success" },
  { key: "cancelled", label: "ยกเลิก", color: "danger" },
];

export const NOMINATION_STATUSES = [
  { key: "pending", label: "รอดำเนินการ", color: "warning" },
  { key: "completed", label: "เสร็จสิ้น", color: "success" },
  { key: "declined", label: "ปฏิเสธ", color: "danger" },
];

export const VALID_TRANSITIONS = {
  draft: ["nominating", "cancelled"],
  nominating: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const TRANSITION_LABELS = {
  nominating: "เปิดรับการเสนอชื่อ",
  active: "เริ่มประเมิน",
  completed: "รวบรวมผล",
  cancelled: "ยกเลิก",
};

export function getStatusConfig(statusKey, list) {
  return list.find((s) => s.key === statusKey) || list[0];
}

export function getRelationshipType(key) {
  return RELATIONSHIP_TYPES.find((r) => r.key === key) || RELATIONSHIP_TYPES[0];
}

export function computeCompetencyAverage(scores) {
  const valid = (scores || []).filter((s) => s > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function computeWeightedOverall(competencyAverages, competencies) {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const comp of competencies) {
    const avg = competencyAverages[comp.id] || 0;
    if (avg > 0) {
      weightedSum += avg * (comp.weight || 1);
      totalWeight += (comp.weight || 1);
    }
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export const DEFAULT_COMPETENCY_TEMPLATES = [
  {
    name: "ภาวะผู้นำ",
    description: "ความสามารถในการนำทีมและตัดสินใจ",
    questions: [
      "กำหนดทิศทางและเป้าหมายที่ชัดเจนให้ทีม",
      "ตัดสินใจได้ดีภายใต้แรงกดดัน",
      "สร้างแรงจูงใจและพัฒนาสมาชิกในทีม",
      "รับผิดชอบต่อผลลัพธ์ของทีม",
      "เป็นแบบอย่างที่ดีในพฤติกรรมการทำงาน",
    ],
  },
  {
    name: "การสื่อสาร",
    description: "ความสามารถในการสื่อสารอย่างมีประสิทธิภาพ",
    questions: [
      "สื่อสารความคิดเห็นได้ชัดเจนและกระชับ",
      "รับฟังผู้อื่นอย่างตั้งใจ",
      "ให้ feedback ที่สร้างสรรค์และเป็นประโยชน์",
      "ปรับวิธีการสื่อสารให้เหมาะสมกับสถานการณ์",
      "แบ่งปันข้อมูลอย่างเปิดเผยและทันท่วงที",
    ],
  },
  {
    name: "การทำงานเป็นทีม",
    description: "ความสามารถในการทำงานร่วมกับผู้อื่น",
    questions: [
      "ร่วมมือกับสมาชิกทีมอย่างมีประสิทธิภาพ",
      "สนับสนุนและช่วยเหลือเพื่อนร่วมงาน",
      "เปิดรับความคิดเห็นที่แตกต่าง",
      "แก้ไขความขัดแย้งอย่างสร้างสรรค์",
      "มีส่วนร่วมอย่างแข็งขันในกิจกรรมทีม",
    ],
  },
  {
    name: "การแก้ปัญหาและการตัดสินใจ",
    description: "ความสามารถในการวิเคราะห์และแก้ไขปัญหา",
    questions: [
      "วิเคราะห์ปัญหาอย่างเป็นระบบ",
      "เสนอแนวทางแก้ไขที่สร้างสรรค์",
      "ใช้ข้อมูลประกอบการตัดสินใจ",
      "ปรับตัวเมื่อเผชิญกับอุปสรรค",
      "เรียนรู้จากข้อผิดพลาดและปรับปรุง",
    ],
  },
  {
    name: "ความเป็นมืออาชีพ",
    description: "มาตรฐานและจรรยาบรรณในการทำงาน",
    questions: [
      "ส่งมอบงานตรงเวลาและมีคุณภาพ",
      "รักษาจรรยาบรรณวิชาชีพ",
      "บริหารเวลาได้อย่างมีประสิทธิภาพ",
      "พัฒนาตนเองอย่างต่อเนื่อง",
      "รับผิดชอบต่อผลงานของตนเอง",
    ],
  },
];

export const SCORE_LABELS = {
  5: { label: "ดีเยี่ยม", color: "success" },
  4: { label: "ดีมาก", color: "primary" },
  3: { label: "ได้มาตรฐาน", color: "warning" },
  2: { label: "ต้องปรับปรุง", color: "danger" },
  1: { label: "ไม่ผ่าน", color: "default" },
};

export const EVALUATION_CATEGORIES = [
  {
    key: "customerCentric",
    name: "Customer Centric",
    nameTh: "ลูกค้าเป็นศูนย์กลาง",
    emoji: "🎯",
    questions: [
      "เข้าใจความต้องการของลูกค้าก่อนเสนอทางเลือก",
      "คิดแทนลูกค้า มองปัญหาจากมุมผู้รับบริการ",
      "ส่งมอบงานเกินความคาดหวัง ทั้งคุณภาพและเวลา",
      "ปฏิบัติต่อทุกแผนกเสมือนลูกค้า",
      "รับฟัง Feedback และนำไปปรับปรุงอย่างจริงจัง",
    ],
  },
  {
    key: "heartwork",
    name: "Heartwork Smartwork",
    nameTh: "ใจถึง ระบบถึง",
    emoji: "🧠",
    questions: [
      "ทำงานด้วยความใส่ใจ ไม่ทำแบบขอไปที",
      "ใช้ข้อมูลและหลักฐานในการตัดสินใจ",
      "คิดเป็นระบบ มองภาพรวมก่อนลงรายละเอียด",
      "ปฏิบัติตาม SOP และกระบวนการที่กำหนด",
      "มุ่งผลลัพธ์ที่ดีกว่ามาตรฐาน",
    ],
  },
  {
    key: "happyWorkplace",
    name: "Happy Workplace",
    nameTh: "ที่ทำงานแห่งความสุข",
    emoji: "😊",
    questions: [
      "สร้างบรรยากาศที่ดีในทีม เคารพซึ่งกันและกัน",
      "เปิดรับความคิดเห็นที่แตกต่าง",
      "ช่วยเหลือเพื่อนร่วมงานเมื่อเห็นว่าต้องการ",
      "ภูมิใจในสิ่งที่ทำ แบ่งปันความสำเร็จกับทีม",
      "ดูแลสุขภาพกายใจ ทั้งของตนเองและคนรอบข้าง",
    ],
  },
  {
    key: "collaboration",
    name: "Collaboration",
    nameTh: "ร่วมมือ ร่วมใจ",
    emoji: "🤝",
    questions: [
      "ทำงานข้ามแผนกได้อย่างราบรื่น",
      "แบ่งปันความรู้และข้อมูลอย่างเปิดเผย",
      "ร่วมกันแก้ปัญหา ไม่โยนความผิด",
      "สนับสนุนเป้าหมายทีมมากกว่าเป้าส่วนตัว",
      "สื่อสารทั่วถึง แจ้ง อัปเดต ประสานงานสม่ำเสมอ",
    ],
  },
  {
    key: "honestIntegrity",
    name: "Honest Integrity",
    nameTh: "ซื่อสัตย์ มีคุณธรรม",
    emoji: "🛡️",
    questions: [
      "ทำงานอย่างโปร่งใส ตรวจสอบได้",
      "ทำในสิ่งที่ถูกต้อง แม้ไม่มีใครเห็น",
      "รักษาคำพูด สัญญาแล้วทำได้",
      "กล้ายอมรับและแก้ไขข้อผิดพลาด",
      "ไม่ใช้ทรัพยากรบริษัทเพื่อประโยชน์ส่วนตัว",
    ],
  },
  {
    key: "humble",
    name: "Humble",
    nameTh: "อ่อนน้อม ถ่อมตน",
    emoji: "🌱",
    questions: [
      "เปิดใจเรียนรู้สิ่งใหม่ ไม่ยึดติดแบบเดิม",
      "รับฟังผู้อื่นอย่างตั้งใจ ทุกตำแหน่ง",
      "ไม่ยึดติดอัตตา ยอมรับว่าไม่ได้รู้ทุกเรื่อง",
      "เคารพบทบาทของเพื่อนร่วมงานทุกระดับ",
      "ให้เครดิตผู้อื่นเมื่อได้รับความช่วยเหลือ",
    ],
  },
];

export const TOTAL_QUESTIONS = EVALUATION_CATEGORIES.reduce(
  (sum, cat) => sum + cat.questions.length,
  0,
);

export const SCORE_LABELS = {
  5: {
    label: "ดีเยี่ยม",
    labelEn: "Outstanding",
    description: "เป็นแบบอย่าง สม่ำเสมอ 100%",
    color: "success",
  },
  4: {
    label: "ดีมาก",
    labelEn: "Exceed",
    description: "เหนือมาตรฐาน 80-90%",
    color: "primary",
  },
  3: {
    label: "ได้มาตรฐาน",
    labelEn: "Meet",
    description: "ตามที่คาดหวัง 60-79%",
    color: "warning",
  },
  2: {
    label: "ต้องปรับปรุง",
    labelEn: "Below",
    description: "น้อยกว่าที่คาดหวัง 40-59%",
    color: "danger",
  },
  1: {
    label: "ไม่ผ่าน",
    labelEn: "Unsatisfactory",
    description: "ไม่แสดงพฤติกรรมตามค่านิยม <40%",
    color: "default",
  },
};

export const QUARTER_OPTIONS = [
  { key: "1", label: "Q1 (ม.ค.-มี.ค.)" },
  { key: "2", label: "Q2 (เม.ย.-มิ.ย.)" },
  { key: "3", label: "Q3 (ก.ค.-ก.ย.)" },
  { key: "4", label: "Q4 (ต.ค.-ธ.ค.)" },
];

export function computeGrade(score) {
  if (score >= 4.5) return "A+";
  if (score >= 4.0) return "A";
  if (score >= 3.5) return "B+";
  if (score >= 3.0) return "B";
  if (score >= 2.5) return "C+";
  if (score >= 2.0) return "C";
  if (score >= 1.5) return "D";
  return "F";
}

export function getGradeColor(grade) {
  if (grade === "A+" || grade === "A") return "success";
  if (grade === "B+" || grade === "B") return "primary";
  if (grade === "C+" || grade === "C") return "warning";
  return "danger";
}

export function computeCategoryAverages(scores) {
  const averages = {};
  for (const cat of EVALUATION_CATEGORIES) {
    const values = scores[cat.key] || [];
    const validValues = values.filter((v) => v > 0);
    averages[cat.key] =
      validValues.length > 0
        ? validValues.reduce((a, b) => a + b, 0) / validValues.length
        : 0;
  }
  return averages;
}

export function computeOverallScore(categoryAverages) {
  const values = Object.values(categoryAverages).filter((v) => v > 0);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function createEmptyScores() {
  const scores = {};
  for (const cat of EVALUATION_CATEGORIES) {
    scores[cat.key] = Array(cat.questions.length).fill(0);
  }
  return scores;
}

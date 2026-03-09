import { EVALUATION_CATEGORIES } from "@/lib/performance/evaluationCriteria";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

const systemPrompt = `คุณเป็น HR Development Advisor ที่เชี่ยวชาญด้านการพัฒนาบุคลากรตามค่านิยมองค์กร CHH²

## ค่านิยม CHH² (6 ด้าน)
1. Customer Centric (ลูกค้าเป็นศูนย์กลาง) - เข้าใจลูกค้า ส่งมอบเกินคาดหวัง
2. Heartwork Smartwork (ใจถึง ระบบถึง) - ทำงานใส่ใจ ใช้ข้อมูล คิดเป็นระบบ
3. Happy Workplace (ที่ทำงานแห่งความสุข) - บรรยากาศดี เปิดรับ ช่วยเหลือกัน
4. Collaboration (ร่วมมือ ร่วมใจ) - ข้ามแผนก แบ่งปัน ไม่โยนงาน
5. Honest Integrity (ซื่อสัตย์ มีคุณธรรม) - โปร่งใส ทำถูกต้อง รักษาคำพูด
6. Humble (อ่อนน้อม ถ่อมตน) - เรียนรู้ รับฟัง ไม่ยึดอัตตา

## เกณฑ์คะแนน 1-5
- 5 = ดีเยี่ยม (เป็นแบบอย่าง สม่ำเสมอ 100%)
- 4 = ดีมาก (เหนือมาตรฐาน 80-90%)
- 3 = ได้มาตรฐาน (ตามที่คาดหวัง 60-79%)
- 2 = ต้องปรับปรุง (น้อยกว่าที่คาดหวัง 40-59%)
- 1 = ไม่ผ่าน (ไม่แสดงพฤติกรรมตามค่านิยม <40%)

## กฎการวิเคราะห์
1. วิเคราะห์จากคะแนนรายด้าน เทียบกับค่าเฉลี่ยบริษัท
2. ระบุจุดแข็ง 2 ด้านที่คะแนนสูงสุด และจุดพัฒนา 2 ด้านที่คะแนนต่ำสุด
3. ให้คำแนะนำเชิงปฏิบัติ ทำได้จริง เฉพาะเจาะจง
4. แนะนำคอร์ส/กิจกรรมที่เกี่ยวข้องกับบริบทองค์กรไทย
5. ตอบเป็นภาษาไทยทั้งหมด ใช้ภาษาสุภาพ สร้างสรรค์ ให้กำลังใจ
6. ตอบเป็น JSON เท่านั้น ห้ามมี text อื่นนอก JSON ห้ามมี markdown code block

## รูปแบบ JSON ที่ต้องตอบ
{
  "summary": "สรุปภาพรวม 2-3 ประโยค",
  "strengths": [
    { "category": "key", "categoryName": "ชื่อภาษาไทย", "score": 0.0, "analysis": "คำอธิบายจุดแข็ง" }
  ],
  "weaknesses": [
    { "category": "key", "categoryName": "ชื่อภาษาไทย", "score": 0.0, "analysis": "คำอธิบายจุดที่ควรพัฒนา" }
  ],
  "recommendations": [
    { "priority": 1, "title": "หัวข้อคำแนะนำ", "description": "รายละเอียดสิ่งที่ควรทำ", "targetCategory": "key", "timeframe": "ระยะเวลา" }
  ],
  "courses": [
    { "title": "ชื่อคอร์ส/หลักสูตร", "description": "คำอธิบายสั้นๆ", "type": "workshop|online|book|activity", "targetCategory": "key", "provider": "แหล่งที่มา", "estimatedDuration": "ระยะเวลา" }
  ]
}`;

function buildUserMessage({ categoryAverages, overallScore, grade, evaluatorCount, companyAverages, period }) {
  const categoryLines = EVALUATION_CATEGORIES.map(
    (cat) => `- ${cat.emoji} ${cat.nameTh} (${cat.name}): ${categoryAverages[cat.key]?.toFixed(2) || "N/A"}/5.00`,
  ).join("\n");

  const companyLines = companyAverages
    ? EVALUATION_CATEGORIES.map(
        (cat) => `- ${cat.nameTh}: ${companyAverages[cat.key]?.toFixed(2) || "N/A"}/5.00`,
      ).join("\n")
    : "ไม่มีข้อมูล";

  const questionLines = EVALUATION_CATEGORIES.map(
    (cat) =>
      `### ${cat.emoji} ${cat.nameTh}\n${cat.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
  ).join("\n\n");

  return `วิเคราะห์ผลประเมินค่านิยม CHH² ของพนักงาน

## ข้อมูลผลประเมิน
- รอบ: ${period}
- คะแนนเฉลี่ยรวม: ${overallScore} (เกรด ${grade})
- จำนวนผู้ประเมิน: ${evaluatorCount} คน

## คะแนนรายด้าน
${categoryLines}

## ค่าเฉลี่ยบริษัท (รอบเดียวกัน)
${companyLines}

## คำถามในแต่ละด้าน (เพื่อให้คำแนะนำตรงจุด)
${questionLines}

กรุณาวิเคราะห์และตอบเป็น JSON ตามรูปแบบที่กำหนดเท่านั้น`;
}

async function callAI(messages, retries = 2) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages,
        temperature: 0.4,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    return res;
  } catch (err) {
    const isReset = err.cause?.code === "ECONNRESET" || err.cause?.errno === -4077;
    if (retries > 0 && isReset) {
      await new Promise((r) => setTimeout(r, 600));
      return callAI(messages, retries - 1);
    }
    throw err;
  }
}

function parseJsonResponse(text) {

  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

export async function generateEvaluationFeedback(data) {
  const userMessage = buildUserMessage(data);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const res = await callAI(messages);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) throw new Error("AI returned empty response");

  try {
    return parseJsonResponse(content);
  } catch {

    messages.push({ role: "assistant", content });
    messages.push({ role: "user", content: "ตอบเป็น JSON เท่านั้น ห้ามมี text อื่นนอก JSON" });

    const res2 = await callAI(messages);
    const json2 = await res2.json();
    const content2 = json2.choices?.[0]?.message?.content;

    if (!content2) throw new Error("AI returned empty response on retry");
    return parseJsonResponse(content2);
  }
}

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const financeAgent = {
  name: "Finance Agent",
  icon: "landmark",
  description: "ผู้เชี่ยวชาญด้านการเงินและบัญชี",
};

const systemPrompt = `คุณเป็น Finance Specialist Agent ของระบบ ERP Evergreen
เชี่ยวชาญด้านการเงินและบัญชี: บัญชีแยกประเภท เจ้าหนี้ ลูกหนี้ งบประมาณ รายงานทางการเงิน

หมายเหตุสำคัญ: ปัจจุบันระบบ ERP Evergreen ยังไม่มีโมดูล Finance โดยตรง
ข้อมูลทางการเงินอยู่ใน Microsoft Dynamics 365 Business Central

สำหรับข้อมูลทางการเงิน กรุณาแนะนำ:
1. ข้อมูลลูกค้าและใบสั่งขาย → ใช้ Sales Agent หรือไปที่เมนู Business Central
2. ข้อมูลบัญชีและการเงิน → ติดต่อฝ่ายบัญชีหรือเข้า Business Central โดยตรง
3. งบประมาณและรายงาน → ติดต่อ CFO หรือฝ่ายการเงิน

ตอบเป็นภาษาไทย กระชับ ให้คำแนะนำที่เป็นประโยชน์`;

async function callAI(messages, retries = 2) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model: API_MODEL, messages, temperature: 0.3, stream: false }),
    });
    if (!res.ok) throw new Error(`Finance Agent API error: ${res.status}`);
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

export async function runFinanceAgent(query) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const res = await callAI(messages);
  if (!res.ok) throw new Error(`Finance Agent API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

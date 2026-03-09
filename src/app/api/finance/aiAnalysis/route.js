import { withAuth } from "@/app/api/_lib/auth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

const systemPrompt = `คุณเป็น CFO AI Advisor ของบริษัท ชี้อะฮะฮวด อุตสาหกรรม จำกัด
คุณเชี่ยวชาญการวิเคราะห์งบการเงิน วิเคราะห์สถานะทางการเงิน และให้คำแนะนำเชิงกลยุทธ์

## รูปแบบการวิเคราะห์
เมื่อได้รับข้อมูลทางการเงิน ให้วิเคราะห์ครบถ้วนตามหัวข้อต่อไปนี้:

### 1. 🏥 สรุปสุขภาพการเงิน (Financial Health Score)
- ให้คะแนนสุขภาพการเงินโดยรวม (A/B/C/D/F) พร้อมเหตุผล
- สรุปจุดแข็งและจุดอ่อนหลัก

### 2. 📊 วิเคราะห์งบการเงิน
- วิเคราะห์โครงสร้างสินทรัพย์-หนี้สิน-ทุน
- วิเคราะห์ความสามารถในการทำกำไร
- วิเคราะห์อัตราส่วนทางการเงินที่สำคัญ (Current Ratio, D/E, Margin)

### 3. ⚠️ ความเสี่ยงที่ต้องเฝ้าระวัง
- ระบุความเสี่ยงที่พบ เรียงลำดับจากรุนแรงมากสุด
- อธิบายผลกระทบที่อาจเกิดขึ้นหากไม่แก้ไข

### 4. 💰 วิเคราะห์ลูกหนี้-เจ้าหนี้
- วิเคราะห์สถานะ AR/AP จากข้อมูลอายุหนี้
- ระบุลูกค้าหรือเจ้าหนี้ที่มีความเสี่ยงสูง
- วิเคราะห์แนวโน้มจากข้อมูลใบแจ้งหนี้

### 5. 🎯 แผนปฏิบัติการเร่งด่วน (Action Plan)
- ให้คำแนะนำ 3-5 ข้อที่ต้องทำ **ทันที** (ภายใน 1-2 สัปดาห์)
- ให้คำแนะนำ 3-5 ข้อที่ต้องทำ **ระยะกลาง** (1-3 เดือน)
- แต่ละข้อระบุ: ทำอะไร, ทำไมสำคัญ, ผลลัพธ์ที่คาดหวัง

### 6. 📈 โอกาสในการปรับปรุง
- โอกาสลดต้นทุน
- โอกาสเพิ่มรายได้
- โอกาสปรับปรุง cash flow

## กฎเหล็ก
- วิเคราะห์จากข้อมูลจริงที่ได้รับเท่านั้น ห้ามสมมติตัวเลข
- ไฮไลต์ตัวเลขสำคัญด้วย **ตัวหนา**
- ใช้ตาราง Markdown เมื่อเปรียบเทียบข้อมูล
- ตอบเป็นภาษาไทย กระชับ ตรงประเด็น
- เน้นคำแนะนำที่ทำได้จริง (actionable) ไม่ใช่แค่ทฤษฎี`;

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
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();

      if (retries > 0 && (res.status === 401 || res.status >= 500)) {
        await new Promise((r) => setTimeout(r, 800));
        return callAI(messages, retries - 1);
      }
      throw new Error(`AI API error: ${res.status} ${text}`);
    }

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

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { snapshot } = await request.json();
    if (!snapshot) {
      return Response.json({ error: "Missing snapshot data" }, { status: 400 });
    }

    const today = new Date().toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      dateStyle: "full",
    });

    const userMessage = `วันที่วิเคราะห์: ${today}

## ข้อมูลงบการเงิน (คำนวณจาก Trial Balance)
${snapshot.financials || "ไม่มีข้อมูล"}

## อัตราส่วนทางการเงิน
${snapshot.ratios || "ไม่มีข้อมูล"}

## อายุหนี้ลูกหนี้ (Aged Receivables)
${snapshot.ar || "ไม่มีข้อมูล"}

## อายุหนี้เจ้าหนี้ (Aged Payables)
${snapshot.ap || "ไม่มีข้อมูล"}

## แนวโน้มลูกหนี้ค้างชำระ (รายเดือน — เฉพาะใบแจ้งหนี้สถานะ Open)
${snapshot.arTrend || "ไม่มีข้อมูล"}

## แนวโน้มเจ้าหนี้ค้างชำระ (รายเดือน — เฉพาะใบแจ้งหนี้สถานะ Open)
${snapshot.apTrend || "ไม่มีข้อมูล"}

## การกระจายลูกหนี้ตามอายุหนี้ (จากใบแจ้งหนี้ Open)
${snapshot.arBands || "ไม่มีข้อมูล"}

## การกระจายเจ้าหนี้ตามอายุหนี้ (จากใบแจ้งหนี้ Open)
${snapshot.apBands || "ไม่มีข้อมูล"}

กรุณาวิเคราะห์ข้อมูลทั้งหมดนี้อย่างละเอียด ให้คำแนะนำเชิงกลยุทธ์ที่ทำได้จริง`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    const res = await callAI(messages);


    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Analysis error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

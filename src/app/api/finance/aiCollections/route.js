import { withAuth } from "@/app/api/_lib/auth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

const systemPrompt = `คุณเป็น AI Collections Advisor ของบริษัท ชี้อะฮะฮวด อุตสาหกรรม จำกัด
คุณเชี่ยวชาญการวิเคราะห์ลูกหนี้ค้างชำระ การจัดลำดับความสำคัญในการติดตามหนี้ และการประเมินความเสี่ยงลูกค้า

## รูปแบบการวิเคราะห์
เมื่อได้รับข้อมูลลูกหนี้ ให้วิเคราะห์ครบถ้วนตามหัวข้อต่อไปนี้:

### 1. สรุปสถานะลูกหนี้ (AR Health Score)
- ให้คะแนนสุขภาพลูกหนี้โดยรวม (A/B/C/D/F) พร้อมเหตุผล
- สัดส่วนหนี้ค้างชำระ vs ยังไม่ถึงกำหนด
- Concentration risk (การกระจุกตัวในลูกค้ารายใหญ่)

### 2. จัดลำดับติดตาม (Priority Matrix)
จัดลำดับลูกค้าที่ควรติดตามก่อน โดยพิจารณาจาก:
- ยอดค้างชำระสูง (มูลค่าเงิน)
- จำนวนวันค้างนาน (period3 > period2 > period1)
- ประวัติการติดตาม (เคยติดต่อแล้วหรือยัง, สถานะล่าสุด)
- ลูกค้าที่สัญญาจะจ่ายแต่ยังไม่จ่าย

แสดงเป็นตาราง Priority (สูง/กลาง/ต่ำ) พร้อมเหตุผลและวิธีติดตามแนะนำ

### 3. วิเคราะห์ความเสี่ยง
- ลูกค้าที่มีแนวโน้มจะกลายเป็นหนี้สูญ
- ลูกค้าที่มี pattern ค้างชำระเรื้อรัง
- ลูกค้าที่ติดต่อไม่ได้

### 4. กลยุทธ์ติดตามหนี้
- แนะนำวิธีติดตามเฉพาะเจาะจงสำหรับแต่ละกลุ่มลูกค้า
- เสนอ script/template สำหรับโทร/ส่งข้อความ
- กำหนด deadline ที่ควรยกระดับ (escalate)

### 5. แผนปฏิบัติการ (Action Plan)
- สิ่งที่ต้องทำ **วันนี้** (ลูกค้า 3-5 รายที่ต้องติดต่อทันที)
- สิ่งที่ต้องทำ **สัปดาห์นี้**
- สิ่งที่ต้องทำ **เดือนนี้**
- ประมาณการเงินที่คาดว่าจะเก็บได้

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

## สรุป KPI ลูกหนี้
${snapshot.kpis || "ไม่มีข้อมูล"}

## ข้อมูลลูกหนี้ทั้งหมด (เรียงตามยอดค้างชำระ)
${snapshot.customers || "ไม่มีข้อมูล"}

## ประวัติการติดตาม (Follow-up History)
${snapshot.followUpSummary || "ไม่มีข้อมูล"}

## ลูกค้าที่ยังไม่เคยติดต่อ
${snapshot.uncontacted || "ไม่มีข้อมูล"}

## ลูกค้าที่มีนัดติดตามวันนี้หรือเลยกำหนด
${snapshot.dueToday || "ไม่มีข้อมูล"}

กรุณาวิเคราะห์ข้อมูลทั้งหมดนี้ จัดลำดับความสำคัญในการติดตาม และให้แผนปฏิบัติการที่ชัดเจน`;

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
    console.error("AI Collections error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

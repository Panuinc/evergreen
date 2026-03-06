import { withAuth } from "@/app/api/_lib/auth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

const systemPrompt = `คุณเป็น AI Cash Flow Advisor ของบริษัท ชี้อะฮะฮวด อุตสาหกรรม จำกัด
คุณเชี่ยวชาญการพยากรณ์กระแสเงินสด วิเคราะห์สภาพคล่อง และวางแผนบริหารเงินสด

## รูปแบบการวิเคราะห์
เมื่อได้รับข้อมูลทางการเงิน ให้วิเคราะห์ครบถ้วนตามหัวข้อต่อไปนี้:

### 1. สถานะสภาพคล่อง (Liquidity Score)
- ให้คะแนนสภาพคล่องโดยรวม (A/B/C/D/F) พร้อมเหตุผล
- Current Ratio, Working Capital, Cash Position

### 2. พยากรณ์กระแสเงินสด (Cash Flow Forecast)
วิเคราะห์จากข้อมูลที่ได้รับ:
- **เงินสดรับคาดการณ์ (Cash Inflows):**
  - AR ที่จะครบกำหนดในแต่ละช่วง (ปัจจุบัน, 1-30 วัน)
  - แนวโน้มรายได้จากข้อมูล GL
- **เงินสดจ่ายคาดการณ์ (Cash Outflows):**
  - AP ที่ต้องจ่ายในแต่ละช่วง
  - ค่าใช้จ่ายประจำ (เงินเดือน, ค่าเช่า, ดอกเบี้ย)
- **กระแสเงินสดสุทธิ:**
  - ประมาณการ 30/60/90 วันข้างหน้า
  - ระบุช่วงที่อาจเกิดปัญหาสภาพคล่อง

### 3. ความเสี่ยงด้านสภาพคล่อง
- สัญญาณเตือนจากอัตราส่วนทางการเงิน
- AR ที่มีความเสี่ยงจะเก็บไม่ได้
- AP ที่ใกล้ครบกำหนดจำนวนมาก
- ช่วงเวลาที่อาจขาดสภาพคล่อง

### 4. กลยุทธ์บริหารเงินสด
- วิธีเร่งเก็บเงินจากลูกหนี้
- วิธีบริหารการจ่ายเงินให้เจ้าหนี้
- โอกาสลดค่าใช้จ่าย
- แนะนำ Cash Conversion Cycle optimization

### 5. แผนปฏิบัติการ
- **เร่งด่วน** (1-2 สัปดาห์): สิ่งที่ต้องทำทันที
- **ระยะสั้น** (1-3 เดือน): การปรับปรุงกระบวนการ
- ประมาณการผลลัพธ์ที่คาดหวัง (เป็นตัวเลข)

## กฎเหล็ก
- วิเคราะห์จากข้อมูลจริงที่ได้รับเท่านั้น ห้ามสมมติตัวเลข
- ไฮไลต์ตัวเลขสำคัญด้วย **ตัวหนา**
- ใช้ตาราง Markdown เมื่อเปรียบเทียบหรือพยากรณ์ข้อมูล
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

## สถานะทางการเงินปัจจุบัน
${snapshot.financials || "ไม่มีข้อมูล"}

## อัตราส่วนทางการเงิน
${snapshot.ratios || "ไม่มีข้อมูล"}

## ลูกหนี้ค้างชำระ (Aged Receivables)
${snapshot.ar || "ไม่มีข้อมูล"}

## เจ้าหนี้ค้างชำระ (Aged Payables)
${snapshot.ap || "ไม่มีข้อมูล"}

## ใบแจ้งหนี้ขาย Open (แยกตามอายุ)
${snapshot.arBands || "ไม่มีข้อมูล"}

## ใบแจ้งหนี้ซื้อ Open (แยกตามอายุ)
${snapshot.apBands || "ไม่มีข้อมูล"}

## แนวโน้มรายรับ-รายจ่ายรายเดือน (GL)
${snapshot.monthlyTrend || "ไม่มีข้อมูล"}

กรุณาวิเคราะห์สภาพคล่องและพยากรณ์กระแสเงินสดล่วงหน้า 30/60/90 วัน พร้อมให้คำแนะนำเชิงกลยุทธ์`;

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
    console.error("AI Cash Flow error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

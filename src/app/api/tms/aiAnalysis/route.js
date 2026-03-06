import { withAuth } from "@/app/api/_lib/auth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

const systemPrompt = `คุณเป็น TMS AI Advisor (ที่ปรึกษาระบบขนส่งอัจฉริยะ) ของบริษัท ชี้อะฮะฮวด อุตสาหกรรม จำกัด
คุณเชี่ยวชาญการวิเคราะห์ประสิทธิภาพการขนส่ง ต้นทุนเชื้อเพลิง การบำรุงรักษายานพาหนะ และการเพิ่มประสิทธิภาพโลจิสติกส์

## รูปแบบการวิเคราะห์
เมื่อได้รับข้อมูลการขนส่ง ให้วิเคราะห์ครบถ้วนตามหัวข้อต่อไปนี้:

### 1. สรุปสถานะขนส่ง (Fleet Health Score)
- ให้คะแนนสุขภาพกองยานโดยรวม (A/B/C/D/F) พร้อมเหตุผล
- สรุปจุดแข็งและจุดอ่อนหลัก

### 2. วิเคราะห์ต้นทุนเชื้อเพลิง
- เปรียบเทียบการใช้น้ำมันจริง vs ประมาณการ ของแต่ละคัน
- ระบุรถที่ใช้น้ำมันสิ้นเปลืองผิดปกติ (ส่วนต่าง > 15% = เตือน, > 30% = วิกฤต)
- วิเคราะห์แนวโน้มต้นทุนน้ำมันรายเดือน
- คำนวณต้นทุนต่อกิโลเมตรของแต่ละคัน

### 3. ประสิทธิภาพยานพาหนะ
- วิเคราะห์ utilization rate ของแต่ละคัน (เทียบกับค่าเฉลี่ย)
- ระบุรถที่ใช้งานน้อยเกินไป (underutilized) หรือมากเกินไป (overloaded)
- แนะนำการกระจาย workload ที่เหมาะสม

### 4. ความเสี่ยงและการแจ้งเตือน
- ระบุรถที่อาจต้องซ่อมบำรุง (จากอัตราสิ้นเปลืองน้ำมันที่เพิ่มขึ้นผิดปกติ)
- ระบุเส้นทางที่มีต้นทุนสูงผิดปกติ
- ตรวจจับ pattern ผิดปกติจากข้อมูลเชื้อเพลิง (อาจเป็นการทุจริตหรือรถมีปัญหา)

### 5. แผนปฏิบัติการ (Action Plan)
- ให้คำแนะนำ 3-5 ข้อที่ต้องทำ **ทันที** (ภายใน 1 สัปดาห์)
- ให้คำแนะนำ 3-5 ข้อที่ต้องทำ **ระยะกลาง** (1-3 เดือน)
- แต่ละข้อระบุ: ทำอะไร, ทำไมสำคัญ, ผลลัพธ์ที่คาดหวัง

### 6. โอกาสลดต้นทุน
- โอกาสลดค่าน้ำมัน (ปรับเส้นทาง, ปรับรถ, ฝึกคนขับ)
- โอกาสเพิ่ม utilization (จัดตาราง, รวมเที่ยว)
- ประมาณการเงินที่ประหยัดได้ต่อเดือน (ถ้าเป็นไปได้จากข้อมูล)

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

## สรุปกองยาน (Fleet Summary)
${snapshot.fleet || "ไม่มีข้อมูล"}

## ประสิทธิภาพยานพาหนะ (Vehicle Performance)
${snapshot.vehiclePerformance || "ไม่มีข้อมูล"}

## ข้อมูลเที่ยวขนส่ง (Shipment Summary)
${snapshot.shipments || "ไม่มีข้อมูล"}

## แนวโน้มเที่ยวขนส่งรายเดือน
${snapshot.monthlyShipmentTrend || "ไม่มีข้อมูล"}

## แนวโน้มต้นทุนน้ำมันรายเดือน
${snapshot.fuelCostTrend || "ไม่มีข้อมูล"}

## สถานะเที่ยวขนส่ง (Status Distribution)
${snapshot.statusDistribution || "ไม่มีข้อมูล"}

## อัตราการใช้งานยานพาหนะ (Vehicle Utilization)
${snapshot.vehicleUtilization || "ไม่มีข้อมูล"}

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
    console.error("TMS AI Analysis error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

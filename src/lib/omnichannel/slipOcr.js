const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const OCR_PROMPT = `วิเคราะห์สลิปการโอนเงินในรูปนี้ ดึงข้อมูลต่อไปนี้:
- amount: ยอดเงินที่โอน (ตัวเลข)
- fromBank: ธนาคารผู้โอน
- toBank: ธนาคารผู้รับ
- datetime: วันเวลาที่โอน
- reference: เลขอ้างอิง/เลขรายการ

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบาย ถ้าอ่านข้อมูลไม่ได้ให้ใส่ null
ตัวอย่าง: {"amount":5000,"fromBank":"กสิกรไทย","toBank":"ไทยพาณิชย์","datetime":"17/02/2026 14:30","reference":"2024021712345"}`;


export async function ocrPaymentSlip(imageUrl) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0,
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OCR API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";


    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("[Slip OCR] Error:", err.message);
    return null;
  }
}

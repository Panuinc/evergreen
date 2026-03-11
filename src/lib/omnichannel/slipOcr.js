const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const OCR_PROMPT = `วิเคราะห์สลิปการโอนเงินในรูปนี้ ดึงข้อมูลต่อไปนี้:
- amount: ยอดเงินที่โอน (ตัวเลข)
- fromBank: ธนาคารผู้โอน
- toBank: ธนาคารผู้รับ
- datetime: วันเวลาที่โอน
- reference: เลขอ้างอิง/เลขรายการ

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบาย ถ้าอ่านข้อมูลไม่ได้ให้ใส่ null
ตัวอย่าง: {"amount":5000,"fromBank":"กสิกรไทย","toBank":"ไทยพาณิชย์","datetime":"17/02/2026 14:30","reference":"2024021712345"}`;

function sanitizeOcrResult(parsed) {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  return {
    amount: typeof parsed.amount === "number" && parsed.amount >= 0 && parsed.amount <= 999999999
      ? parsed.amount
      : null,
    fromBank: typeof parsed.fromBank === "string" ? parsed.fromBank.slice(0, 200) : null,
    toBank: typeof parsed.toBank === "string" ? parsed.toBank.slice(0, 200) : null,
    datetime: typeof parsed.datetime === "string" ? parsed.datetime.slice(0, 50) : null,
    reference: typeof parsed.reference === "string" ? parsed.reference.slice(0, 100) : null,
  };
}

export async function ocrPaymentSlip(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  try {
    const parsed = new URL(imageUrl);
    if (!["https:", "http:"].includes(parsed.protocol)) return null;
  } catch {
    return null;
  }

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
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OCR API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    let ocrData;
    try {
      ocrData = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[Slip OCR] Failed to parse JSON:", content.slice(0, 200));
      return null;
    }

    return sanitizeOcrResult(ocrData);
  } catch (err) {
    console.error("[Slip OCR] Error:", err.message);
    return null;
  }
}

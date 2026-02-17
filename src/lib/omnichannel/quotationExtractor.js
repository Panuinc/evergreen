const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const EXTRACTION_PROMPT = `จากบทสนทนาต่อไปนี้ กรุณาดึงข้อมูลออเดอร์เป็น JSON format:
{
  "customerName": "ชื่อ-นามสกุลลูกค้า หรือ null",
  "customerPhone": "เบอร์โทร หรือ null",
  "customerAddress": "ที่อยู่จัดส่งทั้งหมด หรือ null",
  "paymentMethod": "โอนเงิน หรือ null",
  "items": [
    {
      "productName": "ชื่อสินค้าหลัก",
      "variant": "รุ่น/สี/ขนาด รวมกัน",
      "quantity": 1
    }
  ]
}
ตอบเฉพาะ JSON เท่านั้น ไม่ต้องอธิบาย ไม่ต้องมี markdown code block`;

export async function extractOrderFromChat(messages) {
  const conversation = messages
    .map((m) => {
      const role = m.messageSenderType === "customer" ? "ลูกค้า" : "เจ้าหน้าที่";
      return `${role}: ${m.messageContent}`;
    })
    .join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

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
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: conversation },
        ],
        temperature: 0,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI extraction error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Clean markdown code block if present
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } finally {
    clearTimeout(timeout);
  }
}

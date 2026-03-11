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

const DEFAULT_ORDER = {
  customerName: null,
  customerPhone: null,
  customerAddress: null,
  paymentMethod: null,
  items: [],
};

function sanitizeOrderData(parsed) {
  return {
    customerName: typeof parsed.customerName === "string" ? parsed.customerName.slice(0, 500) : null,
    customerPhone: typeof parsed.customerPhone === "string" ? parsed.customerPhone.slice(0, 50) : null,
    customerAddress: typeof parsed.customerAddress === "string" ? parsed.customerAddress.slice(0, 1000) : null,
    paymentMethod: typeof parsed.paymentMethod === "string" ? parsed.paymentMethod.slice(0, 100) : null,
    items: Array.isArray(parsed.items)
      ? parsed.items.slice(0, 20).map((item) => ({
          productName: typeof item.productName === "string" ? item.productName.slice(0, 500) : "สินค้า",
          variant: typeof item.variant === "string" ? item.variant.slice(0, 500) : null,
          quantity: typeof item.quantity === "number" && item.quantity > 0 && item.quantity <= 99999
            ? Math.floor(item.quantity)
            : 1,
        }))
      : [],
  };
}

export async function extractOrderFromChat(messages) {
  const conversation = messages
    .slice(-30)
    .map((m) => {
      const role = m.omMessageSenderType === "customer" ? "ลูกค้า" : "เจ้าหน้าที่";
      return `${role}: ${(m.omMessageContent || "").slice(0, 2000)}`;
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

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[QuotationExtractor] Failed to parse AI JSON:", cleaned.slice(0, 200));
      return DEFAULT_ORDER;
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return DEFAULT_ORDER;
    }

    return sanitizeOrderData(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

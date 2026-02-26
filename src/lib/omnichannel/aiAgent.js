import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function fetchProductCatalog() {
  try {
    const supabase = getServiceSupabase();
    const [itemsResult, priceResult] = await Promise.all([
      supabase
        .from("bcItem")
        .select("bcItemNumber,bcItemDisplayName")
        .eq("bcItemBlocked", false)
        .like("bcItemNumber", "FG-00003%")
        .order("bcItemNumber"),
      supabase.from("omPriceItem").select("omPriceItemNumber, omPriceItemUnitPrice"),
    ]);

    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.omPriceItemNumber] = Number(p.omPriceItemUnitPrice) || 0;
    }

    return (itemsResult.data || []).map((i) => ({
      name: i.bcItemDisplayName,
      price: priceMap[i.bcItemNumber] || 0,
    }));
  } catch (err) {
    console.error("[AI] Failed to fetch products:", err.message);
    return [];
  }
}

function buildSystemPrompt(basePrompt, products) {
  let prompt = basePrompt;
  if (products.length > 0) {
    prompt += `\n\n## สินค้าที่มีจำหน่าย\nใช้ข้อมูลนี้ในการตอบคำถามเกี่ยวกับสินค้าและราคา ห้ามบอกจำนวนสต๊อก:\n`;
    for (const p of products) {
      if (p.price > 0) {
        prompt += `- ${p.name} ราคา ${p.price.toLocaleString("th-TH")} บาท\n`;
      } else {
        prompt += `- ${p.name} (ยังไม่ระบุราคา)\n`;
      }
    }
    prompt += `\nถ้าลูกค้าถามสินค้าที่ไม่อยู่ในรายการ ให้บอกว่าสินค้ารุ่นนี้ไม่มีจำหน่ายในขณะนี้
ถ้าลูกค้าถามราคาสินค้าที่มีราคาอยู่แล้ว ให้บอกราคาตามข้อมูลข้างต้นได้เลย
ถ้าลูกค้าถามราคาสินค้าที่ยังไม่ระบุราคา ให้บอกว่ากรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามราคา

## ขั้นตอนการปิดการขาย
เมื่อลูกค้าต้องการสั่งซื้อสินค้า ให้ถามข้อมูลต่อไปนี้ทีละข้อ (ถ้ายังไม่มีข้อมูล):
1. สินค้าที่ต้องการ (รุ่น สี ขนาด)
2. จำนวน
3. ชื่อ-นามสกุล ผู้รับสินค้า
4. ที่อยู่จัดส่ง (บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์)
5. เบอร์โทรติดต่อ

เมื่อได้ข้อมูลครบ ให้สรุปรายการสั่งซื้อทั้งหมดและขอยืนยันจากลูกค้า
ถ้าลูกค้ายืนยัน ให้แจ้งว่า "ขอบคุณค่ะ รับออเดอร์เรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันอีกครั้งค่ะ"

## การรับหลักฐานการชำระเงิน
ถ้าลูกค้าส่งรูปภาพ ([image]) หลังจากมีการสั่งซื้อสินค้าแล้ว ให้ตอบว่า "ได้รับหลักฐานการชำระเงินแล้วค่ะ เจ้าหน้าที่จะตรวจสอบและยืนยันให้ค่ะ"`;
  }
  return prompt;
}

export async function getAiSettings(supabase) {
  const { data } = await supabase
    .from("omAiSetting")
    .select("*")
    .limit(1)
    .single();
  return data;
}

export async function getConversationContext(conversationId, supabase, limit = 20) {
  const { data: messages } = await supabase
    .from("omMessage")
    .select("omMessageSenderType, omMessageContent, omMessageCreatedAt")
    .eq("omMessageConversationId", conversationId)
    .order("omMessageCreatedAt", { ascending: false })
    .limit(limit);

  return (messages || []).reverse();
}

export async function generateAiReply(conversationId, supabase) {
  // Fetch settings, history, and products in parallel
  const [settings, history, products] = await Promise.all([
    getAiSettings(supabase),
    getConversationContext(conversationId, supabase),
    fetchProductCatalog(),
  ]);

  const model = settings?.omAiSettingModel || "google/gemini-2.5-flash-lite";
  const temperature = Number(settings?.omAiSettingTemperature) || 0.3;
  const basePrompt =
    settings?.omAiSettingSystemPrompt ||
    "คุณเป็นเจ้าหน้าที่บริการลูกค้า ตอบเป็นภาษาไทย";

  const systemPrompt = buildSystemPrompt(basePrompt, products);

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.omMessageSenderType === "customer" ? "user" : "assistant",
      content: msg.omMessageContent,
    })),
  ];

  // Single API call - no tool-calling needed
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
        model,
        messages: aiMessages,
        temperature,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

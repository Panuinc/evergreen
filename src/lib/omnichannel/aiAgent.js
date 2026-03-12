import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function fetchProductCatalog() {
  try {
    const supabase = getServiceSupabase();
    const [itemsResult, priceResult, productInfoResult] = await Promise.all([
      supabase
        .from("bcItem")
        .select("bcItemNumber,bcItemDisplayName")
        .eq("bcItemBlocked", false)
        .like("bcItemNumber", "FG-00003%")
        .order("bcItemNumber"),
      supabase.from("omPriceItem").select("omPriceItemNumber, omPriceItemUnitPrice"),
      supabase.from("omProductInfo").select("*"),
    ]);

    const priceMap = {};
    for (const p of priceResult.data || []) {
      priceMap[p.omPriceItemNumber] = Number(p.omPriceItemUnitPrice) || 0;
    }

    const infoMap = {};
    for (const info of productInfoResult.data || []) {
      infoMap[info.omProductInfoItemNumber] = info;
    }

    return (itemsResult.data || []).map((i) => ({
      number: i.bcItemNumber,
      name: i.bcItemDisplayName,
      price: priceMap[i.bcItemNumber] || 0,
      description: infoMap[i.bcItemNumber]?.omProductInfoDescription || null,
      highlights: infoMap[i.bcItemNumber]?.omProductInfoHighlights || null,
      category: infoMap[i.bcItemNumber]?.omProductInfoCategory || null,
    }));
  } catch (err) {
    console.error("[AI] Failed to fetch products:", err.message);
    return [];
  }
}

async function fetchActivePromotions() {
  try {
    const supabase = getServiceSupabase();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("omPromotion")
      .select("*")
      .eq("omPromotionIsActive", true)
      .or(`omPromotionStartDate.is.null,omPromotionStartDate.lte.${today}`)
      .or(`omPromotionEndDate.is.null,omPromotionEndDate.gte.${today}`);
    return data || [];
  } catch (err) {
    console.error("[AI] Failed to fetch promotions:", err.message);
    return [];
  }
}

async function fetchRelatedProducts() {
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase.from("omRelatedProduct").select("*");
    return data || [];
  } catch (err) {
    console.error("[AI] Failed to fetch related products:", err.message);
    return [];
  }
}

function buildSystemPrompt(basePrompt, products, promotions, relatedProducts, settings) {
  let prompt = basePrompt;

  // Brand story / USP
  if (settings?.omAiSettingBrandStory) {
    prompt += `\n\n## เกี่ยวกับแบรนด์ของเรา\n${settings.omAiSettingBrandStory}`;
  }

  // Product catalog with enriched info
  if (products.length > 0) {
    prompt += `\n\n## สินค้าที่มีจำหน่าย\nใช้ข้อมูลนี้ในการตอบคำถามเกี่ยวกับสินค้าและราคา ห้ามบอกจำนวนสต๊อก:\n`;
    for (const p of products) {
      if (p.price > 0) {
        prompt += `- ${p.name} ราคา ${p.price.toLocaleString("th-TH")} บาท`;
      } else {
        prompt += `- ${p.name} (ยังไม่ระบุราคา)`;
      }
      if (p.category) prompt += ` [หมวด: ${p.category}]`;
      prompt += `\n`;
      if (p.highlights) prompt += `  จุดเด่น: ${p.highlights}\n`;
      if (p.description) prompt += `  รายละเอียด: ${p.description}\n`;
    }
    prompt += `\nถ้าลูกค้าถามสินค้าที่ไม่อยู่ในรายการ ให้บอกว่าสินค้ารุ่นนี้ไม่มีจำหน่ายในขณะนี้
ถ้าลูกค้าถามราคาสินค้าที่มีราคาอยู่แล้ว ให้บอกราคาตามข้อมูลข้างต้นได้เลย
ถ้าลูกค้าถามราคาสินค้าที่ยังไม่ระบุราคา ให้บอกว่ากรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามราคา`;
  }

  // Promotions
  if (promotions.length > 0) {
    prompt += `\n\n## โปรโมชั่นที่กำลังจัดอยู่ตอนนี้\nแนะนำโปรโมชั่นให้ลูกค้าเมื่อมีโอกาส เช่น เมื่อลูกค้าสนใจสินค้าหรือกำลังตัดสินใจ:\n`;
    for (const promo of promotions) {
      prompt += `- ${promo.omPromotionName}`;
      if (promo.omPromotionDescription) prompt += `: ${promo.omPromotionDescription}`;
      const applicableProducts = promo.omPromotionApplicableProducts || [];
      if (applicableProducts.length > 0) {
        prompt += ` [ใช้กับสินค้า: ${applicableProducts.join(", ")}]`;
      } else {
        prompt += ` [ใช้กับทุกสินค้า]`;
      }
      if (promo.omPromotionEndDate) prompt += ` (ถึง ${promo.omPromotionEndDate})`;
      prompt += `\n`;
    }
    prompt += `ใช้โปรโมชั่นเพื่อกระตุ้นการตัดสินใจ เช่น "ตอนนี้มีโปรพิเศษนะคะ..." หรือ "โปรนี้ใกล้หมดเขตแล้วนะคะ"\nสำคัญ: ถ้าโปรโมชั่นระบุสินค้าเฉพาะ ให้แนะนำโปรฯ เฉพาะเมื่อลูกค้าสนใจสินค้านั้นๆ เท่านั้น\n`;
  }

  // Cross-sell / Upsell
  if (relatedProducts.length > 0) {
    prompt += `\n\n## สินค้าแนะนำเพิ่มเติม (Cross-sell / Upsell)\nเมื่อลูกค้าเลือกสินค้าแล้ว ให้แนะนำสินค้าที่เกี่ยวข้องตามรายการนี้:\n`;
    for (const rp of relatedProducts) {
      const type = rp.omRelatedProductType === "upsell" ? "อัปเกรด" : "ใช้คู่กัน";
      prompt += `- ถ้าลูกค้าสนใจ ${rp.omRelatedProductSourceItem} → แนะนำ ${rp.omRelatedProductTargetItem} (${type})`;
      if (rp.omRelatedProductReason) prompt += ` เพราะ: ${rp.omRelatedProductReason}`;
      prompt += `\n`;
    }
    prompt += `แนะนำอย่างเป็นธรรมชาติ ไม่ยัดเยียด เช่น "หลายคนที่สั่งรุ่นนี้ มักจะสั่ง...ด้วยค่ะ"\n`;
  }

  // Shipping info
  if (settings?.omAiSettingShippingInfo) {
    prompt += `\n\n## ข้อมูลการจัดส่ง\n${settings.omAiSettingShippingInfo}\n`;
  }

  // After-sales / warranty
  if (settings?.omAiSettingAfterSalesInfo) {
    prompt += `\n\n## นโยบายหลังการขาย / การรับประกัน\n${settings.omAiSettingAfterSalesInfo}\n`;
  }

  // Sales closing process
  prompt += `

## เทคนิคการขาย
- เมื่อลูกค้าสนใจสินค้า ให้เน้นจุดเด่นของสินค้าและบอกว่าทำไมสินค้านี้ดี
- ถ้ามีโปรโมชั่นที่เกี่ยวข้อง ให้แจ้งลูกค้าทันที
- ถ้ามีสินค้าแนะนำเพิ่มเติม ให้แนะนำอย่างเป็นธรรมชาติ
- สร้างความมั่นใจโดยอ้างอิงจุดเด่นแบรนด์ ความนิยมของสินค้า หรือรีวิวจากลูกค้า
- ถ้าลูกค้ายังลังเล ให้ย้ำข้อดีของสินค้าและโปรโมชั่นที่ใกล้หมดเขต
- พูดเชิงบวก กระตือรือร้น แต่ไม่กดดันมากเกินไป

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

  const [settings, history, products, promotions, relatedProducts] = await Promise.all([
    getAiSettings(supabase),
    getConversationContext(conversationId, supabase),
    fetchProductCatalog(),
    fetchActivePromotions(),
    fetchRelatedProducts(),
  ]);

  const model = settings?.omAiSettingModel || "google/gemini-2.5-flash-lite";
  const temperature = Number(settings?.omAiSettingTemperature) || 0.3;
  const basePrompt =
    settings?.omAiSettingSystemPrompt ||
    "คุณเป็นพนักงานขายออนไลน์ที่เป็นมิตรและเชี่ยวชาญ ตอบเป็นภาษาไทย พูดจาสุภาพ กระตือรือร้น และพร้อมช่วยเหลือลูกค้าเสมอ";

  const systemPrompt = buildSystemPrompt(basePrompt, products, promotions, relatedProducts, settings);

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.omMessageSenderType === "customer" ? "user" : "assistant",
      content: msg.omMessageContent,
    })),
  ];


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

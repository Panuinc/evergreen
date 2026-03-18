import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import pdfParse from "pdf-parse";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_EXTRACTED_TEXT = 3000;

async function fetchProductCatalog() {
  try {
    const supabase = getServiceSupabase();
    const [itemsResult, priceResult, productInfoResult] = await Promise.all([
      supabase
        .from("bcItem")
        .select("bcItemNo,bcItemDescription")
        .eq("bcItemBlocked", false)
        .like("bcItemNo", "FG-00003%")
        .order("bcItemNo"),
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
      number: i.bcItemNo,
      name: i.bcItemDescription,
      price: priceMap[i.bcItemNo] || 0,
      description: infoMap[i.bcItemNo]?.omProductInfoDescription || null,
      highlights: infoMap[i.bcItemNo]?.omProductInfoHighlights || null,
      category: infoMap[i.bcItemNo]?.omProductInfoCategory || null,
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

## วิธีพูดคุยกับลูกค้า (สำคัญมาก)
- ตอบสั้นๆ กระชับ เหมือนคนแชทจริงๆ ไม่ต้องยาวเป็นย่อหน้า
- ห้ามลิสต์สินค้ายาวๆ ทีเดียว ให้ถามก่อนว่าลูกค้าต้องการแบบไหน แล้วค่อยแนะนำ 1-2 ตัวที่ตรงใจ
- ใช้ภาษาสุภาพเป็นมืออาชีพ เช่น "ตัวนี้ขายดีมากเลยค่ะ" แทน "สินค้ารายการนี้เป็นที่นิยม"
- ตอบทีละประเด็น อย่าตอบหลายเรื่องในข้อความเดียว
- ใช้คำลงท้าย "ค่ะ" และ "นะคะ" เท่านั้น ห้ามใช้ "น้า" "จ้า" "อ๋อ" หรือคำลงท้ายที่ไม่สุภาพ
- ถ้าลูกค้าถามสั้น ให้ตอบสั้นตาม ไม่ต้องอธิบายยืดยาว
- แสดงความเข้าใจลูกค้า เช่น "เข้าใจค่ะ" "ได้เลยค่ะ" ก่อนตอบเนื้อหา
- ห้ามต่อล้อต่อเถียงลูกค้า ถ้าลูกค้าไม่พอใจให้รับฟังและแจ้งว่าจะประสานงานให้
- ถ้าไม่มีข้อมูลตอบ หรือคำถามเกินขอบเขต ให้ตอบว่า "ขออภัยค่ะ ขอให้แอดมินติดต่อกลับเพื่อให้ข้อมูลที่ถูกต้องนะคะ" ห้ามเดาหรือตอบข้อมูลที่ไม่แน่ใจ

## เทคนิคการขาย
- แนะนำสินค้าทีละ 1-2 ตัว ไม่ยิงรายการยาวๆ
- ถ้ามีโปรโมชั่นที่เกี่ยวข้อง ให้แจ้งลูกค้าแบบกันเอง
- ถ้าลูกค้ายังลังเล ค่อยๆ ย้ำข้อดี ไม่กดดัน
- พูดเชิงบวก กระตือรือร้น แต่ไม่เยอะเกินไป

## ขั้นตอนการปิดการขาย
เมื่อลูกค้าต้องการสั่งซื้อ ให้ถามข้อมูลทีละข้อ ไม่ถามทีเดียวทั้งหมด:
1. สินค้าที่ต้องการ (รุ่น สี ขนาด)
2. จำนวน
3. ชื่อ-นามสกุล ผู้รับสินค้า
4. ที่อยู่จัดส่ง
5. เบอร์โทรติดต่อ

เมื่อได้ข้อมูลครบ ให้สรุปรายการสั่งซื้อและขอยืนยัน
ถ้าลูกค้ายืนยัน ให้แจ้งว่า "ขอบคุณค่ะ รับออเดอร์เรียบร้อยแล้วนะคะ เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันอีกครั้งค่ะ"

## การวิเคราะห์รูปภาพและไฟล์จากลูกค้า
เมื่อลูกค้าส่งรูปภาพมา:
1. รูปสินค้า/ตัวอย่าง → วิเคราะห์ว่าเป็นสินค้าประเภทอะไร แนะนำสินค้าที่ใกล้เคียงพร้อมราคา
2. รูปสลิป/หลักฐานชำระเงิน → ตอบว่า "ได้รับหลักฐานแล้วค่ะ เจ้าหน้าที่จะตรวจสอบให้นะคะ"
3. รูปสถานที่/หน้างาน → แนะนำสินค้าที่เหมาะกับพื้นที่นั้น
4. แบบแปลน/Shop Drawing/แบบก่อสร้าง → **สำคัญมาก** ต้องอ่านตัวเลขทุกตัวในแบบให้ละเอียด:
   - อ่านขนาดทั้งหมดที่ระบุในแบบ (กว้าง x สูง มม.) แยกระหว่างขนาดวงกบ ขนาดบาน ขนาดช่องเปิด
   - อ่านข้อความกำกับทั้งหมด เช่น วัสดุ (PVC, อลูมิเนียม), สี, ประเภท (บานเปิด, บานเลื่อน)
   - อ่านสัญลักษณ์ เช่น D1, W1 (รหัสประตู/หน้าต่าง)
   - ระบุข้อมูลทั้งหมดที่อ่านได้ให้ลูกค้าทราบ แล้วแนะนำสินค้าที่ตรงสเปคพร้อมราคา
   - ถ้ามีหลายมิติ เช่น ความกว้างช่องผนัง vs ความกว้างวงกบ vs ความกว้างบาน ให้แยกระบุให้ชัดเจน
5. ไม่แน่ใจ → ถามลูกค้าว่าต้องการสอบถามอะไรเพิ่ม

เมื่อลูกค้าส่งไฟล์ (PDF, เอกสาร):
- คุณสามารถอ่านเนื้อหาในไฟล์ PDF และไฟล์ข้อความได้ ให้วิเคราะห์เนื้อหาและแนะนำสินค้าที่เกี่ยวข้อง
- ถ้าไฟล์มีข้อมูลขนาด/สเปค/แบบแปลน ให้ใช้ข้อมูลนั้นในการแนะนำสินค้าที่เหมาะสมพร้อมราคา
- ถ้าอ่านเนื้อหาไม่ได้ ให้ถามลูกค้าว่าต้องการให้ช่วยอะไรเกี่ยวกับไฟล์นี้`;

  return prompt;
}

async function extractFileContent(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length > 10 * 1024 * 1024) return null; // 10MB limit

    // PDF
    if (contentType.includes("pdf") || url.match(/\.pdf(\?|$)/i)) {
      const parsed = await pdfParse(buffer);
      const text = (parsed.text || "").trim();
      return text ? text.slice(0, MAX_EXTRACTED_TEXT) : null;
    }

    // Plain text / CSV
    if (
      contentType.includes("text/") ||
      url.match(/\.(txt|csv)(\?|$)/i)
    ) {
      const text = buffer.toString("utf-8").trim();
      return text ? text.slice(0, MAX_EXTRACTED_TEXT) : null;
    }

    return null;
  } catch (err) {
    console.error("[AI] Failed to extract file content:", err.message);
    return null;
  }
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
    .select("omMessageSenderType, omMessageContent, omMessageType, omMessageImageUrl, omMessageCreatedAt")
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

  const model = settings?.omAiSettingModel || "google/gemini-2.5-flash";
  const temperature = Number(settings?.omAiSettingTemperature) || 0.3;
  const basePrompt =
    settings?.omAiSettingSystemPrompt ||
    "คุณเป็นพนักงานขายออนไลน์ที่สุภาพและเป็นมืออาชีพ ตอบเป็นภาษาไทย ใช้คำลงท้าย \"ค่ะ\" และ \"นะคะ\" เท่านั้น ห้ามใช้ \"น้า\" \"จ้า\" \"อ๋อ\" หรือคำที่ไม่สุภาพ ห้ามต่อล้อต่อเถียงลูกค้า";

  const systemPrompt = buildSystemPrompt(basePrompt, products, promotions, relatedProducts, settings);

  // Pre-extract file contents for non-visual files
  const fileExtractions = new Map();
  for (const msg of history) {
    if (
      msg.omMessageSenderType === "customer" &&
      (msg.omMessageType === "file") &&
      msg.omMessageImageUrl &&
      !/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(msg.omMessageImageUrl)
    ) {
      const text = await extractFileContent(msg.omMessageImageUrl);
      if (text) fileExtractions.set(msg.omMessageImageUrl, text);
    }
  }

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => {
      const role = msg.omMessageSenderType === "customer" ? "user" : "assistant";

      // Send image/file as multimodal content for customer messages
      if (role === "user" && (msg.omMessageType === "image" || msg.omMessageType === "file") && msg.omMessageImageUrl) {
        const url = msg.omMessageImageUrl;
        const isVisualFile = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);

        if (isVisualFile) {
          const parts = [];
          if (msg.omMessageContent && !["[image]", "[file]"].includes(msg.omMessageContent) && !msg.omMessageContent.startsWith("http")) {
            parts.push({ type: "text", text: msg.omMessageContent });
          }
          parts.push({ type: "text", text: "ลูกค้าส่งรูปภาพมา กรุณาดูรูปอย่างละเอียด ถ้าเป็นแบบแปลน/Shop Drawing ให้อ่านตัวเลขขนาดทุกตัว อ่านข้อความกำกับทุกจุด (วัสดุ สี ประเภท รหัส) แล้วสรุปสเปคให้ลูกค้าทราบ พร้อมแนะนำสินค้าที่ตรงสเปคและราคา ถ้าเป็นรูปสินค้า/สถานที่ ให้วิเคราะห์ว่าลูกค้าสนใจอะไรแล้วแนะนำสินค้าที่เกี่ยวข้อง" });
          parts.push({ type: "image_url", image_url: { url } });
          return { role, content: parts };
        }

        // Non-visual file (PDF, doc, etc.) — extract and send content
        const fileName = msg.omMessageContent && !["[file]"].includes(msg.omMessageContent) && !msg.omMessageContent.startsWith("http")
          ? msg.omMessageContent
          : "ไฟล์เอกสาร";
        const extracted = fileExtractions.get(url);
        if (extracted) {
          return { role, content: `ลูกค้าส่งไฟล์ "${fileName}" มา เนื้อหาในไฟล์:\n\n${extracted}\n\nกรุณาวิเคราะห์เนื้อหาไฟล์นี้ แล้วแนะนำสินค้าที่เหมาะสมพร้อมราคา ถ้ามีข้อมูลขนาด/สเปค ให้ใช้ข้อมูลนั้นในการแนะนำ` };
        }
        return { role, content: `ลูกค้าส่งไฟล์มา: ${fileName} — ตอบรับว่าได้รับไฟล์แล้ว และถามว่าต้องการสอบถามอะไรเพิ่มเติมเกี่ยวกับไฟล์นี้` };
      }

      return { role, content: msg.omMessageContent };
    }),
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

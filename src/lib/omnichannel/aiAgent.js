import { bcGet } from "@/lib/bcClient";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function fetchProductCatalog() {
  try {
    const filter =
      "blocked eq false and generalProductPostingGroupCode eq 'FG' and startswith(number,'FG-00003')";
    const rows = await bcGet("/items", { $filter: filter });
    return rows.map((i) => ({
      name: i.displayName,
    }));
  } catch (err) {
    console.error("[AI] Failed to fetch products:", err.message);
    return [];
  }
}

function buildSystemPrompt(basePrompt, products) {
  let prompt = basePrompt;
  if (products.length > 0) {
    prompt += `\n\n## สินค้าที่มีจำหน่าย\nใช้ข้อมูลนี้ในการตอบคำถามเกี่ยวกับสินค้า ห้ามบอกราคา ห้ามบอกจำนวนสต๊อก ห้ามบอกว่า 0 บาท:\n`;
    for (const p of products) {
      prompt += `- ${p.name}\n`;
    }
    prompt += `\nถ้าลูกค้าถามสินค้าที่ไม่อยู่ในรายการ ให้บอกว่าสินค้ารุ่นนี้ไม่มีจำหน่ายในขณะนี้
ถ้าลูกค้าถามราคา ให้บอกว่ากรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามราคา`;
  }
  return prompt;
}

export async function getAiSettings(supabase) {
  const { data } = await supabase
    .from("omAiSettings")
    .select("*")
    .limit(1)
    .single();
  return data;
}

export async function getConversationContext(conversationId, supabase, limit = 20) {
  const { data: messages } = await supabase
    .from("omMessages")
    .select("messageSenderType, messageContent, messageCreatedAt")
    .eq("messageConversationId", conversationId)
    .order("messageCreatedAt", { ascending: false })
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

  const model = settings?.aiModel || "google/gemini-2.5-flash-lite";
  const temperature = Number(settings?.aiTemperature) || 0.3;
  const basePrompt =
    settings?.aiSystemPrompt ||
    "คุณเป็นเจ้าหน้าที่บริการลูกค้า ตอบเป็นภาษาไทย";

  const systemPrompt = buildSystemPrompt(basePrompt, products);

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.messageSenderType === "customer" ? "user" : "assistant",
      content: msg.messageContent,
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

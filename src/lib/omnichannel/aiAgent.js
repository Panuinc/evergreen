import { bcGet } from "@/lib/bcClient";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const customerTools = [
  {
    type: "function",
    function: {
      name: "get_products",
      description: "ค้นหาสินค้า ราคา และจำนวนสต๊อก",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "ชื่อสินค้าที่ต้องการค้นหา (optional)",
          },
        },
      },
    },
  },
];

async function executeCustomerTool(name, args) {
  switch (name) {
    case "get_products": {
      const params = { $filter: "blocked eq false" };
      if (args?.search) {
        params.$filter += ` and contains(displayName,'${args.search}')`;
      }
      const rows = await bcGet("/items", params);
      return rows.map((i) => ({
        name: i.displayName,
        price: i.unitPrice,
        stock: i.inventory,
        number: i.number,
      }));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function callAI(messages, model, temperature) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: customerTools,
        temperature,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI API error: ${res.status} ${text}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
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
  const settings = await getAiSettings(supabase);
  const model = settings?.aiModel || "google/gemini-2.5-flash-lite";
  const temperature = Number(settings?.aiTemperature) || 0.3;
  const maxHistory = settings?.aiMaxHistoryMessages || 20;
  const systemPrompt =
    settings?.aiSystemPrompt ||
    "คุณเป็นเจ้าหน้าที่บริการลูกค้า ตอบเป็นภาษาไทย";

  const history = await getConversationContext(conversationId, supabase, maxHistory);

  const aiMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.messageSenderType === "customer" ? "user" : "assistant",
      content: msg.messageContent,
    })),
  ];

  // First call - check for tool calls
  const firstData = await callAI(aiMessages, model, temperature);
  const choice = firstData.choices?.[0];
  if (!choice) throw new Error("No response from AI");

  const hasToolCalls =
    choice.finish_reason === "tool_calls" &&
    choice.message?.tool_calls?.length > 0;

  if (!hasToolCalls) {
    return choice.message?.content || "";
  }

  // Execute tool calls
  const toolMessages = [...aiMessages, choice.message];
  for (const toolCall of choice.message.tool_calls) {
    try {
      const args = JSON.parse(toolCall.function.arguments || "{}");
      const result = await executeCustomerTool(toolCall.function.name, args);
      toolMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result ?? []),
      });
    } catch (toolError) {
      toolMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: toolError.message }),
      });
    }
  }

  // Final call with tool results
  const finalController = new AbortController();
  const finalTimeout = setTimeout(() => finalController.abort(), 60000);

  let finalData;
  try {
    const finalRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: toolMessages,
        temperature,
        stream: false,
      }),
      signal: finalController.signal,
    });

    if (!finalRes.ok) {
      const text = await finalRes.text();
      throw new Error(`AI API error (final): ${finalRes.status} ${text}`);
    }

    finalData = await finalRes.json();
  } finally {
    clearTimeout(finalTimeout);
  }
  return finalData.choices?.[0]?.message?.content || "";
}

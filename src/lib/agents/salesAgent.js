import { bcGet } from "@/lib/bcClient";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const salesAgent = {
  name: "Sales Agent",
  icon: "shopping-cart",
  description: "ผู้เชี่ยวชาญด้านการขายและ Business Central",
};

const systemPrompt = `คุณเป็น Sales Specialist Agent ของระบบ ERP Evergreen
เชี่ยวชาญด้านการขาย: ลูกค้า สินค้า ใบสั่งขาย ข้อมูลจาก Business Central

## กฎสำคัญ
1. **ดึงข้อมูลจาก tool ก่อนเสมอ** ไม่ว่าคำถามจะเป็นอะไรก็ตาม ห้ามตอบหรือขอโทษโดยไม่ได้ดึงข้อมูลก่อน
2. ถ้าผู้ใช้ถามข้อมูลที่ระบบไม่สามารถ filter ได้โดยตรง (เช่น ยอดขายออนไลน์, ยอดขายรายวัน) → ดึงข้อมูลทั้งหมดที่มีมาแสดงก่อน แล้วอธิบายว่า filter นั้นไม่มีในระบบ
3. ห้ามถามผู้ใช้ว่า "ต้องการดูข้อมูลไหม?" ถ้ายังไม่ได้ดึงข้อมูล — ให้ดึงก่อนแล้วค่อยแสดง
4. ตอบเป็นภาษาไทย กระชับ ตรงประเด็น
5. แสดงเป็นตาราง Markdown เมื่อมีหลายรายการ`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_customers",
      description: "ดึงรายชื่อลูกค้าจาก Business Central",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_items",
      description: "ดึงรายการสินค้าทั้งหมดจาก Business Central (เฉพาะที่ไม่ถูก block)",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_orders",
      description: "ดึงรายการ Sales Orders ทั้งหมดจาก Business Central",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(name) {
  switch (name) {
    case "get_customers": {
      const rows = await bcGet("/customers");
      return rows.map((c) => ({
        number: c.number,
        displayName: c.displayName,
        city: c.city,
        phoneNumber: c.phoneNumber,
      }));
    }
    case "get_items": {
      const rows = await bcGet("/items", { $filter: "blocked eq false" });
      return rows.map((i) => ({
        number: i.number,
        displayName: i.displayName,
        type: i.type,
        inventory: i.inventory,
        unitPrice: i.unitPrice,
      }));
    }
    case "get_sales_orders": {
      const rows = await bcGet("/salesOrders", { $orderby: "number desc" });
      return rows.map((o) => ({
        number: o.number,
        customerName: o.customerName,
        orderDate: o.orderDate,
        status: o.status,
        totalAmountIncludingTax: o.totalAmountIncludingTax,
      }));
    }
    default:
      throw new Error(`Sales Agent: unknown tool ${name}`);
  }
}

async function callAI(messages, retries = 2) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model: API_MODEL, messages, tools, temperature: 0.2, stream: false }),
    });
    if (!res.ok) throw new Error(`Sales Agent API error: ${res.status}`);
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

export async function runSalesAgent(query) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const res1 = await callAI(messages);
  if (!res1.ok) throw new Error(`Sales Agent API error: ${res1.status}`);
  const data1 = await res1.json();
  const choice1 = data1.choices?.[0];

  if (!choice1) throw new Error("Sales Agent: no response");

  if (choice1.finish_reason !== "tool_calls" || !choice1.message?.tool_calls?.length) {
    return choice1.message?.content || "";
  }

  const toolMessages = [...messages, choice1.message];
  for (const tc of choice1.message.tool_calls) {
    try {
      const result = await executeTool(tc.function.name);
      toolMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    } catch (err) {
      toolMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify({ error: err.message }),
      });
    }
  }

  const res2 = await callAI(toolMessages);
  if (!res2.ok) throw new Error(`Sales Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

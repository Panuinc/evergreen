import { withAuth } from "@/app/api/_lib/auth";
import { bcGet } from "@/lib/bcClient";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "moonshotai/kimi-k2.5";

const SYSTEM_PROMPT = `คุณเป็น AI assistant ของระบบ ERP ชื่อ Evergreen
คุณต้องตอบเป็นภาษาไทยเสมอ ยกเว้นผู้ใช้ถามเป็นภาษาอังกฤษ
สามารถช่วยตอบคำถามเกี่ยวกับ:
- ลูกค้า (Customers) จาก Business Central
- สินค้า (Items) จาก Business Central
- ใบสั่งขาย (Sales Orders) จาก Business Central
- พนักงาน (Employees) จาก Supabase
- แผนก (Departments) จาก Supabase
- ตำแหน่ง (Positions) จาก Supabase
- บทบาท (Roles) และสิทธิ์การเข้าถึง จาก Supabase
ตอบให้กระชับและเข้าใจง่าย ใช้ภาษาไทยเป็นหลัก`;

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
  {
    type: "function",
    function: {
      name: "get_employees",
      description: "ดึงรายชื่อพนักงานทั้งหมดจากระบบ HR",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_departments",
      description: "ดึงรายชื่อแผนกทั้งหมดจากระบบ HR",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_positions",
      description: "ดึงรายชื่อตำแหน่งงานทั้งหมดจากระบบ HR",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_roles",
      description: "ดึงรายชื่อบทบาท (Roles) ทั้งหมดจากระบบ RBAC",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(name, supabase) {
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
      const rows = await bcGet("/items", {
        $filter: "blocked eq false",
      });
      return rows.map((i) => ({
        number: i.number,
        displayName: i.displayName,
        type: i.type,
        inventory: i.inventory,
        unitPrice: i.unitPrice,
        unitCost: i.unitCost,
        generalProductPostingGroupCode: i.generalProductPostingGroupCode,
      }));
    }
    case "get_sales_orders": {
      const rows = await bcGet("/salesOrders", {
        $orderby: "number desc",
      });
      return rows.map((o) => ({
        number: o.number,
        customerName: o.customerName,
        orderDate: o.orderDate,
        status: o.status,
        totalAmountIncludingTax: o.totalAmountIncludingTax,
      }));
    }
    case "get_employees": {
      const { data } = await supabase
        .from("employees")
        .select("employeeId, employeeFirstName, employeeLastName, employeeEmail")
        .order("employeeCreatedAt", { ascending: false });
      return data;
    }
    case "get_departments": {
      const { data } = await supabase
        .from("departments")
        .select("departmentId, departmentName")
        .order("departmentName");
      return data;
    }
    case "get_positions": {
      const { data } = await supabase
        .from("positions")
        .select("positionId, positionTitle")
        .order("positionTitle");
      return data;
    }
    case "get_roles": {
      const { data } = await supabase
        .from("roles")
        .select("roleId, roleName")
        .order("roleCreatedAt", { ascending: false });
      return data;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function callAI(messages, stream = true) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: API_MODEL,
      messages,
      tools,
      temperature: 0.3,
      stream,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error: ${res.status} ${text}`);
  }

  return res;
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { messages } = await request.json();

    const allMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // First call — non-streaming to check for tool calls
    const firstRes = await callAI(allMessages, false);
    const firstData = await firstRes.json();

    const choice = firstData.choices?.[0];
    if (!choice) {
      console.error("AI response:", JSON.stringify(firstData));
      throw new Error("Invalid response from Kimi API");
    }

    const hasToolCalls =
      choice.finish_reason === "tool_calls" && choice.message?.tool_calls?.length > 0;

    // If no tool call, return the already-received response as SSE (no second API call)
    if (!hasToolCalls) {
      const content = choice.message?.content || "";
      const ssePayload = `data: ${JSON.stringify({
        choices: [{ delta: { content } }],
      })}\n\ndata: [DONE]\n\n`;

      return new Response(ssePayload, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Execute tool calls
    const toolMessages = [...allMessages, choice.message];

    for (const toolCall of choice.message.tool_calls) {
      try {
        const result = await executeTool(toolCall.function.name, auth.supabase);
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

    // Final call with tool results — streaming
    const finalRes = await callAI(toolMessages, true);
    return new Response(finalRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

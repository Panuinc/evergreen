const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const hrAgent = {
  name: "HR Agent",
  icon: "users",
  description: "ผู้เชี่ยวชาญด้านทรัพยากรบุคคล",
};

const systemPrompt = `คุณเป็น HR Specialist Agent ของระบบ ERP Evergreen
เชี่ยวชาญด้านทรัพยากรบุคคล: พนักงาน แผนก ตำแหน่ง สายงาน

## กฎสำคัญ
1. **ดึงข้อมูลจาก tool ก่อนเสมอ** ไม่ว่าคำถามจะเป็นอะไรก็ตาม ห้ามตอบหรือขอโทษโดยไม่ได้ดึงข้อมูลก่อน
2. ถ้าผู้ใช้ถามข้อมูลที่ระบบไม่สามารถ filter ได้โดยตรง → ดึงข้อมูลทั้งหมดที่มีมาแสดงก่อน แล้วอธิบายว่า filter นั้นไม่มีในระบบ
3. ห้ามถามผู้ใช้ว่า "ต้องการดูข้อมูลไหม?" ถ้ายังไม่ได้ดึงข้อมูล — ให้ดึงก่อนแล้วค่อยแสดง
4. ตอบเป็นภาษาไทย กระชับ ตรงประเด็น
5. แสดงเป็นตาราง Markdown เมื่อมีหลายรายการ`;

const tools = [
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
];

async function executeTool(name, supabase) {
  switch (name) {
    case "get_employees": {
      const { data } = await supabase
        .from("employees")
        .select("employeeId, employeeFirstName, employeeLastName, employeeEmail")
        .order("employeeCreatedAt", { ascending: false });
      return data ?? [];
    }
    case "get_departments": {
      const { data } = await supabase
        .from("departments")
        .select("departmentId, departmentName")
        .order("departmentName");
      return data ?? [];
    }
    case "get_positions": {
      const { data } = await supabase
        .from("positions")
        .select("positionId, positionTitle, positionDepartment")
        .order("positionTitle");
      return data ?? [];
    }
    default:
      throw new Error(`HR Agent: unknown tool ${name}`);
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
    if (!res.ok) throw new Error(`HR Agent API error: ${res.status}`);
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

export async function runHrAgent(query, supabase) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  // Round 1: check for tool calls
  const res1 = await callAI(messages);
  if (!res1.ok) throw new Error(`HR Agent API error: ${res1.status}`);
  const data1 = await res1.json();
  const choice1 = data1.choices?.[0];

  if (!choice1) throw new Error("HR Agent: no response");

  if (choice1.finish_reason !== "tool_calls" || !choice1.message?.tool_calls?.length) {
    return choice1.message?.content || "";
  }

  // Execute tool calls
  const toolMessages = [...messages, choice1.message];
  for (const tc of choice1.message.tool_calls) {
    try {
      const result = await executeTool(tc.function.name, supabase);
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

  // Round 2: final answer
  const res2 = await callAI(toolMessages);
  if (!res2.ok) throw new Error(`HR Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

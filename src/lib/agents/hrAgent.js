const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const hrAgent = {
  name: "HR Agent",
  icon: "users",
  description: "ผู้เชี่ยวชาญด้านทรัพยากรบุคคล",
};

const systemPrompt = `คุณเป็น HR Specialist Agent ของระบบ ERP Evergreen มีความเชี่ยวชาญสูงสุดด้านทรัพยากรบุคคล

## ข้อมูลที่คุณเข้าถึงได้
- **พนักงาน**: ชื่อ นามสกุล อีเมล (เรียงตามชื่อ)
- **แผนก**: รหัสแผนก ชื่อแผนก
- **ตำแหน่งงาน**: ชื่อตำแหน่ง แผนกที่สังกัด (positionDepartment)

## กฎเหล็ก
1. **ดึงข้อมูลจาก tool ก่อนเสมอ** ห้ามตอบหรือขอโทษโดยไม่ได้ดึงข้อมูลก่อน
2. ใช้ parameter **search** เมื่อถามถึงคนหรือตำแหน่งเฉพาะ อย่าดึงข้อมูลทั้งหมดโดยไม่จำเป็น
3. ถ้าถามหลายเรื่องพร้อมกัน → เรียก tool หลายตัวพร้อมกัน (parallel)
4. **วิเคราะห์และคำนวณเอง**: นับจำนวน จัดกลุ่ม คำนวณสัดส่วน สรุป insight
5. ตอบภาษาไทย กระชับ ตรงประเด็น ใช้ตาราง Markdown เมื่อมีหลายรายการ

## วิธีจัดการคำถามซับซ้อน
- "มีพนักงานกี่คนต่อแผนก" → get_employees (ทั้งหมด) + get_departments แล้วจับคู่นับเอง
- "หาพนักงานชื่อ X" → get_employees(search: "X")
- "มีตำแหน่งอะไรบ้างในแผนก Y" → get_positions(department: "Y")
- "โครงสร้างองค์กรทั้งหมด" → get_departments + get_positions พร้อมกัน`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_employees",
      description: "ดึงรายชื่อพนักงาน สามารถค้นหาด้วยชื่อหรือนามสกุลได้",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "ค้นหาพนักงานด้วยชื่อหรือนามสกุล (บางส่วนก็ได้) เช่น 'สมชาย'",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_departments",
      description: "ดึงรายชื่อแผนกทั้งหมดในองค์กร",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_positions",
      description: "ดึงรายชื่อตำแหน่งงานทั้งหมด สามารถกรองตามแผนกได้",
      parameters: {
        type: "object",
        properties: {
          department: {
            type: "string",
            description: "กรองตามชื่อหรือรหัสแผนก (บางส่วนก็ได้)",
          },
        },
      },
    },
  },
];

async function executeTool(name, args, supabase) {
  switch (name) {
    case "get_employees": {
      let q = supabase
        .from("employees")
        .select("employeeId, employeeFirstName, employeeLastName, employeeEmail")
        .order("employeeFirstName");
      if (args.search) {
        q = q.or(
          `employeeFirstName.ilike.%${args.search}%,employeeLastName.ilike.%${args.search}%`,
        );
      }
      const { data } = await q;
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
      let q = supabase
        .from("positions")
        .select("positionId, positionTitle, positionDepartment")
        .order("positionTitle");
      if (args.department) {
        q = q.ilike("positionDepartment", `%${args.department}%`);
      }
      const { data } = await q;
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
      body: JSON.stringify({ model: API_MODEL, messages, tools, temperature: 0.1, stream: false }),
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

  const res1 = await callAI(messages);
  if (!res1.ok) throw new Error(`HR Agent API error: ${res1.status}`);
  const data1 = await res1.json();
  const choice1 = data1.choices?.[0];

  if (!choice1) throw new Error("HR Agent: no response");

  if (choice1.finish_reason !== "tool_calls" || !choice1.message?.tool_calls?.length) {
    return choice1.message?.content || "";
  }

  // Execute all tool calls in parallel
  const toolResults = await Promise.all(
    choice1.message.tool_calls.map(async (tc) => {
      try {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        const result = await executeTool(tc.function.name, args, supabase);
        return { role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) };
      } catch (err) {
        return { role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: err.message }) };
      }
    }),
  );

  const toolMessages = [...messages, choice1.message, ...toolResults];

  const res2 = await callAI(toolMessages);
  if (!res2.ok) throw new Error(`HR Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

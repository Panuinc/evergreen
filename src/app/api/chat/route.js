import { withAuth } from "@/app/api/_lib/auth";
import { hrAgent, runHrAgent } from "@/lib/agents/hrAgent";
import { salesAgent, runSalesAgent } from "@/lib/agents/salesAgent";
import { tmsAgent, runTmsAgent } from "@/lib/agents/tmsAgent";
import { financeAgent, runFinanceAgent } from "@/lib/agents/financeAgent";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

const AGENT_MAP = {
  ask_hr_agent: { meta: hrAgent, run: runHrAgent, needsSupabase: true },
  ask_sales_agent: { meta: salesAgent, run: runSalesAgent, needsSupabase: false },
  ask_tms_agent: { meta: tmsAgent, run: runTmsAgent, needsSupabase: true },
  ask_finance_agent: { meta: financeAgent, run: runFinanceAgent, needsSupabase: false },
};

function buildOrchestratorPrompt() {
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "full",
    timeStyle: "short",
  });

  return `คุณเป็น Orchestrator AI ของระบบ ERP Evergreen บริษัท ชี้อะฮะฮวด อุตสาหกรรม จำกัด
ตอบเป็นภาษาไทยเสมอ ยกเว้นเมื่อผู้ใช้ถามเป็นภาษาอังกฤษ

**วันที่และเวลาปัจจุบัน (เขตเวลาไทย):** ${now}

## บทบาทของคุณ
รับคำถามจากผู้ใช้ → วิเคราะห์ → ส่งต่อ specialist agent ที่เชี่ยวชาญที่สุด

## Specialist Agents ที่มี
| Agent | เชี่ยวชาญ | ข้อมูลที่มี |
|-------|-----------|------------|
| **ask_hr_agent** | HR & พนักงาน | พนักงาน แผนก ตำแหน่ง |
| **ask_sales_agent** | Sales & BC | ลูกค้า สินค้า ใบสั่งขาย ยอดขายรวม |
| **ask_tms_agent** | ขนส่ง & โลจิสติกส์ | รถ คนขับ Shipment น้ำมัน ซ่อมบำรุง |
| **ask_finance_agent** | การเงิน & บัญชี | ยอดขาย หนี้ลูกค้า ออเดอร์ค้างส่ง |

## กฎการทำงาน
1. **ข้อมูลในระบบ** → ส่งต่อ agent ที่ตรงที่สุด
2. **คำถามข้ามหลายด้าน** → เรียก agent หลายตัว**พร้อมกัน** (parallel)
3. **คำถามทั่วไป** (วันที่ เวลา ความรู้ทั่วไป ถามเกี่ยวกับระบบ) → ตอบเองโดยไม่ต้องใช้ agent
4. สรุปคำตอบจาก agent ให้กระชับ ตรงประเด็น
5. แสดงข้อมูลหลายรายการเป็น**ตาราง Markdown** เสมอ
6. ไฮไลต์ตัวเลขสำคัญด้วย **ตัวหนา**

## ตัวอย่างการ routing (สำคัญมาก)
| คำถาม | agent ที่ต้องใช้ |
|-------|----------------|
| ยอดขาย รายได้ รายรับ ยอดรวม | **ask_finance_agent** |
| หนี้ค้างชำระ ลูกหนี้ balanceDue | **ask_finance_agent** |
| ออเดอร์ค้างส่ง ยังไม่จัดส่ง | **ask_finance_agent** |
| ลูกค้า สินค้า สต๊อก inventory | **ask_sales_agent** |
| ใบสั่งขาย order รายการสั่งซื้อ | **ask_sales_agent** |
| พนักงาน แผนก ตำแหน่ง | **ask_hr_agent** |
| รถ คนขับ shipment น้ำมัน ซ่อม | **ask_tms_agent** |

## กฎเพิ่มเติม
- **ห้ามตอบเองว่าไม่พบข้อมูล** ถ้าคำถามเกี่ยวกับข้อมูลในระบบ → ส่งให้ agent เสมอ
- ส่ง query ที่**ชัดเจนและครบถ้วน** รวมถึงกรอบเวลา เงื่อนไข
- ถ้าผู้ใช้พูดว่า "เดือนนี้" ให้แปลงเป็นวันที่จริงก่อนส่ง (เดือนนี้ = ตั้งแต่ ${new Date().toISOString().slice(0, 7)}-01)
- ถ้าผู้ใช้พูดว่า "ปีนี้" ให้แปลงเป็น ${new Date().getFullYear()}-01-01
- ถ้าผู้ใช้พูดว่า "กุมภาพันธ์" หรือ "เดือน 2" ปีนี้ = since: "${new Date().getFullYear()}-02-01" until: "${new Date().getFullYear()}-02-28"

## โมดูลในระบบ Evergreen
ถ้าถามเรื่องโมดูลที่ agent ไม่รู้ → แนะนำเมนูที่ต้องไป:
- Marketing / Omnichannel → เมนู Marketing > Omnichannel
- Config / Settings → เมนู Settings > Config Check
- Access Control / Roles → เมนู Access Control`;
}

const orchestratorTools = [
  {
    type: "function",
    function: {
      name: "ask_hr_agent",
      description: "ถาม HR Agent เรื่องพนักงาน แผนก ตำแหน่งงาน โครงสร้างองค์กร headcount",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการ — ระบุให้ชัดเจน รวมถึงกรอบเวลา เงื่อนไข ถ้ามี" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_sales_agent",
      description: "ถาม Sales Agent เรื่องลูกค้า สินค้า ใบสั่งขาย ยอดขาย สต๊อก Business Central",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการ — ระบุให้ชัดเจน รวมถึงกรอบเวลา เงื่อนไข ถ้ามี" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_tms_agent",
      description: "ถาม TMS Agent เรื่องรถ คนขับ Shipment น้ำมัน ซ่อมบำรุง ใบขับขี่หมดอายุ",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการ — ระบุให้ชัดเจน รวมถึงกรอบเวลา เงื่อนไข ถ้ามี" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_finance_agent",
      description: "ถาม Finance Agent เรื่องยอดขายรวม รายได้ หนี้ลูกค้า ค้างชำระ ออเดอร์ค้างส่ง งบการเงิน",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการ — ระบุให้ชัดเจน รวมถึงกรอบเวลา เงื่อนไข ถ้ามี" },
        },
        required: ["query"],
      },
    },
  },
];

async function callOrchestrator(messages, stream = false, retries = 2) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages,
        tools: orchestratorTools,
        temperature: 0.2,
        stream,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Orchestrator API error: ${res.status} ${text}`);
    }

    return res;
  } catch (err) {
    const isReset = err.cause?.code === "ECONNRESET" || err.cause?.errno === -4077;
    if (retries > 0 && isReset) {
      await new Promise((r) => setTimeout(r, 600));
      return callOrchestrator(messages, stream, retries - 1);
    }
    throw err;
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { messages } = await request.json();

    const allMessages = [
      { role: "system", content: buildOrchestratorPrompt() },
      ...messages,
    ];


    const firstRes = await callOrchestrator(allMessages, false);
    const firstData = await firstRes.json();

    const choice = firstData.choices?.[0];
    if (!choice) throw new Error("Orchestrator: invalid response");

    const hasToolCalls =
      choice.finish_reason === "tool_calls" && choice.message?.tool_calls?.length > 0;


    if (!hasToolCalls) {
      const content = choice.message?.content || "";
      const ssePayload =
        `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n` +
        `data: [DONE]\n\n`;

      return new Response(ssePayload, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }


    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeSSE = (data) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

    (async () => {
      try {

        await Promise.all(
          choice.message.tool_calls.map(async (toolCall) => {
            const agentEntry = AGENT_MAP[toolCall.function.name];
            if (agentEntry) {
              await writeSSE({
                type: "agent_start",
                agentName: agentEntry.meta.name,
                agentIcon: agentEntry.meta.icon,
              });
            }
          }),
        );


        const agentResults = await Promise.all(
          choice.message.tool_calls.map(async (toolCall) => {
            const toolName = toolCall.function.name;
            const agentEntry = AGENT_MAP[toolName];

            if (!agentEntry) {
              return {
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: `Unknown agent: ${toolName}` }),
              };
            }

            try {
              let args = {};
              try { args = JSON.parse(toolCall.function.arguments || "{}"); } catch {}
              const query = args.query || allMessages[allMessages.length - 1]?.content || "";

              const result = agentEntry.needsSupabase
                ? await agentEntry.run(query, auth.supabase)
                : await agentEntry.run(query);

              return { tool_call_id: toolCall.id, content: result || "(ไม่มีข้อมูล)" };
            } catch (agentErr) {
              return {
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: agentErr.message }),
              };
            }
          }),
        );


        const toolMessages = [
          ...allMessages,
          choice.message,
          ...agentResults.map((r) => ({
            role: "tool",
            tool_call_id: r.tool_call_id,
            content: r.content,
          })),
        ];


        const finalRes = await callOrchestrator(toolMessages, true);
        const reader = finalRes.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const errMsg =
          `data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n⚠️ เกิดข้อผิดพลาด: ${err.message}` } }] })}\n\n` +
          `data: [DONE]\n\n`;
        await writer.write(encoder.encode(errMsg));
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
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

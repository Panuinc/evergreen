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
คุณทำหน้าที่รับคำถามจากผู้ใช้และประสานงานกับ specialist agents ที่เชี่ยวชาญในแต่ละด้าน:

- **ask_hr_agent** → คำถามเกี่ยวกับ HR: พนักงาน แผนก ตำแหน่ง สายงาน การจ้างงาน
- **ask_sales_agent** → คำถามเกี่ยวกับ Sales/BC: ลูกค้า สินค้า ใบสั่งขาย Business Central
- **ask_tms_agent** → คำถามเกี่ยวกับ TMS: รถ คนขับ shipment เส้นทาง เชื้อเพลิง การซ่อมบำรุง GPS
- **ask_finance_agent** → คำถามเกี่ยวกับการเงิน: บัญชี งบประมาณ รายงานการเงิน

## แนวทาง
1. ถ้าคำถามเกี่ยวกับ**ข้อมูลในระบบ** → ส่งต่อให้ agent ที่เหมาะสม
2. ถ้าคำถามเกี่ยวข้องหลายด้าน → เรียกหลาย agent พร้อมกันได้
3. ถ้าเป็นคำถาม**ทั่วไป** (วันที่ เวลา ความรู้ทั่วไป) → ตอบได้เลยโดยไม่ต้องใช้ agent
4. สรุปคำตอบจาก agent ต่างๆ เป็นภาษาไทย กระชับ ตรงประเด็น
5. แสดงข้อมูลหลายรายการเป็น**ตาราง Markdown** เสมอ

## โมดูลทั้งหมดในระบบ Evergreen
ถ้าถามเรื่องโมดูลที่ไม่มี agent ให้แนะนำเมนูที่ต้องไปแทน:
- **Overview** → dashboard, analytics, activities
- **HR** → พนักงาน แผนก ตำแหน่ง (ใช้ ask_hr_agent)
- **Sales/BC** → ลูกค้า สินค้า ใบสั่งขาย (ใช้ ask_sales_agent)
- **TMS** → รถ คนขับ shipment (ใช้ ask_tms_agent)
- **Finance** → การเงิน บัญชี (ใช้ ask_finance_agent)
- **Marketing** → omnichannel chat → เมนู Marketing > Omnichannel
- **RBAC** → roles, permissions → เมนู Access Control
- **Settings** → config check → เมนู Settings`;
}

const orchestratorTools = [
  {
    type: "function",
    function: {
      name: "ask_hr_agent",
      description: "ส่งคำถามให้ HR Agent ผู้เชี่ยวชาญด้านทรัพยากรบุคคล (พนักงาน แผนก ตำแหน่ง)",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการถาม HR Agent" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_sales_agent",
      description: "ส่งคำถามให้ Sales Agent ผู้เชี่ยวชาญด้านการขายและ Business Central (ลูกค้า สินค้า ใบสั่งขาย)",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการถาม Sales Agent" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_tms_agent",
      description: "ส่งคำถามให้ TMS Agent ผู้เชี่ยวชาญด้านการขนส่ง (รถ คนขับ shipment เชื้อเพลิง ซ่อมบำรุง)",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการถาม TMS Agent" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_finance_agent",
      description: "ส่งคำถามให้ Finance Agent ผู้เชี่ยวชาญด้านการเงินและบัญชี",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำถามที่ต้องการถาม Finance Agent" },
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
        temperature: 0.3,
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

    // Step 1: Orchestrator decides what to do (non-streaming)
    const firstRes = await callOrchestrator(allMessages, false);
    const firstData = await firstRes.json();

    const choice = firstData.choices?.[0];
    if (!choice) {
      throw new Error("Orchestrator: invalid response");
    }

    const hasToolCalls =
      choice.finish_reason === "tool_calls" && choice.message?.tool_calls?.length > 0;

    // No tool calls → direct answer (general question)
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

    // Step 2: Execute specialist agents via custom ReadableStream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const writeSSE = (data) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

    (async () => {
      try {
        const toolMessages = [...allMessages, choice.message];

        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          const agentEntry = AGENT_MAP[toolName];

          if (!agentEntry) {
            toolMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: `Unknown agent: ${toolName}` }),
            });
            continue;
          }

          // Notify client which agent is now working
          await writeSSE({
            type: "agent_start",
            agentName: agentEntry.meta.name,
            agentIcon: agentEntry.meta.icon,
          });

          try {
            let args = {};
            try {
              args = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              args = {};
            }

            const query = args.query || allMessages[allMessages.length - 1]?.content || "";

            let result;
            if (agentEntry.needsSupabase) {
              result = await agentEntry.run(query, auth.supabase);
            } else {
              result = await agentEntry.run(query);
            }

            toolMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result || "(ไม่มีข้อมูล)",
            });
          } catch (agentErr) {
            toolMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: agentErr.message }),
            });
          }
        }

        // Step 3: Orchestrator synthesizes and streams final answer
        const finalRes = await callOrchestrator(toolMessages, true);
        const reader = finalRes.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const errMsg = `data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n⚠️ เกิดข้อผิดพลาด: ${err.message}` } }] })}\n\ndata: [DONE]\n\n`;
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

import { withAuth } from "@/app/api/_lib/auth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const GEMINI_MODEL = "google/gemini-2.5-flash-lite";

const CLAUDE_MODEL = "anthropic/claude-sonnet-4-5";


const extractTool = {
  type: "function",
  function: {
    name: "extract_door_specs",
    description:
      "ดึงสเปคประตูจากเอกสาร/รูปภาพ/PDF ที่ผู้ใช้ส่งมา อาจมีหลาย door type ในเอกสารเดียว — ใช้เมื่อมีไฟล์แนบ",
    parameters: {
      type: "object",
      required: ["doors"],
      properties: {
        doors: {
          type: "array",
          description: "รายการประตูทุก type ที่พบในเอกสาร",
          items: {
            type: "object",
            properties: {
              doorCode: {
                type: "string",
                description: "รหัสประตู เช่น D01, D02, D18",
              },
              doorName: {
                type: "string",
                description: "ชื่อ/ประเภท เช่น Entrance, Bedroom, ประตูห้องพัก",
              },
              orderQty: {
                type: "string",
                description: "จำนวนที่สั่ง (บาน) ถ้าระบุในเอกสาร เช่น 10, 25",
              },
              doorThickness: {
                type: "string",
                description: "ความหนา (มม.) เช่น 45",
              },
              doorWidth: {
                type: "string",
                description: "ความกว้างบาน (มม.) เช่น 900",
              },
              doorHeight: {
                type: "string",
                description: "ความสูงบาน (มม.) เช่น 2000",
              },
              surfaceMaterial: {
                type: "string",
                description: "วัสดุผิว เช่น Laminate, HPL, Veneer, HDF, MDF",
              },
              surfaceThickness: {
                type: "string",
                description: "ความหนาวัสดุผิว (มม.) เช่น 4, 6",
              },
              coreType: {
                type: "string",
                enum: [
                  "foam",
                  "plywood_strips",
                  "particle_solid",
                  "rockwool",
                  "honeycomb",
                  "particle_strips",
                ],
                description:
                  "ประเภทไส้: foam=โฟม, plywood_strips=ไม้อัดเส้น, particle_solid=ปาร์ติเคิลแผ่น, rockwool=ร็อควูล, honeycomb=รังผึ้ง, particle_strips=ปาร์ติเคิลเส้น",
              },
              edgeBanding: {
                type: "boolean",
                description: "ทำขอบหรือไม่",
              },
              notes: {
                type: "string",
                description: "ข้อสังเกตสำคัญ เช่น fire-rated, special finish",
              },
            },
          },
        },
      },
    },
  },
};


const fillTool = {
  type: "function",
  function: {
    name: "fill_bom_form",
    description:
      "กรอกข้อมูล BOM form สำหรับประตู 1 บาน — ใช้เมื่อผู้ใช้พิมพ์บอกสเปคโดยตรง (ไม่มีไฟล์แนบ)",
    parameters: {
      type: "object",
      properties: {
        customerPO: { type: "string" },
        orderQty: { type: "string" },
        doorCode: { type: "string", description: "รหัสประตู เช่น D18, D22, D01 — ใส่ตามที่ระบุในเอกสาร" },
        doorThickness: { type: "string" },
        doorWidth: { type: "string" },
        doorHeight: { type: "string" },
        surfaceMaterial: { type: "string" },
        surfacePrice: { type: "string" },
        surfaceThickness: { type: "string" },
        coreType: {
          type: "string",
          enum: [
            "foam",
            "plywood_strips",
            "particle_solid",
            "rockwool",
            "honeycomb",
            "particle_strips",
          ],
        },
        edgeBanding: { type: "boolean" },
      },
    },
  },
};

function buildSystemPrompt(bomState, hasImage) {
  const stateText =
    bomState && Object.values(bomState).some((v) => v !== "" && v !== null && v !== undefined)
      ? `\n## สถานะฟอร์ม BOM ปัจจุบัน\n${Object.entries(bomState)
          .filter(([, v]) => v !== "" && v !== null && v !== undefined)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")}\n`
      : "";

  return `คุณเป็นผู้ช่วย AI ผู้เชี่ยวชาญระบบถอด BOM ประตูไม้ของ Evergreen${hasImage ? " (ทำงานร่วมกับ Gemini สำหรับอ่านเอกสาร)" : ""}
ตอบเป็นภาษาไทยเสมอ กระชับ ตรงประเด็น
${stateText}
## กฎหลัก
${hasImage
  ? `- มีไฟล์แนบ → ใช้ extract_door_specs เสมอ ดึงประตู**ทุก type** ที่เจอในเอกสาร
- ถ้าไม่เห็นขนาด doorWidth/doorHeight ชัดเจนในตาราง ให้ดูจากตัวเลขในรูปวาด
- ขนาดช่องปูน ≠ ขนาดบาน (หักประมาณ 20 มม. ต่อด้าน)
- doorCode คือรหัสที่ระบุในเอกสาร เช่น D01, D18, D22 — ต้องดึงมาให้ครบทุก type`
  : `- ไม่มีไฟล์ แต่ผู้ใช้บอกสเปค → ใช้ fill_bom_form
- วิเคราะห์ BOM / แนะนำวัสดุ / ประเมินต้นทุน → ตอบเองโดยใช้ข้อมูลจาก bomState
- คำถามทั่วไป → ตอบเองไม่ต้องใช้ tool`}

## การ map วัสดุ
### Door Face / Surface
- "Veneer X" → surfaceMaterial="Veneer X", surfaceThickness=4 (ถ้าไม่ระบุ)
- "HPL" / "High Pressure Laminate" → surfaceMaterial="HPL"
- "Laminate" / "ลามิเนต" → surfaceMaterial="Laminate"
- "Plywood X mm" → surfaceThickness=X, surfaceMaterial="Plywood"
- "HDF" → surfaceMaterial="HDF"

### Core Type
- "Solid Wood" / "Solid wood Ripping" / "โครงเคร่าไม้เนื้อแข็ง กรุไม้อัด" → plywood_strips
- "WPC" → particle_solid
- "Foam" / "โฟม" → foam
- "Rock wool" / "ร็อควูล" / "Magnesium Oxide" / "Fire Resistant" → rockwool
- "Honeycomb" / "รังผึ้ง" → honeycomb
- "sound absorbency" → plywood_strips (ถ้าไม่แน่ใจ)

### Door Type
- "HDF Door" / "HDF" → doorType="HDF Door"
- "WPC Door" / "WPC" → doorType="WPC Door"
- "Solid Wood Door" / "ไม้เนื้อแข็ง" → doorType="Solid Wood Door"
- "Flush Door" → doorType="Flush Door"
- "Fire Door" / "Fire Resistant" → doorType="Fire Door"
- ถ้าไม่ระบุชัดเจน ดูจากโครงสร้างและวัสดุแล้วสรุปประเภทเอง

### Order Quantity
- ถ้ามีตาราง BOM หรือ Schedule of Door ให้ดูจำนวนแต่ละ type เช่น "Qty: 25 Nos." → orderQty=25
- ถ้าไม่มีให้ว่างไว้

### Sizing
- "Sizing 45mm Thickness" → doorThickness=45
- "40mm Thickness" → doorThickness=40
- ขนาดบาน: ดูจาก "บานประตู ขนาด XXXX x XXXX" หรือตัวเลขในรูป`;
}

async function callAI(messages, tools, stream = false, model = CLAUDE_MODEL, retries = 2) {
  const body = JSON.stringify({
    model,
    messages,
    tools: tools.length > 0 ? tools : undefined,
    temperature: 0.2,
    stream,
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI API error: ${res.status} ${text}`);
      }
      return res;
    } catch (err) {
      const isRetryable = err.cause?.code === "ECONNRESET" || err.cause?.code === "ECONNREFUSED" || err.message?.includes("fetch failed");
      if (isRetryable && attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (isRetryable) {
        throw new Error("ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง (ECONNRESET)");
      }
      throw err;
    }
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { messages = [], bomState, image } = body;
    const hasImage = !!image;


    if (image && image.length > 5 * 1024 * 1024) {
      return Response.json(
        { error: "ไฟล์ใหญ่เกินไป กรุณาบีบอัดหรือใช้ไฟล์ขนาดไม่เกิน 3.5MB" },
        { status: 413 },
      );
    }


    const builtMessages = messages.map((m, i) => {
      if (i === messages.length - 1 && m.role === "user" && image) {
        return {
          role: "user",
          content: [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: image } },
          ],
        };
      }
      return m;
    });

    const allMessages = [
      { role: "system", content: buildSystemPrompt(bomState, hasImage) },
      ...builtMessages,
    ];


    const tools = hasImage ? [extractTool, fillTool] : [fillTool];



    const step1Model = hasImage ? GEMINI_MODEL : CLAUDE_MODEL;
    const firstRes = await callAI(allMessages, tools, false, step1Model);
    const firstData = await firstRes.json();
    const choice = firstData.choices?.[0];
    if (!choice) throw new Error("AI: invalid response");

    const hasToolCall =
      choice.finish_reason === "tool_calls" && choice.message?.tool_calls?.length > 0;

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const writeSSE = (data) =>
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

    (async () => {
      try {
        if (hasToolCall) {
          const toolCall = choice.message.tool_calls[0];
          let args = {};
          try { args = JSON.parse(toolCall.function.arguments || "{}"); } catch {}

          if (toolCall.function.name === "extract_door_specs") {


            const geminiDoors = args.doors || [];



            let finalDoors = geminiDoors;
            try {
              const validateMessages = [
                {
                  role: "system",
                  content: `คุณเป็นผู้เชี่ยวชาญ BOM ประตูไม้ของ Evergreen
ตรวจสอบข้อมูลที่ AI อ่านจากเอกสารแล้วแก้ไขให้ถูกต้องตามกฎต่อไปนี้:

### coreType mapping (แก้ให้เป็น enum ที่ถูกต้อง)
- Solid Wood / Solid wood Ripping / โครงเคร่าไม้เนื้อแข็ง → plywood_strips
- WPC / Particle board solid / ไม้อัดแผ่น → particle_solid
- Foam / โฟม → foam
- Rock wool / ร็อควูล / Magnesium Oxide / Fire Resistant / fire-rated → rockwool
- Honeycomb / รังผึ้ง → honeycomb
- Particle strips / ปาร์ติเคิลเส้น → particle_strips

### surfaceMaterial (ทำให้เป็นชื่อมาตรฐาน)
- Veneer → "Veneer" (surfaceThickness=4 ถ้าไม่ระบุ)
- HPL / High Pressure Laminate → "HPL"
- Laminate / ลามิเนต → "Laminate"
- HDF → "HDF"
- MDF → "MDF"

### ตรวจสอบขนาด
- doorWidth ควรน้อยกว่า doorHeight เสมอ (ถ้าสลับให้แก้)
- doorThickness ปกติ 35–55 มม.
- doorWidth ปกติ 700–1200 มม.
- doorHeight ปกติ 2000–2400 มม.

ถ้าข้อมูลถูกต้องแล้วให้ส่งกลับโดยไม่แก้ไข ตอบเป็นภาษาไทย`,
                },
                {
                  role: "user",
                  content: `Gemini อ่านเอกสารได้ข้อมูลประตูดังนี้:\n${JSON.stringify(geminiDoors, null, 2)}\n\nตรวจสอบและแก้ไขให้ถูกต้อง แล้วใช้ extract_door_specs tool ส่งผลลัพธ์`,
                },
              ];
              const validateRes = await callAI(validateMessages, [extractTool], false, CLAUDE_MODEL);
              const validateData = await validateRes.json();
              const validateChoice = validateData.choices?.[0];
              if (validateChoice?.finish_reason === "tool_calls") {
                const claudeArgs = JSON.parse(
                  validateChoice.message.tool_calls[0].function.arguments || "{}",
                );
                if (claudeArgs.doors?.length > 0) finalDoors = claudeArgs.doors;
              }
            } catch {

            }


            await writeSSE({
              type: "bom_action",
              action: { type: "extract_doors", doors: finalDoors },
            });


            const summaryMessages = [
              {
                role: "system",
                content: "คุณเป็นผู้ช่วย BOM ประตูของ Evergreen ตอบภาษาไทย กระชับ",
              },
              {
                role: "user",
                content: `Gemini อ่านเอกสาร Claude ตรวจสอบแล้ว — พบประตู ${finalDoors.length} type: ${finalDoors.map((d) => d.doorCode || d.doorName || "?").join(", ")}
สรุปสิ่งที่อ่านได้ในประโยคสั้นๆ และแจ้งถ้ามีการแก้ไขข้อมูลจาก Gemini`,
              },
            ];
            const finalRes = await callAI(summaryMessages, [], true, CLAUDE_MODEL);
            const reader = finalRes.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              await writer.write(value);
            }

          } else if (toolCall.function.name === "fill_bom_form") {

            await writeSSE({
              type: "bom_action",
              action: { type: "fill_form", fields: args },
            });

            const confirmMessages = [
              ...allMessages,
              choice.message,
              {
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({ ok: true, filled: Object.keys(args) }),
              },
            ];
            const finalRes = await callAI(confirmMessages, [], true, CLAUDE_MODEL);
            const reader = finalRes.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              await writer.write(value);
            }
          }

        } else {



          const content = choice.message?.content || "";
          if (content) {
            await writeSSE({ choices: [{ delta: { content } }] });
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        await writeSSE({
          choices: [{ delta: { content: `\n\n⚠️ เกิดข้อผิดพลาด: ${err.message}` } }],
        });
        await writer.write(encoder.encode("data: [DONE]\n\n"));
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
    console.error("BOM AI error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

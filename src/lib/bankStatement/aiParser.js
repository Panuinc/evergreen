

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `คุณเป็น AI ที่เชี่ยวชาญในการอ่านและแยกข้อมูลจาก Bank Statement (ใบแจ้งยอดธนาคาร)
ทั้งไทยและอังกฤษ ทุกธนาคาร (KBANK, BBL, SCB, KTB, TMB, BAY, UOBT, TBANK, LHBANK ฯลฯ)

หน้าที่: รับ raw text จาก PDF แล้ว extract ข้อมูลเป็น structured JSON

กฎสำคัญ:
- ตรวจจับธนาคารอัตโนมัติจากข้อความ
- amount ต้องเป็นตัวเลขบวกเสมอ (absolute value)
- direction: "credit" = เงินเข้า/ฝาก, "debit" = เงินออก/ถอน/โอนออก/ชำระ
- txDate ต้องเป็น ISO format: YYYY-MM-DD
- txTime เป็น HH:MM หรือ HH:MM:SS
- ถ้าปีเป็น พ.ศ. ให้แปลงเป็น ค.ศ. (ลบ 543)
- ถ้าปีเป็น 2 หลัก (เช่น 26) ให้ใส่ 20 นำหน้า (2026)
- openingBalance/closingBalance จาก ยอดยกมา/ยอดยกไป หรือ beginning/ending balance
- ห้ามข้ามรายการ ต้อง extract ทุกรายการที่เป็น transaction`;

const USER_PROMPT = `อ่าน Bank Statement text ด้านล่าง แล้วตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block):

{
  "metadata": {
    "bankCode": "KBANK|BBL|SCB|KTB|...",
    "accountNumber": "xxx-x-xxxxx-x",
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "openingBalance": 0.00,
    "closingBalance": 0.00
  },
  "entries": [
    {
      "lineNumber": 1,
      "txDate": "YYYY-MM-DD",
      "txTime": "HH:MM",
      "channel": "K BIZ",
      "description": "โอนไป X4117 นาย พงษ์ศิริ บุญศิ++",
      "txType": "โอนเงิน",
      "amount": 909.50,
      "balance": 7617298.75,
      "direction": "debit"
    }
  ]
}

===== BANK STATEMENT TEXT =====
`;


function openRouterRequest(apiKey, body) {
  return new Promise((resolve, reject) => {
    const https = require("https");
    const url = new URL(API_URL);

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://evergreen.app",
          "X-Title": "Bank Statement Parser",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`API error ${res.statusCode}: ${data.slice(0, 200)}`));
          } else {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error("Invalid JSON response from API"));
            }
          }
        });
      },
    );

    req.setTimeout(120_000, () => {
      req.destroy();
      reject(new Error("Request timeout (120s)"));
    });
    req.on("error", (e) => reject(new Error(`Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}


export async function aiParseBankStatement(text, bankCodeHint) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const userMessage = bankCodeHint
    ? `ธนาคาร: ${bankCodeHint}\n\n${USER_PROMPT}${text}`
    : `${USER_PROMPT}${text}`;

  const body = JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0,
    stream: false,
  });

  console.log(`[AI Parse] Sending ${text.length} chars to AI (body: ${body.length} bytes)`);


  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await openRouterRequest(apiKey, body);
      const content = data.choices?.[0]?.message?.content || "";

      if (!content) {
        throw new Error("AI returned empty response");
      }

      console.log(`[AI Parse] Got response (${content.length} chars)`);


      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error("Failed to parse AI JSON: " + e.message);
      }

      if (!parsed.metadata || !Array.isArray(parsed.entries)) {
        throw new Error("AI response missing metadata or entries");
      }


      const entries = parsed.entries.map((e, i) => ({
        lineNumber: e.lineNumber || i + 1,
        txDate: e.txDate || null,
        txTime: e.txTime || null,
        channel: e.channel || null,
        description: e.description || "",
        txType: e.txType || e.description || "",
        amount: Math.abs(Number(e.amount) || 0),
        balance: Number(e.balance) || 0,
        direction: e.direction === "credit" ? "credit" : "debit",
      }));

      const metadata = {
        bankCode: parsed.metadata.bankCode || bankCodeHint || "UNKNOWN",
        accountNumber: parsed.metadata.accountNumber || null,
        periodStart: parsed.metadata.periodStart || null,
        periodEnd: parsed.metadata.periodEnd || null,
        openingBalance:
          parsed.metadata.openingBalance != null
            ? Number(parsed.metadata.openingBalance)
            : null,
        closingBalance:
          parsed.metadata.closingBalance != null
            ? Number(parsed.metadata.closingBalance)
            : null,
      };

      console.log(
        `[AI Parse] Success: ${entries.length} entries, bank=${metadata.bankCode}`,
      );
      return { metadata, entries };
    } catch (err) {
      lastError = err;
      console.warn(`[AI Parse] Attempt ${attempt}/3 failed:`, err.message);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  throw lastError || new Error("AI parse failed after 3 attempts");
}

import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const financeAgent = {
  name: "Finance Agent",
  icon: "landmark",
  description: "ผู้เชี่ยวชาญด้านการเงินและบัญชี",
};

const systemPrompt = `คุณเป็น Finance Specialist Agent ของระบบ ERP Evergreen มีความเชี่ยวชาญสูงสุดด้านการเงินและบัญชี

## ข้อมูลที่คุณเข้าถึงได้
- **ยอดขาย (bcSalesOrder)**: ยอดรวม status วันที่ salesperson ลูกค้า สถานะจัดส่ง
- **หนี้ลูกค้า (bcCustomer)**: balance = ยอดค้างชำระทั้งหมด, balanceDue = ยอดที่เกินกำหนดชำระ
- **ออเดอร์ค้างส่ง**: ออเดอร์ที่ completelyShipped=false พร้อมมูลค่า

## ความรู้เฉพาะทาง
- **balance** = ยอดคงค้างทั้งหมดในระบบ BC (รวมยังไม่ถึงกำหนด)
- **balanceDue** = ยอดที่ **เกินกำหนดชำระแล้ว** (ต้องติดตามด่วน)
- **totalAmountIncludingTax** = ยอดขายรวม VAT
- **status "Released"** = ออเดอร์ confirmed รอจัดส่ง
- **salespersonCode "ONLINE"** = ช่องทางออนไลน์ (LINE/Facebook)
- Gross Margin = (unitPrice - unitCost) / unitPrice × 100

## กฎเหล็ก
1. **ดึงข้อมูลจาก tool ก่อนเสมอ** ห้ามตอบโดยไม่มีข้อมูล
2. ใช้ **parameter กรองวันที่** เสมอเมื่อถามเรื่องช่วงเวลา (เดือนนี้, ปีนี้ ฯลฯ)
3. ถ้าถามหลายเรื่องพร้อมกัน → เรียก tool พร้อมกัน (parallel)
4. **คำนวณและวิเคราะห์เอง**: % growth, ยอดเฉลี่ย, จัดอันดับลูกค้า, สรุป risk
5. ตอบภาษาไทย กระชับ ตรงประเด็น ใช้ตาราง Markdown และไฮไลต์จำนวนเงินด้วย **ตัวหนา**

## วิธีจัดการคำถามซับซ้อน
- "รายได้เดือนนี้" → get_revenue_summary(since: "2026-02-01")
- "ลูกค้าค้างชำระ" → get_customer_balances(hasDebt: true, sortBy: "balanceDue")
- "ยอดขายแต่ละ salesperson" → get_revenue_summary(groupBy: "salesperson")
- "ออเดอร์ที่ยังไม่ส่ง มูลค่าเท่าไหร่" → get_outstanding_orders()
- "ลูกค้า top 10 ตามยอดซื้อ" → get_revenue_summary(groupBy: "customer") แล้วเรียงลำดับ`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_revenue_summary",
      description: "สรุปยอดขายและรายได้ รวม/จัดกลุ่มตาม salesperson, ลูกค้า, status, หรือเดือน",
      parameters: {
        type: "object",
        properties: {
          since: { type: "string", description: "วันเริ่มต้น (YYYY-MM-DD) เช่น '2026-02-01' สำหรับเดือนนี้, '2026-01-01' สำหรับปีนี้" },
          until: { type: "string", description: "วันสิ้นสุด (YYYY-MM-DD)" },
          salespersonCode: { type: "string", description: "กรองเฉพาะ salesperson เช่น 'ONLINE'" },
          groupBy: {
            type: "string",
            enum: ["salesperson", "customer", "status", "month"],
            description: "จัดกลุ่มผลลัพธ์เพื่อเปรียบเทียบ",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_balances",
      description: "ดูยอดหนี้ค้างชำระ (balance) และยอดเกินกำหนด (balanceDue) ของลูกค้า",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "ค้นหาชื่อลูกค้า" },
          sortBy: {
            type: "string",
            enum: ["bcCustomerBalanceDue", "bcCustomerBalance", "bcCustomerDisplayName"],
            description: "เรียงตาม: bcCustomerBalanceDue (เกินกำหนด), bcCustomerBalance (ค้างทั้งหมด), bcCustomerDisplayName (ชื่อ) — default: bcCustomerBalanceDue",
          },
          limit: { type: "number", description: "จำนวนสูงสุด (default: 20)" },
          hasDebt: { type: "boolean", description: "true = แสดงเฉพาะลูกค้าที่มียอดค้างชำระ (bcCustomerBalanceDue > 0)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_outstanding_orders",
      description: "ดูออเดอร์ที่ยังค้างส่ง (completelyShipped=false) พร้อมมูลค่ารวม",
      parameters: {
        type: "object",
        properties: {
          salespersonCode: { type: "string", description: "กรองตาม salesperson" },
          since: { type: "string", description: "กรองตามวันที่ order (YYYY-MM-DD)" },
          limit: { type: "number", description: "จำนวนสูงสุด (default: 50)" },
        },
      },
    },
  },
];

async function executeTool(name, args) {
  const supabase = getServiceSupabase();

  switch (name) {
    case "get_revenue_summary": {
      let q = supabase
        .from("bcSalesOrder")
        .select("bcSalesOrderNumber,bcSalesOrderCustomerNumber,bcSalesOrderCustomerName,bcSalesOrderDate,bcSalesOrderStatus,bcSalesOrderCompletelyShipped,bcSalesOrderSalespersonCode,bcSalesOrderTotalAmountIncVat");
      if (args.since) q = q.gte("bcSalesOrderDate", args.since);
      if (args.until) q = q.lte("bcSalesOrderDate", args.until);
      if (args.salespersonCode) q = q.eq("bcSalesOrderSalespersonCode", args.salespersonCode);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);

      const orders = rows || [];
      const totalRevenue = orders.reduce((s, o) => s + (o.bcSalesOrderTotalAmountIncVat || 0), 0);
      const result = {
        totalOrders: orders.length,
        totalRevenue,
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        shippedOrders: orders.filter((o) => o.bcSalesOrderCompletelyShipped).length,
        pendingOrders: orders.filter((o) => !o.bcSalesOrderCompletelyShipped).length,
        pendingRevenue: orders.filter((o) => !o.bcSalesOrderCompletelyShipped).reduce((s, o) => s + (o.bcSalesOrderTotalAmountIncVat || 0), 0),
      };

      if (args.groupBy === "salesperson") {
        const g = {};
        for (const o of orders) {
          const k = o.bcSalesOrderSalespersonCode || "ไม่ระบุ";
          if (!g[k]) g[k] = { salespersonCode: k, orders: 0, revenue: 0 };
          g[k].orders++;
          g[k].revenue += o.bcSalesOrderTotalAmountIncVat || 0;
        }
        result.byGroup = Object.values(g).sort((a, b) => b.revenue - a.revenue);
      } else if (args.groupBy === "customer") {
        const g = {};
        for (const o of orders) {
          const k = o.bcSalesOrderCustomerNumber;
          if (!g[k]) g[k] = { customerNumber: k, customerName: o.bcSalesOrderCustomerName, orders: 0, revenue: 0 };
          g[k].orders++;
          g[k].revenue += o.bcSalesOrderTotalAmountIncVat || 0;
        }
        result.byGroup = Object.values(g).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
      } else if (args.groupBy === "status") {
        const g = {};
        for (const o of orders) {
          const k = o.bcSalesOrderStatus || "ไม่ระบุ";
          if (!g[k]) g[k] = { status: k, orders: 0, revenue: 0 };
          g[k].orders++;
          g[k].revenue += o.bcSalesOrderTotalAmountIncVat || 0;
        }
        result.byGroup = Object.values(g);
      } else if (args.groupBy === "month") {
        const g = {};
        for (const o of orders) {
          const k = o.bcSalesOrderDate ? o.bcSalesOrderDate.slice(0, 7) : "ไม่ระบุ";
          if (!g[k]) g[k] = { month: k, orders: 0, revenue: 0 };
          g[k].orders++;
          g[k].revenue += o.bcSalesOrderTotalAmountIncVat || 0;
        }
        result.byGroup = Object.values(g).sort((a, b) => a.month.localeCompare(b.month));
      }

      return result;
    }

    case "get_customer_balances": {
      const sortCol = args.sortBy || "bcCustomerBalanceDue";
      let q = supabase
        .from("bcCustomer")
        .select("bcCustomerNumber,bcCustomerDisplayName,bcCustomerPhoneNumber,bcCustomerBalance,bcCustomerBalanceDue,bcCustomerSalespersonCode")
        .order(sortCol, { ascending: false })
        .limit(args.limit || 20);
      if (args.search) q = q.ilike("bcCustomerDisplayName", `%${args.search}%`);
      if (args.hasDebt) q = q.gt("bcCustomerBalanceDue", 0);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const rows = data || [];
      return {
        count: rows.length,
        totalBalance: rows.reduce((s, c) => s + (c.bcCustomerBalance || 0), 0),
        totalBalanceDue: rows.reduce((s, c) => s + (c.bcCustomerBalanceDue || 0), 0),
        customers: rows,
      };
    }

    case "get_outstanding_orders": {
      let q = supabase
        .from("bcSalesOrder")
        .select("bcSalesOrderNumber,bcSalesOrderCustomerNumber,bcSalesOrderCustomerName,bcSalesOrderDate,bcSalesOrderDueDate,bcSalesOrderStatus,bcSalesOrderSalespersonCode,bcSalesOrderTotalAmountIncVat")
        .eq("bcSalesOrderCompletelyShipped", false)
        .neq("bcSalesOrderStatus", "Open")
        .order("bcSalesOrderDueDate", { ascending: true })
        .limit(args.limit || 50);
      if (args.salespersonCode) q = q.eq("bcSalesOrderSalespersonCode", args.salespersonCode);
      if (args.since) q = q.gte("bcSalesOrderDate", args.since);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const rows = data || [];
      return {
        count: rows.length,
        totalValue: rows.reduce((s, o) => s + (o.bcSalesOrderTotalAmountIncVat || 0), 0),
        orders: rows,
      };
    }

    default:
      throw new Error(`Finance Agent: unknown tool ${name}`);
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
    if (!res.ok) throw new Error(`Finance Agent API error: ${res.status}`);
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

export async function runFinanceAgent(query) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const res1 = await callAI(messages);
  if (!res1.ok) throw new Error(`Finance Agent API error: ${res1.status}`);
  const data1 = await res1.json();
  const choice1 = data1.choices?.[0];

  if (!choice1) throw new Error("Finance Agent: no response");

  if (choice1.finish_reason !== "tool_calls" || !choice1.message?.tool_calls?.length) {
    return choice1.message?.content || "";
  }

  // Execute all tool calls in parallel
  const toolResults = await Promise.all(
    choice1.message.tool_calls.map(async (tc) => {
      try {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        const result = await executeTool(tc.function.name, args);
        return { role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) };
      } catch (err) {
        return { role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: err.message }) };
      }
    }),
  );

  const toolMessages = [...messages, choice1.message, ...toolResults];

  const res2 = await callAI(toolMessages);
  if (!res2.ok) throw new Error(`Finance Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

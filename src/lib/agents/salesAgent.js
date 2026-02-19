import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const salesAgent = {
  name: "Sales Agent",
  icon: "shopping-cart",
  description: "ผู้เชี่ยวชาญด้านการขายและ Business Central",
};

const systemPrompt = `คุณเป็น Sales Specialist Agent ของระบบ ERP Evergreen มีความเชี่ยวชาญสูงสุดด้านการขายและ Business Central

## ข้อมูลที่คุณเข้าถึงได้
- **ลูกค้า (bcCustomers)**: number, displayName, phoneNumber, contact, balance, balanceDue, salespersonCode
- **สินค้า (bcItems)**: number, displayName, type, inventory, unitPrice, unitCost, itemCategoryCode, baseUnitOfMeasure, blocked
- **ใบสั่งขาย (bcSalesOrders)**: number, customerName, orderDate, dueDate, status, completelyShipped, salespersonCode, externalDocumentNumber, totalAmountIncludingTax
- **รายการสินค้าในใบสั่งขาย (bcSalesOrderLines)**: description, quantity, unitPrice, amountIncludingTax, quantityShipped, unitOfMeasureCode

## ความรู้เฉพาะทาง
- **status ของ order**: "Open" = ร่าง, "Released" = ยืนยันแล้ว รอจัดส่ง, "Pending Approval" = รอ approve
- **completelyShipped**: true = จัดส่งครบแล้ว, false = ยังค้างส่ง
- **salespersonCode "ONLINE"** = ช่องทางออนไลน์ (LINE/Facebook)
- **balance** = ยอดค้างชำระทั้งหมด, **balanceDue** = ยอดที่เกินกำหนด
- **externalDocumentNumber** = เลข PO หรือเลขอ้างอิงของลูกค้า

## กฎเหล็ก
1. **ดึงข้อมูลจาก tool ก่อนเสมอ** ห้ามตอบโดยไม่มีข้อมูล
2. ใช้ **parameter กรองที่ DB** ไม่ดึงมาทั้งหมดโดยไม่จำเป็น
3. ถ้าถามสรุป/ยอดรวม → ใช้ **get_sales_summary** แทน get_sales_orders
4. ถ้าถามหลายเรื่องพร้อมกัน → เรียก tool พร้อมกัน (parallel)
5. **คำนวณเองได้**: รวม เฉลี่ย จัดอันดับ คำนวณ margin, % shipped
6. ตอบภาษาไทย กระชับ ตรงประเด็น ใช้ตาราง Markdown เมื่อมีหลายรายการ

## วิธีจัดการคำถามซับซ้อน
- "ยอดขายเดือนนี้" → get_sales_summary(since: "2026-02-01")
- "order ที่ยังค้างส่ง" → get_sales_orders(status: "Released") แล้วกรอง completelyShipped=false
- "ลูกค้า X สั่งอะไรบ้าง" → get_customers(search:"X") เพื่อหา customerNumber แล้ว get_sales_orders(customerNumber)
- "สินค้า FG มีของเท่าไหร่" → get_items(search:"FG", inStockOnly:false)`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_customers",
      description: "ดึงรายชื่อลูกค้า สามารถค้นหาด้วยชื่อหรือกรองตาม salesperson ได้",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "ค้นหาชื่อลูกค้า (บางส่วนก็ได้)" },
          salespersonCode: { type: "string", description: "กรองตาม salesperson เช่น 'ONLINE'" },
          limit: { type: "number", description: "จำนวนสูงสุด (default: 100)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_items",
      description: "ดึงรายการสินค้า สามารถค้นหา กรองตามหมวดหมู่ หรือดูเฉพาะที่มีสต๊อก",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "ค้นหาชื่อหรือรหัสสินค้า" },
          category: { type: "string", description: "กรองตาม itemCategoryCode" },
          inStockOnly: { type: "boolean", description: "true = เฉพาะสินค้าที่มีสต๊อก (inventory > 0)" },
          limit: { type: "number", description: "จำนวนสูงสุด (default: 100)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_orders",
      description: "ดึงใบสั่งขายพร้อมรายการสินค้า สามารถกรองตาม status, วันที่, salesperson, ลูกค้า",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "กรองตาม status: 'Open', 'Released', 'Pending Approval'" },
          salespersonCode: { type: "string", description: "กรองตาม salesperson เช่น 'ONLINE'" },
          customerNumber: { type: "string", description: "กรองตามรหัสลูกค้า" },
          since: { type: "string", description: "วันเริ่มต้น (YYYY-MM-DD) เช่น '2026-02-01'" },
          limit: { type: "number", description: "จำนวนสูงสุด (default: 30)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_summary",
      description: "สรุปยอดขายรวม จำนวน order ค่าเฉลี่ย สามารถจัดกลุ่มตาม salesperson, ลูกค้า, สถานะ, เดือน",
      parameters: {
        type: "object",
        properties: {
          since: { type: "string", description: "วันเริ่มต้น (YYYY-MM-DD)" },
          until: { type: "string", description: "วันสิ้นสุด (YYYY-MM-DD)" },
          salespersonCode: { type: "string", description: "กรองเฉพาะ salesperson นี้" },
          groupBy: {
            type: "string",
            enum: ["salesperson", "customer", "status", "month"],
            description: "จัดกลุ่มผลลัพธ์ตาม",
          },
        },
      },
    },
  },
];

async function executeTool(name, args) {
  const supabase = getServiceSupabase();
  switch (name) {
    case "get_customers": {
      let q = supabase
        .from("bcCustomers")
        .select("number,displayName,phoneNumber,contact,balance,balanceDue,salespersonCode")
        .order("displayName")
        .limit(args.limit || 100);
      if (args.search) q = q.ilike("displayName", `%${args.search}%`);
      if (args.salespersonCode) q = q.eq("salespersonCode", args.salespersonCode);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    }

    case "get_items": {
      let q = supabase
        .from("bcItems")
        .select("number,displayName,type,inventory,unitPrice,unitCost,itemCategoryCode,baseUnitOfMeasure,blocked")
        .eq("blocked", false)
        .order("number")
        .limit(args.limit || 100);
      if (args.search) {
        q = q.or(`number.ilike.%${args.search}%,displayName.ilike.%${args.search}%`);
      }
      if (args.category) q = q.eq("itemCategoryCode", args.category);
      if (args.inStockOnly) q = q.gt("inventory", 0);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data || [];
    }

    case "get_sales_orders": {
      let q = supabase
        .from("bcSalesOrders")
        .select("number,customerNumber,customerName,orderDate,dueDate,status,completelyShipped,salespersonCode,externalDocumentNumber,totalAmountIncludingTax")
        .order("orderDate", { ascending: false })
        .limit(args.limit || 30);
      if (args.status) q = q.eq("status", args.status);
      if (args.salespersonCode) q = q.eq("salespersonCode", args.salespersonCode);
      if (args.customerNumber) q = q.eq("customerNumber", args.customerNumber);
      if (args.since) q = q.gte("orderDate", args.since);
      const { data: orders, error: oErr } = await q;
      if (oErr) throw new Error(oErr.message);

      if (!orders?.length) return [];

      const orderNos = orders.map((o) => o.number);
      const { data: lines, error: lErr } = await supabase
        .from("bcSalesOrderLines")
        .select("documentNo,lineObjectNumber,description,quantity,unitPrice,amountIncludingTax,quantityShipped,unitOfMeasureCode")
        .in("documentNo", orderNos);
      if (lErr) throw new Error(lErr.message);

      const linesByOrder = {};
      for (const l of lines || []) {
        if (!linesByOrder[l.documentNo]) linesByOrder[l.documentNo] = [];
        linesByOrder[l.documentNo].push({
          no: l.lineObjectNumber,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineAmount: l.amountIncludingTax,
          quantityShipped: l.quantityShipped,
          uom: l.unitOfMeasureCode,
        });
      }
      return orders.map((o) => ({ ...o, lines: linesByOrder[o.number] || [] }));
    }

    case "get_sales_summary": {
      let q = supabase
        .from("bcSalesOrders")
        .select("number,customerNumber,customerName,orderDate,status,completelyShipped,salespersonCode,totalAmountIncludingTax");
      if (args.since) q = q.gte("orderDate", args.since);
      if (args.until) q = q.lte("orderDate", args.until);
      if (args.salespersonCode) q = q.eq("salespersonCode", args.salespersonCode);
      const { data: orders, error } = await q;
      if (error) throw new Error(error.message);

      const rows = orders || [];
      const totalRevenue = rows.reduce((s, o) => s + (o.totalAmountIncludingTax || 0), 0);
      const result = {
        totalOrders: rows.length,
        totalRevenue,
        avgOrderValue: rows.length > 0 ? Math.round(totalRevenue / rows.length) : 0,
        shippedOrders: rows.filter((o) => o.completelyShipped).length,
        pendingOrders: rows.filter((o) => !o.completelyShipped).length,
      };

      if (args.groupBy === "salesperson") {
        const groups = {};
        for (const o of rows) {
          const key = o.salespersonCode || "ไม่ระบุ";
          if (!groups[key]) groups[key] = { salespersonCode: key, orders: 0, revenue: 0 };
          groups[key].orders++;
          groups[key].revenue += o.totalAmountIncludingTax || 0;
        }
        result.byGroup = Object.values(groups).sort((a, b) => b.revenue - a.revenue);
      } else if (args.groupBy === "customer") {
        const groups = {};
        for (const o of rows) {
          const key = o.customerNumber;
          if (!groups[key]) groups[key] = { customerNumber: key, customerName: o.customerName, orders: 0, revenue: 0 };
          groups[key].orders++;
          groups[key].revenue += o.totalAmountIncludingTax || 0;
        }
        result.byGroup = Object.values(groups).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
      } else if (args.groupBy === "status") {
        const groups = {};
        for (const o of rows) {
          const key = o.status || "ไม่ระบุ";
          if (!groups[key]) groups[key] = { status: key, orders: 0, revenue: 0 };
          groups[key].orders++;
          groups[key].revenue += o.totalAmountIncludingTax || 0;
        }
        result.byGroup = Object.values(groups);
      } else if (args.groupBy === "month") {
        const groups = {};
        for (const o of rows) {
          const month = o.orderDate ? o.orderDate.slice(0, 7) : "ไม่ระบุ";
          if (!groups[month]) groups[month] = { month, orders: 0, revenue: 0 };
          groups[month].orders++;
          groups[month].revenue += o.totalAmountIncludingTax || 0;
        }
        result.byGroup = Object.values(groups).sort((a, b) => a.month.localeCompare(b.month));
      }

      return result;
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
      body: JSON.stringify({ model: API_MODEL, messages, tools, temperature: 0.1, stream: false }),
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
  if (!res2.ok) throw new Error(`Sales Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

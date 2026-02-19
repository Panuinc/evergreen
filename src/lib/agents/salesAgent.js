import { bcODataGet } from "@/lib/bcClient";

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
5. แสดงเป็นตาราง Markdown เมื่อมีหลายรายการ

## ข้อมูลที่มีในแต่ละ tool
- get_customers: No, Name, Phone_No, Contact (channel-group-type code)
- get_items: No, Description, Type, Inventory, Unit_Price, Unit_Cost, Base_Unit_of_Measure (Item_Card_Excel)
- get_sales_orders: หัว order + line items รวม totalAmount (50 order ล่าสุด)
  - header: No, Sell_to_Customer_Name, Order_Date, Status, Completely_Shipped, Salesperson_Code
  - lines: No (item), Description, Quantity, Unit_Price, Line_Amount, Quantity_Shipped`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_customers",
      description: "ดึงรายชื่อลูกค้าจาก Business Central (CustomerList OData)",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_items",
      description: "ดึงรายการสินค้าทั้งหมดจาก Business Central (Item_Card_Excel OData) เฉพาะที่ไม่ถูก block",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_orders",
      description: "ดึง Sales Orders 50 รายการล่าสุดจาก Business Central พร้อม line items และ totalAmount (OData)",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(name) {
  switch (name) {
    case "get_customers": {
      const rows = await bcODataGet("CustomerList", {
        $select: "No,Name,Phone_No,Contact",
        $orderby: "No asc",
      });
      return rows.map((c) => ({
        no: c.No,
        name: c.Name,
        phone: c.Phone_No,
        contact: c.Contact,
      }));
    }

    case "get_items": {
      const rows = await bcODataGet("Item_Card_Excel", {
        $filter: "Blocked eq false",
        $select: "No,Description,Inventory,Unit_Price,Unit_Cost,Blocked,Type,Base_Unit_of_Measure",
        $orderby: "No asc",
      });
      return rows.map((i) => ({
        no: i.No,
        description: i.Description,
        type: i.Type,
        inventory: i.Inventory,
        unitPrice: i.Unit_Price,
        unitCost: i.Unit_Cost,
        uom: i.Base_Unit_of_Measure,
      }));
    }

    case "get_sales_orders": {
      // Fetch orders and their lines in parallel
      const [orders, allLines] = await Promise.all([
        bcODataGet("Sales_Order_Excel", {
          $orderby: "Order_Date desc",
          $top: "50",
          $select:
            "No,Sell_to_Customer_No,Sell_to_Customer_Name,Order_Date,Due_Date,Status,Completely_Shipped,Salesperson_Code,External_Document_No",
        }),
        bcODataGet("Sales_Order_Line_Excel", {
          $select:
            "Document_No,No,Description,Quantity,Unit_Price,Line_Amount,Quantity_Shipped,Unit_of_Measure_Code",
        }),
      ]);

      // Build a set of order numbers for fast lookup
      const orderNos = new Set(orders.map((o) => o.No));

      // Filter lines to only those belonging to fetched orders
      const linesByOrder = {};
      for (const line of allLines) {
        if (!orderNos.has(line.Document_No)) continue;
        if (!linesByOrder[line.Document_No]) linesByOrder[line.Document_No] = [];
        linesByOrder[line.Document_No].push({
          no: line.No,
          description: line.Description,
          quantity: line.Quantity,
          unitPrice: line.Unit_Price,
          lineAmount: line.Line_Amount,
          quantityShipped: line.Quantity_Shipped,
          uom: line.Unit_of_Measure_Code,
        });
      }

      return orders.map((o) => {
        const lines = linesByOrder[o.No] || [];
        const totalAmount = lines.reduce((s, l) => s + (l.lineAmount || 0), 0);
        return {
          no: o.No,
          customerNo: o.Sell_to_Customer_No,
          customerName: o.Sell_to_Customer_Name,
          orderDate: o.Order_Date,
          dueDate: o.Due_Date,
          status: o.Status,
          completelyShipped: o.Completely_Shipped,
          salespersonCode: o.Salesperson_Code,
          externalDocNo: o.External_Document_No,
          totalAmount,
          lines,
        };
      });
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

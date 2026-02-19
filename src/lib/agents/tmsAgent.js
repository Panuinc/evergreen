const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const tmsAgent = {
  name: "TMS Agent",
  icon: "truck",
  description: "ผู้เชี่ยวชาญด้านการขนส่งและโลจิสติกส์",
};

const systemPrompt = `คุณเป็น TMS Specialist Agent ของระบบ ERP Evergreen มีความเชี่ยวชาญสูงสุดด้านการขนส่งและโลจิสติกส์

## ข้อมูลที่คุณเข้าถึงได้
- **รถ (vehicles)**: ชื่อ ทะเบียน ประเภท ยี่ห้อ รุ่น ปี สถานะ เลขไมล์ เชื้อเพลิง ความจุ วันหมดทะเบียน วันหมดประกัน
- **คนขับ (drivers)**: ชื่อ เบอร์โทร เลขใบขับขี่ ประเภทใบขับขี่ วันหมดอายุ บทบาท สถานะ
- **Shipment**: หมายเลข ลูกค้า ปลายทาง สถานะ วันที่จะถึง น้ำหนัก วันที่สร้าง
- **บันทึกเติมน้ำมัน (fuelLogs)**: วันที่ ประเภทน้ำมัน ลิตร ราคาต่อลิตร ยอดรวม เลขไมล์ ปั๊ม รหัสรถ
- **ซ่อมบำรุง (maintenances)**: ประเภท รายละเอียด วันที่ สถานะ ค่าใช้จ่าย ผู้ให้บริการ วันนัดครั้งถัดไป

## ความรู้เฉพาะทาง
- **vehicleStatus**: "Active" = ใช้งานได้, "Inactive" = ปลดระวาง, "Maintenance" = อยู่ในซ่อม
- **driverStatus**: "Active" = ทำงานอยู่, "Inactive" = ลาออก/พักงาน
- **driverLicenseType**: ป.1 = รถเล็ก, ป.2 = รถใหญ่/บรรทุก, ป.3 = รถโดยสาร, ป.4 = รถแทรกเตอร์
- **ใบขับขี่ใกล้หมด** = อายุน้อยกว่า 90 วัน
- **ทะเบียน/ประกันใกล้หมด** = เปรียบเทียบวันปัจจุบัน
- **ประสิทธิภาพน้ำมัน** = เลขไมล์ / ลิตร (km/L) คำนวณจาก fuelLogs

## กฎเหล็ก
1. **ดึงข้อมูลจาก tool ก่อนเสมอ** ห้ามตอบโดยไม่มีข้อมูล
2. ใช้ **parameter กรองที่ DB** เช่น status, vehicleId, since ไม่ดึงทั้งหมดโดยไม่จำเป็น
3. ใช้ **licenseExpiringSoon: true** เมื่อถามคนขับที่ใบขับขี่ใกล้หมด
4. ถ้าถามหลายเรื่องพร้อมกัน → เรียก tool พร้อมกัน (parallel)
5. **คำนวณเองได้**: ยอดรวมค่าน้ำมัน ค่าซ่อม km/L คำนวณวันที่หมดอายุ
6. ตอบภาษาไทย กระชับ ใช้ตาราง Markdown เมื่อมีหลายรายการ

## วิธีจัดการคำถามซับซ้อน
- "รถที่กำลังซ่อม" → get_vehicles(status: "Maintenance")
- "คนขับที่ใบขับขี่ใกล้หมด" → get_drivers(licenseExpiringSoon: true)
- "ค่าน้ำมันเดือนนี้" → get_fuel_logs(since: "2026-02-01") แล้วรวม fuelLogTotalCost
- "ประวัติซ่อมรถทะเบียน X" → get_vehicles หา vehicleId แล้ว get_maintenances(vehicleId)
- "shipment ที่ยังไม่ถึง" → get_shipments(status: "In Transit")`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_vehicles",
      description: "ดึงรายการรถ สามารถกรองตามสถานะหรือประเภทรถได้",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "กรองตามสถานะ: 'Active', 'Inactive', 'Maintenance'",
          },
          type: {
            type: "string",
            description: "กรองตามประเภทรถ (partial match)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_drivers",
      description: "ดึงรายชื่อคนขับรถ สามารถกรองตามสถานะหรือดูเฉพาะที่ใบขับขี่ใกล้หมดอายุ",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "กรองตามสถานะ: 'Active', 'Inactive'",
          },
          licenseExpiringSoon: {
            type: "boolean",
            description: "true = แสดงเฉพาะคนขับที่ใบขับขี่หมดอายุภายใน 90 วัน",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipments",
      description: "ดึงรายการ Shipment สามารถกรองตามสถานะหรือวันที่สร้าง",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "กรองตาม shipmentStatus เช่น 'Pending', 'In Transit', 'Delivered'",
          },
          since: {
            type: "string",
            description: "กรองตามวันที่สร้าง (YYYY-MM-DD)",
          },
          limit: {
            type: "number",
            description: "จำนวนสูงสุด (default: 50)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fuel_logs",
      description: "ดึงบันทึกการเติมน้ำมัน สามารถกรองตามรถหรือช่วงวันที่",
      parameters: {
        type: "object",
        properties: {
          vehicleId: {
            type: "string",
            description: "กรองตาม vehicleId เพื่อดูประวัติน้ำมันของรถคันนั้น",
          },
          since: {
            type: "string",
            description: "กรองตั้งแต่วันที่นี้ (YYYY-MM-DD)",
          },
          limit: {
            type: "number",
            description: "จำนวนสูงสุด (default: 50)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_maintenances",
      description: "ดึงบันทึกการซ่อมบำรุง สามารถกรองตามรถ สถานะ หรือช่วงวันที่",
      parameters: {
        type: "object",
        properties: {
          vehicleId: {
            type: "string",
            description: "กรองตาม vehicleId เพื่อดูประวัติซ่อมของรถคันนั้น",
          },
          status: {
            type: "string",
            description: "กรองตาม maintenanceStatus เช่น 'Pending', 'In Progress', 'Completed'",
          },
          since: {
            type: "string",
            description: "กรองตั้งแต่วันที่นี้ (YYYY-MM-DD)",
          },
          limit: {
            type: "number",
            description: "จำนวนสูงสุด (default: 50)",
          },
        },
      },
    },
  },
];

async function executeTool(name, args, supabase) {
  switch (name) {
    case "get_vehicles": {
      let q = supabase
        .from("vehicles")
        .select("vehicleId, vehicleName, vehiclePlateNumber, vehicleType, vehicleBrand, vehicleModel, vehicleYear, vehicleStatus, vehicleCurrentMileage, vehicleFuelType, vehicleCapacityKg, vehicleRegistrationExpiry, vehicleInsuranceExpiry")
        .order("vehicleName");
      if (args.status) q = q.eq("vehicleStatus", args.status);
      if (args.type) q = q.ilike("vehicleType", `%${args.type}%`);
      const { data } = await q;
      return data ?? [];
    }

    case "get_drivers": {
      let q = supabase
        .from("drivers")
        .select("driverId, driverFirstName, driverLastName, driverPhone, driverLicenseNumber, driverLicenseType, driverLicenseExpiry, driverRole, driverStatus")
        .order("driverFirstName");
      if (args.status) q = q.eq("driverStatus", args.status);
      if (args.licenseExpiringSoon) {
        const today = new Date().toISOString().split("T")[0];
        const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        q = q.gte("driverLicenseExpiry", today).lte("driverLicenseExpiry", in90);
      }
      const { data } = await q;
      return data ?? [];
    }

    case "get_shipments": {
      let q = supabase
        .from("shipments")
        .select("shipmentId, shipmentNumber, shipmentCustomerName, shipmentDestination, shipmentStatus, shipmentEstimatedArrival, shipmentWeightKg, shipmentCreatedAt")
        .order("shipmentCreatedAt", { ascending: false })
        .limit(args.limit || 50);
      if (args.status) q = q.eq("shipmentStatus", args.status);
      if (args.since) q = q.gte("shipmentCreatedAt", args.since);
      const { data } = await q;
      return data ?? [];
    }

    case "get_fuel_logs": {
      let q = supabase
        .from("fuelLogs")
        .select("fuelLogId, fuelLogDate, fuelLogFuelType, fuelLogLiters, fuelLogPricePerLiter, fuelLogTotalCost, fuelLogMileage, fuelLogStation, fuelLogVehicleId")
        .order("fuelLogDate", { ascending: false })
        .limit(args.limit || 50);
      if (args.vehicleId) q = q.eq("fuelLogVehicleId", args.vehicleId);
      if (args.since) q = q.gte("fuelLogDate", args.since);
      const { data } = await q;
      return data ?? [];
    }

    case "get_maintenances": {
      let q = supabase
        .from("maintenances")
        .select("maintenanceId, maintenanceVehicleId, maintenanceType, maintenanceDescription, maintenanceDate, maintenanceStatus, maintenanceCost, maintenanceVendor, maintenanceNextDueDate")
        .order("maintenanceDate", { ascending: false })
        .limit(args.limit || 50);
      if (args.vehicleId) q = q.eq("maintenanceVehicleId", args.vehicleId);
      if (args.status) q = q.eq("maintenanceStatus", args.status);
      if (args.since) q = q.gte("maintenanceDate", args.since);
      const { data } = await q;
      return data ?? [];
    }

    default:
      throw new Error(`TMS Agent: unknown tool ${name}`);
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
    if (!res.ok) throw new Error(`TMS Agent API error: ${res.status}`);
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

export async function runTmsAgent(query, supabase) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const res1 = await callAI(messages);
  if (!res1.ok) throw new Error(`TMS Agent API error: ${res1.status}`);
  const data1 = await res1.json();
  const choice1 = data1.choices?.[0];

  if (!choice1) throw new Error("TMS Agent: no response");

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
  if (!res2.ok) throw new Error(`TMS Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

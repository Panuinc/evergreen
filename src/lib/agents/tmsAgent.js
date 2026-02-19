const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_MODEL = "google/gemini-2.5-flash-lite";

export const tmsAgent = {
  name: "TMS Agent",
  icon: "truck",
  description: "ผู้เชี่ยวชาญด้านการขนส่งและโลจิสติกส์",
};

const systemPrompt = `คุณเป็น TMS Specialist Agent ของระบบ ERP Evergreen
เชี่ยวชาญด้านการขนส่งและโลจิสติกส์: รถ คนขับ shipment เส้นทาง เชื้อเพลิง การซ่อมบำรุง GPS

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
      name: "get_vehicles",
      description: "ดึงรายการรถทั้งหมดจากระบบ TMS พร้อมสถานะและรายละเอียด",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_drivers",
      description: "ดึงรายชื่อคนขับรถทั้งหมดจากระบบ TMS พร้อมสถานะใบขับขี่",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_shipments",
      description: "ดึงรายการ Shipment ล่าสุดจากระบบ TMS",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_fuel_logs",
      description: "ดึงบันทึกการเติมน้ำมัน 50 รายการล่าสุดจากระบบ TMS",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_maintenances",
      description: "ดึงบันทึกการซ่อมบำรุงรถ 50 รายการล่าสุดจากระบบ TMS",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(name, supabase) {
  switch (name) {
    case "get_vehicles": {
      const { data } = await supabase
        .from("vehicles")
        .select("vehicleId, vehicleName, vehiclePlateNumber, vehicleType, vehicleBrand, vehicleModel, vehicleYear, vehicleStatus, vehicleCurrentMileage, vehicleFuelType, vehicleCapacityKg, vehicleRegistrationExpiry, vehicleInsuranceExpiry")
        .order("vehicleName");
      return data ?? [];
    }
    case "get_drivers": {
      const { data } = await supabase
        .from("drivers")
        .select("driverId, driverFirstName, driverLastName, driverPhone, driverLicenseNumber, driverLicenseType, driverLicenseExpiry, driverRole, driverStatus")
        .order("driverFirstName");
      return data ?? [];
    }
    case "get_shipments": {
      const { data } = await supabase
        .from("shipments")
        .select("shipmentId, shipmentNumber, shipmentCustomerName, shipmentDestination, shipmentStatus, shipmentEstimatedArrival, shipmentWeightKg, shipmentCreatedAt")
        .order("shipmentCreatedAt", { ascending: false })
        .limit(50);
      return data ?? [];
    }
    case "get_fuel_logs": {
      const { data } = await supabase
        .from("fuelLogs")
        .select("fuelLogId, fuelLogDate, fuelLogFuelType, fuelLogLiters, fuelLogPricePerLiter, fuelLogTotalCost, fuelLogMileage, fuelLogStation, fuelLogVehicleId")
        .order("fuelLogDate", { ascending: false })
        .limit(50);
      return data ?? [];
    }
    case "get_maintenances": {
      const { data } = await supabase
        .from("maintenances")
        .select("maintenanceId, maintenanceVehicleId, maintenanceType, maintenanceDescription, maintenanceDate, maintenanceStatus, maintenanceCost, maintenanceVendor, maintenanceNextDueDate")
        .order("maintenanceDate", { ascending: false })
        .limit(50);
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
      body: JSON.stringify({ model: API_MODEL, messages, tools, temperature: 0.2, stream: false }),
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

  const res2 = await callAI(toolMessages);
  if (!res2.ok) throw new Error(`TMS Agent API error (round 2): ${res2.status}`);
  const data2 = await res2.json();
  return data2.choices?.[0]?.message?.content || "";
}

import { withAuth } from "@/app/api/_lib/auth";

const TYPE_CONFIG = {
  shipments: {
    table: "tmsShipment",
    dateField: "tmsShipmentDate",
    select: "*",
    order: "tmsShipmentDate",
  },
  fuelLogs: {
    table: "tmsFuelLog",
    dateField: "tmsFuelLogDate",
    select: "*",
    order: "tmsFuelLogDate",
  },
  maintenances: {
    table: "tmsMaintenance",
    dateField: "tmsMaintenanceDate",
    select: "*",
    order: "tmsMaintenanceDate",
  },
  vehicles: {
    table: "tmsVehicle",
    dateField: null,
    select: "*",
    order: "tmsVehicleCreatedAt",
  },
};

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const config = TYPE_CONFIG[type];
  if (!config) {
    return Response.json({ error: "Invalid report type" }, { status: 400 });
  }

  let query = supabase
    .from(config.table)
    .select(config.select)
    .eq("isActive", true)
    .order(config.order, { ascending: false });

  if (config.dateField && startDate) {
    query = query.gte(config.dateField, startDate);
  }
  if (config.dateField && endDate) {
    query = query.lte(config.dateField, endDate);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

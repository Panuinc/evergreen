import { withAuth } from "@/app/api/_lib/auth";

const TYPE_CONFIG = {
  shipments: {
    table: "shipments",
    dateField: "shipmentDate",
    select: "*",
    order: "shipmentDate",
  },
  fuelLogs: {
    table: "fuelLogs",
    dateField: "fuelLogDate",
    select: "*",
    order: "fuelLogDate",
  },
  maintenances: {
    table: "maintenances",
    dateField: "maintenanceDate",
    select: "*",
    order: "maintenanceDate",
  },
  vehicles: {
    table: "vehicles",
    dateField: null,
    select: "*",
    order: "vehicleCreatedAt",
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

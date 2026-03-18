import { createClient } from "@supabase/supabase-js";
import { fetchAll } from "@/app/api/_lib/fetchAll";

const API_BASE = process.env.FORTHTRACK_API_BASE;
const CLIENT_ID = process.env.FORTHTRACK_CLIENT_ID;
const CLIENT_SECRET = process.env.FORTHTRACK_CLIENT_SECRET;
const USERNAME = process.env.FORTHTRACK_USERNAME;
const PASSWORD = process.env.FORTHTRACK_PASSWORD;

const TOKEN_URL = "https://webapi.forthtrack.com/authorizationserver/token";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "password",
    username: USERNAME,
    password: PASSWORD,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ForthTrack login failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  const expiresIn = data.expires_in ?? 3600;
  tokenExpiry = Date.now() + (expiresIn - 60) * 1000;

  return cachedToken;
}

function parseForthTrackDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const [datePart, timePart] = dateStr.split(" ");
  const [dd, mm, yyyy] = datePart.split("-");
  return new Date(`${yyyy}-${mm}-${dd}T${timePart}+07:00`).toISOString();
}

async function fetchForthTrack() {
  const token = await getToken();

  const res = await fetch(`${API_BASE}/api/tracking`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    cachedToken = null;
    tokenExpiry = 0;
    const freshToken = await getToken();
    const retry = await fetch(`${API_BASE}/api/tracking`, {
      headers: { Authorization: `Bearer ${freshToken}` },
      cache: "no-store",
    });
    if (!retry.ok) {
      const text = await retry.text();
      throw new Error(`ForthTrack tracking fetch failed: ${retry.status} ${text}`);
    }
    return retry.json();
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ForthTrack tracking fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function syncToSupabase(ftData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: vehicles } = await fetchAll(supabase
    .from("tmsVehicle")
    .select("tmsVehicleId, tmsVehiclePlateNumber, tmsVehicleForthtrackId"));

  if (!vehicles?.length) return { synced: 0 };

  const gpsIdMap = {};
  const plateMap = {};
  for (const v of vehicles) {
    if (v.tmsVehicleForthtrackId) gpsIdMap[v.tmsVehicleForthtrackId] = v.tmsVehicleId;
    if (v.tmsVehiclePlateNumber) plateMap[v.tmsVehiclePlateNumber] = v.tmsVehicleId;
  }

  const rows = ftData
    .filter((ft) => ft.Latitude && ft.Longitude)
    .map((ft) => {
      const vehicleId = gpsIdMap[ft.gpsID] ?? plateMap[ft.plateNumber];
      if (!vehicleId) return null;

      return {
        tmsGpsLogVehicleId: vehicleId,
        tmsGpsLogLatitude: ft.Latitude,
        tmsGpsLogLongitude: ft.Longitude,
        tmsGpsLogSpeed: ft.Speed ?? null,
        tmsGpsLogRecordedAt: parseForthTrackDate(ft.dateTime),
        tmsGpsLogSource: "forthtrack",
        tmsGpsLogForthtrackId: ft.gpsID,
        tmsGpsLogEngine: ft.Engine ?? null,
        tmsGpsLogDriver: ft.driver || null,
        tmsGpsLogAddress: ft.addressT || ft.addressE || null,
        tmsGpsLogFuel: ft.Fuel ?? null,
        tmsGpsLogTemperature: ft.Temperature ?? null,
        tmsGpsLogCOG: ft.COG ?? null,
        tmsGpsLogPowerStatus: ft.powerStatus ?? null,
        tmsGpsLogExternalBatt: ft.externalBatt ?? null,
        tmsGpsLogPositionSource: ft.positionSource ?? null,
        tmsGpsLogPoi: ft.poi || null,
        tmsGpsLogGpsSignal: ft.GPS ?? null,
        tmsGpsLogGprs: ft.GPRS ?? null,
        tmsGpsLogVehicleType: ft.vehicleType ?? null,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) return { synced: 0 };

  const { error } = await supabase
    .from("tmsGpsLog")
    .upsert(rows, {
      onConflict: "tmsGpsLogForthtrackId,tmsGpsLogRecordedAt",
      ignoreDuplicates: true,
    });

  if (error) throw error;

  return { synced: rows.length };
}

export async function GET(request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!USERNAME || !PASSWORD) {
    return Response.json(
      { error: "ForthTrack credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const ftData = await fetchForthTrack();
    const result = await syncToSupabase(ftData);
    return Response.json({
      ok: true,
      vehicles: ftData.length,
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ForthTrack Sync] Error:", err.message);
    return Response.json({ error: err.message }, { status: 502 });
  }
}

import { withAuth } from "@/app/api/_lib/auth";
import { createClient } from "@supabase/supabase-js";

const API_BASE = process.env.FORTHTRACK_API_BASE;
const CLIENT_ID = process.env.FORTHTRACK_CLIENT_ID;
const CLIENT_SECRET = process.env.FORTHTRACK_CLIENT_SECRET;
const USERNAME = process.env.FORTHTRACK_USERNAME;
const PASSWORD = process.env.FORTHTRACK_PASSWORD;

// OAuth2 token endpoint
const TOKEN_URL = "https://webapi.forthtrack.com/authorizationserver/token";

// Module-level token cache (persists across requests in the same server instance)
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  // OAuth2 Resource Owner Password flow
  // client_id:client_secret sent as HTTP Basic Auth (DotNetOpenAuth convention)
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
      "Authorization": `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Forth Track login failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  const expiresIn = data.expires_in ?? 3600;
  tokenExpiry = Date.now() + (expiresIn - 60) * 1000;

  return cachedToken;
}

// Parse "DD-MM-YYYY HH:MM:SS" → ISO string
function parseForthTrackDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  // "09-03-2026 15:05:32" is Thai time (UTC+7) → convert to UTC ISO string
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
      throw new Error(`Forth Track tracking fetch failed: ${retry.status} ${text}`);
    }
    return retry.json();
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Forth Track tracking fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function syncToSupabase(ftData) {
  // Use service role key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Load all internal vehicles for gpsID → vehicleId mapping (with plate fallback)
  const { data: vehicles } = await supabase
    .from("tmsVehicle")
    .select("tmsVehicleId, tmsVehiclePlateNumber, tmsVehicleForthtrackId");

  if (!vehicles?.length) return;

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
        tmsGpsLogVehicleId:      vehicleId,
        tmsGpsLogLatitude:       ft.Latitude,
        tmsGpsLogLongitude:      ft.Longitude,
        tmsGpsLogSpeed:          ft.Speed ?? null,
        tmsGpsLogRecordedAt:     parseForthTrackDate(ft.dateTime),
        tmsGpsLogSource:         "forthtrack",
        tmsGpsLogForthtrackId:   ft.gpsID,
        tmsGpsLogEngine:         ft.Engine ?? null,
        tmsGpsLogDriver:         ft.driver || null,
        tmsGpsLogAddress:        ft.addressT || ft.addressE || null,
        tmsGpsLogFuel:           ft.Fuel ?? null,
        tmsGpsLogTemperature:    ft.Temperature ?? null,
        tmsGpsLogCOG:            ft.COG ?? null,
        tmsGpsLogPowerStatus:    ft.powerStatus ?? null,
        tmsGpsLogExternalBatt:   ft.externalBatt ?? null,
        tmsGpsLogPositionSource: ft.positionSource ?? null,
        tmsGpsLogPoi:            ft.poi || null,
        tmsGpsLogGpsSignal:      ft.GPS ?? null,
        tmsGpsLogGprs:           ft.GPRS ?? null,
        tmsGpsLogVehicleType:    ft.vehicleType ?? null,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) return;

  // Upsert: skip duplicates by (tmsGpsLogForthtrackId, tmsGpsLogRecordedAt)
  await supabase
    .from("tmsGpsLog")
    .upsert(rows, {
      onConflict: "tmsGpsLogForthtrackId,tmsGpsLogRecordedAt",
      ignoreDuplicates: true,
    });
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  if (!USERNAME || !PASSWORD) {
    return Response.json(
      { error: "Forth Track credentials not configured (FORTHTRACK_USERNAME / FORTHTRACK_PASSWORD)" },
      { status: 503 }
    );
  }

  try {
    const ftData = await fetchForthTrack();

    // Sync to Supabase (await so it completes before serverless function exits)
    await syncToSupabase(ftData).catch((err) =>
      console.error("[ForthTrack] Supabase sync error:", err.message)
    );

    return Response.json(ftData);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}

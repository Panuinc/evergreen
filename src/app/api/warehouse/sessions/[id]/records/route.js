import { withAuth } from "@/app/api/_lib/auth";

function formatRecord(r) {
  return {
    id: r.whScanRecordId,
    session_id: r.whScanRecordSessionId,
    epc: r.whScanRecordEpc,
    rssi: r.whScanRecordRssi,
    item_number: r.whScanRecordItemNumber,
    item_name: r.whScanRecordItemName,
    photo_url: r.whScanRecordPhotoUrl,
    read_count: r.whScanRecordReadCount,
    scanned_at: r.whScanRecordScannedAt,
  };
}

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("whScanRecord")
    .select("*")
    .eq("whScanRecordSessionId", id)
    .order("whScanRecordScannedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(formatRecord));
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  if (!Array.isArray(body)) {
    return Response.json(
      { error: "ข้อมูลที่ส่งต้องเป็นอาร์เรย์ของรายการ" },
      { status: 400 }
    );
  }

  const records = body.map((item) => ({
    whScanRecordSessionId: id,
    whScanRecordEpc: item.epc,
    whScanRecordRssi: item.rssi,
    whScanRecordItemNumber: item.item_number,
    whScanRecordItemName: item.item_name,
    whScanRecordPhotoUrl: item.photo_url,
    whScanRecordReadCount: item.read_count,
    whScanRecordScannedAt: item.scanned_at,
  }));

  const { data, error } = await supabase
    .from("whScanRecord")
    .insert(records)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data.map(formatRecord), { status: 201 });
}

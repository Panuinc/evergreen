import { withAuth } from "@/app/api/_lib/auth";

const MIN_RFID_CODE = 1;
const MAX_RFID_CODE = 99999999; // 8 digits max for EPC encoding

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { itemNumber, rfidCode } = await request.json();

  if (!itemNumber) {
    return Response.json({ error: "กรุณาระบุรหัสสินค้า" }, { status: 400 });
  }

  // Validate rfidCode range
  const code = Number(rfidCode);
  if (!Number.isInteger(code) || code < MIN_RFID_CODE || code > MAX_RFID_CODE) {
    return Response.json(
      { error: `rfidCode ต้องเป็นจำนวนเต็ม ${MIN_RFID_CODE} - ${MAX_RFID_CODE.toLocaleString()}` },
      { status: 400 },
    );
  }

  // Check duplicate
  const { data: existing } = await auth.supabase
    .from("bcItem")
    .select("bcItemNumber, bcItemDisplayName")
    .eq("bcItemRfidCode", String(code))
    .neq("bcItemNumber", itemNumber)
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json(
      {
        error: `rfidCode ${code} ถูกใช้แล้วโดย ${existing[0].bcItemNumber} (${existing[0].bcItemDisplayName})`,
      },
      { status: 409 },
    );
  }

  // Assign rfidCode
  const { error } = await auth.supabase
    .from("bcItem")
    .update({ bcItemRfidCode: String(code) })
    .eq("bcItemNumber", itemNumber);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, rfidCode: code });
}

export async function DELETE(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const itemNumber = searchParams.get("itemNumber");

  if (!itemNumber) {
    return Response.json({ error: "กรุณาระบุรหัสสินค้า" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("bcItem")
    .update({ bcItemRfidCode: null })
    .eq("bcItemNumber", itemNumber);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

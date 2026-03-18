import { withAuth } from "@/app/api/_lib/auth";

const MIN_RFID_CODE = 1;
const MAX_RFID_CODE = 99999999;

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { itemNumber, rfidCode } = await request.json();

  if (!itemNumber) {
    return Response.json({ error: "กรุณาระบุรหัสสินค้า" }, { status: 400 });
  }


  const code = Number(rfidCode);
  if (!Number.isInteger(code) || code < MIN_RFID_CODE || code > MAX_RFID_CODE) {
    return Response.json(
      { error: `rfidCode ต้องเป็นจำนวนเต็ม ${MIN_RFID_CODE} - ${MAX_RFID_CODE.toLocaleString()}` },
      { status: 400 },
    );
  }


  const { data: existing } = await auth.supabase
    .from("bcItem")
    .select("bcItemNo, bcItemDescription")
    .eq("bcItemRfidCode", String(code))
    .neq("bcItemNo", itemNumber)
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json(
      {
        error: `rfidCode ${code} ถูกใช้แล้วโดย ${existing[0].bcItemNo} (${existing[0].bcItemDescription})`,
      },
      { status: 409 },
    );
  }


  const { error } = await auth.supabase
    .from("bcItem")
    .update({ bcItemRfidCode: String(code) })
    .eq("bcItemNo", itemNumber);

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
    .eq("bcItemNo", itemNumber);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

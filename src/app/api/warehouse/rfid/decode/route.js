import { NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/auth";

function decodeEpc(hex) {
  if (hex.length !== 24) {
    return { type: "tid", raw: hex };
  }

  let itemChars = "";
  for (let i = 0; i < 20; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code > 31 && code < 127) itemChars += String.fromCharCode(code);
  }
  const itemCompact = itemChars.trim();

  if (!itemCompact || itemCompact.length < 3) {
    return { type: "tid", raw: hex };
  }

  const piece = parseInt(hex.substring(20, 22), 16);
  const total = parseInt(hex.substring(22, 24), 16);

  return {
    type: "epc",
    itemCompact,
    pieceNumber: piece,
    totalPieces: total,
  };
}

export async function POST(request) {
  try {
    const auth = await withAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const hex = body.epc || body.tid || body.hex;
    if (!hex) {
      return NextResponse.json(
        { success: false, error: "EPC or TID hex is required" },
        { status: 400 },
      );
    }

    const decoded = decodeEpc(hex);

    if (decoded.type === "epc" && decoded.itemCompact) {
      const pattern = `%${decoded.itemCompact.replace(/ /g, "%")}%`;
      const { data: items } = await auth.supabase
        .from("bcItems")
        .select("*")
        .ilike("number", pattern)
        .limit(1);

      const item = items?.[0] || null;

      return NextResponse.json({
        success: true,
        decoded,
        item: item
          ? {
              number: item.number,
              displayName: item.displayName,
              type: item.type,
              inventory: item.inventory,
              baseUnitOfMeasure: item.baseUnitOfMeasure,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              itemCategoryCode: item.itemCategoryCode,
            }
          : null,
        message: item ? undefined : "ไม่พบสินค้าในระบบ",
      });
    }

    return NextResponse.json({
      success: true,
      decoded,
      item: null,
      message:
        "Tag นี้ยังไม่ได้เขียน EPC (อ่านได้แค่ TID) กรุณาพิมพ์ label ใหม่โดยเปิด RFID encoding",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

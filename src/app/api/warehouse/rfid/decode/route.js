import { NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/auth";

function decodeEpc(hex) {
  let ascii = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code === 0) break;
    ascii += String.fromCharCode(code);
  }
  const parts = ascii.split("|");
  if (parts.length >= 2 && parts[0].length > 2) {
    return {
      type: "epc",
      itemNumber: parts[0],
      pieceNumber: parts[1] ? Number(parts[1]) : null,
      totalPieces: parts[2] ? Number(parts[2]) : null,
    };
  }
  return { type: "tid", raw: hex };
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

    if (decoded.type === "epc" && decoded.itemNumber) {
      const { data: item } = await auth.supabase
        .from("bcItems")
        .select("*")
        .eq("number", decoded.itemNumber)
        .single();

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

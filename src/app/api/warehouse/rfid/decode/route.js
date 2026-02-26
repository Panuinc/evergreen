import { NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/auth";

function decodeEpc(hex) {
  if (hex.length !== 24) {
    return { type: "tid", raw: hex };
  }

  let raw = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (code === 0) break;
    if (code > 31 && code < 127) raw += String.fromCharCode(code);
  }

  const slashIndex = raw.lastIndexOf("/");
  if (slashIndex < 3) {
    return { type: "tid", raw: hex };
  }

  const itemPart = raw.substring(0, slashIndex).trim();
  const seqChar = raw[slashIndex + 1];
  const totalChar = raw[slashIndex + 2];

  const pieceNumber =
    seqChar >= "A" ? seqChar.charCodeAt(0) - 55 : parseInt(seqChar) || 0;
  const totalPieces =
    totalChar >= "A" ? totalChar.charCodeAt(0) - 55 : parseInt(totalChar) || 0;

  /* All digits = rfidCode mapping; otherwise = compact item number */
  if (/^\d+$/.test(itemPart)) {
    return {
      type: "epc",
      rfidCode: parseInt(itemPart, 10),
      pieceNumber,
      totalPieces,
    };
  }

  return {
    type: "epc",
    itemCompact: itemPart,
    pieceNumber,
    totalPieces,
  };
}

function formatItem(item) {
  return {
    number: item.bcItemNumber,
    displayName: item.bcItemDisplayName,
    type: item.bcItemType,
    inventory: item.bcItemInventory,
    baseUnitOfMeasure: item.baseUnitOfMeasure,
    unitPrice: item.bcItemUnitPrice,
    unitCost: item.bcItemUnitCost,
    itemCategoryCode: item.itemCategoryCode,
    projectCode: item.projectCode || null,
    projectName: item.projectName || null,
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
        { success: false, error: "กรุณาระบุ EPC หรือ TID hex" },
        { status: 400 },
      );
    }

    const decoded = decodeEpc(hex);

    if (decoded.type === "epc") {
      let item = null;

      if (decoded.rfidCode) {
        /* New format: lookup by rfidCode */
        const { data: items } = await auth.supabase
          .from("bcItem")
          .select("*")
          .eq("rfidCode", decoded.rfidCode)
          .limit(1);
        item = items?.[0] || null;
      } else if (decoded.itemCompact) {
        /* Old format: ILIKE pattern match on number */
        const pattern = `%${decoded.itemCompact.replace(/ /g, "%")}%`;
        const { data: items } = await auth.supabase
          .from("bcItem")
          .select("*")
          .ilike("bcItemNumber", pattern)
          .limit(1);
        item = items?.[0] || null;
      }

      return NextResponse.json({
        success: true,
        decoded,
        item: item ? formatItem(item) : null,
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

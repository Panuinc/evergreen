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
  const afterSlash = raw.substring(slashIndex + 1);

  let pieceNumber, totalPieces;
  if (afterSlash.length >= 4 && /^\d{4}/.test(afterSlash)) {

    pieceNumber = parseInt(afterSlash.substring(0, 2), 10);
    totalPieces = parseInt(afterSlash.substring(2, 4), 10);
  } else {

    const seqChar = afterSlash[0];
    const totalChar = afterSlash[1];
    pieceNumber =
      seqChar >= "A" ? seqChar.charCodeAt(0) - 55 : parseInt(seqChar) || 0;
    totalPieces =
      totalChar >= "A" ? totalChar.charCodeAt(0) - 55 : parseInt(totalChar) || 0;
  }


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
    number: item.bcItemNo,
    displayName: item.bcItemDescription,
    type: item.bcItemType,
    inventory: item.bcItemInventory,
    baseUnitOfMeasure: item.bcItemBaseUnitOfMeasure,
    unitPrice: item.bcItemUnitPrice,
    unitCost: item.bcItemUnitCost,
    itemCategoryCode: item.bcItemItemCategoryCode,
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

        const { data: items } = await auth.supabase
          .from("bcItem")
          .select("*")
          .eq("bcItemRfidCode", decoded.rfidCode)
          .limit(1);
        item = items?.[0] || null;
      } else if (decoded.itemCompact) {

        const pattern = `%${decoded.itemCompact.replace(/ /g, "%")}%`;
        const { data: items } = await auth.supabase
          .from("bcItem")
          .select("*")
          .ilike("bcItemNo", pattern)
          .limit(1);
        item = items?.[0] || null;
      }

      let message;
      if (!item) {
        message = "ไม่พบสินค้าในระบบ";
      } else if (
        item.bcItemInventory !== null &&
        item.bcItemInventory !== undefined &&
        Number(item.bcItemInventory) <= 0
      ) {
        message = "สินค้าถูกตัดสต็อกแล้ว (Inventory: 0)";
      }

      return NextResponse.json({
        success: true,
        decoded,
        item: item ? formatItem(item) : null,
        message,
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

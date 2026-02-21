package com.evergreen.rfid.util

import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.CachedItem
import com.evergreen.rfid.model.DecodeResult
import com.evergreen.rfid.model.DecodedInfo
import com.evergreen.rfid.model.Item

/**
 * Offline EPC decoder — ported from src/app/api/warehouse/rfid/decode/route.js
 * Decodes 24-char hex EPC → ASCII → parse ITEM_PART/SEQCHAR+TOTALCHAR → lookup from Room cache
 */
object EpcDecoder {

    data class ParsedEpc(
        val type: String,
        val rfidCode: Int? = null,
        val itemCompact: String? = null,
        val pieceNumber: Int = 0,
        val totalPieces: Int = 0,
        val raw: String? = null
    )

    fun parseEpc(hex: String): ParsedEpc {
        if (hex.length != 24) {
            return ParsedEpc(type = "tid", raw = hex)
        }

        val sb = StringBuilder()
        var i = 0
        while (i < hex.length) {
            val code = hex.substring(i, i + 2).toIntOrNull(16) ?: break
            if (code == 0) break
            if (code in 32..126) sb.append(code.toChar())
            i += 2
        }
        val raw = sb.toString()

        val slashIndex = raw.lastIndexOf('/')
        if (slashIndex < 3) {
            return ParsedEpc(type = "tid", raw = hex)
        }

        val itemPart = raw.substring(0, slashIndex).trim()
        val seqChar = if (slashIndex + 1 < raw.length) raw[slashIndex + 1] else '0'
        val totalChar = if (slashIndex + 2 < raw.length) raw[slashIndex + 2] else '0'

        val pieceNumber = if (seqChar >= 'A') seqChar.code - 55 else seqChar.digitToIntOrNull() ?: 0
        val totalPieces = if (totalChar >= 'A') totalChar.code - 55 else totalChar.digitToIntOrNull() ?: 0

        // All digits = rfidCode mapping; otherwise = compact item number
        return if (itemPart.all { it.isDigit() }) {
            ParsedEpc(
                type = "epc",
                rfidCode = itemPart.toIntOrNull(),
                pieceNumber = pieceNumber,
                totalPieces = totalPieces
            )
        } else {
            ParsedEpc(
                type = "epc",
                itemCompact = itemPart,
                pieceNumber = pieceNumber,
                totalPieces = totalPieces
            )
        }
    }

    suspend fun decode(hex: String, db: AppDatabase): DecodeResult {
        val parsed = parseEpc(hex)

        if (parsed.type != "epc") {
            return DecodeResult(
                success = true,
                decoded = DecodedInfo(type = "tid", raw = parsed.raw),
                item = null,
                message = "Tag ยังไม่ได้เขียน EPC (อ่านได้แค่ TID)"
            )
        }

        var cachedItem: CachedItem? = null

        if (parsed.rfidCode != null) {
            cachedItem = db.itemDao().getByRfidCode(parsed.rfidCode)
        } else if (parsed.itemCompact != null) {
            // Try exact match first, then pattern match
            val pattern = "%${parsed.itemCompact.replace(" ", "%")}%"
            cachedItem = db.itemDao().searchByNumber(pattern)
        }

        val decodedInfo = DecodedInfo(
            type = "epc",
            rfidCode = parsed.rfidCode,
            itemCompact = parsed.itemCompact,
            pieceNumber = parsed.pieceNumber,
            totalPieces = parsed.totalPieces
        )

        return if (cachedItem != null) {
            DecodeResult(
                success = true,
                decoded = decodedInfo,
                item = Item(
                    number = cachedItem.number,
                    displayName = cachedItem.displayName,
                    type = cachedItem.type,
                    inventory = cachedItem.inventory,
                    baseUnitOfMeasure = cachedItem.baseUnitOfMeasure,
                    unitPrice = cachedItem.unitPrice,
                    unitCost = cachedItem.unitCost,
                    itemCategoryCode = cachedItem.itemCategoryCode,
                    rfidCode = cachedItem.rfidCode
                )
            )
        } else {
            DecodeResult(
                success = true,
                decoded = decodedInfo,
                item = null,
                message = "ไม่พบสินค้าในระบบ"
            )
        }
    }
}

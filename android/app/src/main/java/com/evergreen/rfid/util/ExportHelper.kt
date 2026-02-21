package com.evergreen.rfid.util

import android.content.Context
import android.content.Intent
import com.evergreen.rfid.model.ScanResult
import java.text.SimpleDateFormat
import java.util.*

object ExportHelper {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

    fun exportAsCsv(results: List<ScanResult>): String {
        val sb = StringBuilder()
        sb.appendLine("EPC,Item Number,Item Name,Piece,Inventory,Unit,Price,RSSI,Read Count,Timestamp")
        for (r in results) {
            val item = r.decodeResult?.item
            val decoded = r.decodeResult?.decoded
            val piece = if (decoded?.pieceNumber != null) "${decoded.pieceNumber}/${decoded.totalPieces}" else ""
            sb.appendLine(
                "${csvEscape(r.epc)}," +
                "${csvEscape(item?.number ?: "")}," +
                "${csvEscape(item?.displayName ?: "")}," +
                "${csvEscape(piece)}," +
                "${item?.inventory?.toInt() ?: ""}," +
                "${csvEscape(item?.baseUnitOfMeasure ?: "")}," +
                "${item?.unitPrice ?: ""}," +
                "${csvEscape(r.rssi)}," +
                "${r.readCount}," +
                dateFormat.format(Date(r.timestamp))
            )
        }
        return sb.toString()
    }

    fun exportAsText(results: List<ScanResult>): String {
        val sb = StringBuilder()
        sb.appendLine("Evergreen RFID Scan Results")
        sb.appendLine("Exported: ${dateFormat.format(Date())}")
        sb.appendLine("Total: ${results.size} tags")
        sb.appendLine("════════════════════════════════")
        for ((i, r) in results.withIndex()) {
            val item = r.decodeResult?.item
            val decoded = r.decodeResult?.decoded
            sb.appendLine()
            sb.appendLine("#${i + 1}")
            sb.appendLine("EPC: ${r.epc}")
            if (item != null) {
                sb.appendLine("Item: ${item.number} - ${item.displayName}")
                if (decoded?.pieceNumber != null) {
                    sb.appendLine("Piece: ${decoded.pieceNumber}/${decoded.totalPieces}")
                }
                sb.appendLine("Inventory: ${item.inventory.toInt()} ${item.baseUnitOfMeasure}")
                sb.appendLine("Price: ฿${String.format("%,.2f", item.unitPrice)}")
            }
            if (r.rssi.isNotEmpty()) sb.appendLine("RSSI: ${r.rssi}")
            sb.appendLine("Reads: ${r.readCount}")
        }
        return sb.toString()
    }

    fun share(context: Context, content: String, mimeType: String, title: String = "Scan Results") {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_TEXT, content)
            putExtra(Intent.EXTRA_SUBJECT, title)
        }
        context.startActivity(Intent.createChooser(intent, "Share via"))
    }

    private fun csvEscape(value: String): String {
        return if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            "\"${value.replace("\"", "\"\"")}\""
        } else value
    }
}

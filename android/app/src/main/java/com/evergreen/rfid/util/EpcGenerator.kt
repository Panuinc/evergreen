package com.evergreen.rfid.util

/**
 * EPC generator — ported from src/lib/chainWay/epc.js
 * Generates 96-bit (24 hex chars) EPC tags
 */
object EpcGenerator {
    private const val EPC_BYTES = 12 // 96-bit tag

    /**
     * Generate a single EPC hex string
     * @param rfidCodeOrItemNumber Either an Int rfidCode or String item number
     * @param sequenceNumber 1-based piece index
     * @param totalQuantity total pieces
     * @return 24-char hex EPC string
     */
    fun generate(rfidCodeOrItemNumber: Any, sequenceNumber: Int, totalQuantity: Int): String {
        val seqChar = if (sequenceNumber <= 9) {
            sequenceNumber.toString()
        } else {
            (55 + sequenceNumber).toChar().toString()
        }

        val totalChar = if (totalQuantity <= 9) {
            totalQuantity.toString()
        } else {
            (55 + totalQuantity).toChar().toString()
        }

        val content = when (rfidCodeOrItemNumber) {
            is Int -> {
                // rfidCode (integer) → zero-padded 8 digits + /seq+total = 11 chars
                val codeStr = rfidCodeOrItemNumber.toString().padStart(8, '0')
                "${codeStr}/${seqChar}${totalChar}"
            }
            is Number -> {
                val codeStr = rfidCodeOrItemNumber.toInt().toString().padStart(8, '0')
                "${codeStr}/${seqChar}${totalChar}"
            }
            else -> {
                // Fallback: compact item number (strip dashes)
                val compact = rfidCodeOrItemNumber.toString().replace("-", "")
                val withSeq = "${compact}/${seqChar}${totalChar}"
                if (withSeq.length <= EPC_BYTES) withSeq else compact
            }
        }

        val sb = StringBuilder()
        for (i in 0 until EPC_BYTES) {
            val code = if (i < content.length) content[i].code else 0
            sb.append(String.format("%02X", code))
        }
        return sb.toString()
    }

    /**
     * Generate batch of EPCs for an item
     */
    fun generateBatch(rfidCodeOrItemNumber: Any, quantity: Int): List<EpcEntry> {
        return (1..quantity).map { i ->
            EpcEntry(
                epc = generate(rfidCodeOrItemNumber, i, quantity),
                sequenceNumber = i,
                totalQuantity = quantity,
                sequenceText = "$i/$quantity"
            )
        }
    }

    data class EpcEntry(
        val epc: String,
        val sequenceNumber: Int,
        val totalQuantity: Int,
        val sequenceText: String
    )
}

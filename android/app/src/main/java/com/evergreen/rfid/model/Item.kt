package com.evergreen.rfid.model

data class Item(
    val number: String = "",
    val displayName: String = "",
    val type: String = "",
    val inventory: Double = 0.0,
    val baseUnitOfMeasure: String = "",
    val unitPrice: Double = 0.0,
    val unitCost: Double = 0.0,
    val itemCategoryCode: String = "",
    val rfidCode: Int? = null
)

data class DecodeResult(
    val success: Boolean = false,
    val decoded: DecodedInfo? = null,
    val item: Item? = null,
    val message: String? = null
)

data class DecodedInfo(
    val type: String = "",
    val rfidCode: Int? = null,
    val itemCompact: String? = null,
    val pieceNumber: Int? = null,
    val totalPieces: Int? = null,
    val raw: String? = null
)

data class ScanResult(
    val epc: String,
    val rssi: String = "",
    val decodeResult: DecodeResult? = null,
    val timestamp: Long = System.currentTimeMillis(),
    var readCount: Int = 1
)

package com.evergreen.rfid.db.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "scan_records",
    foreignKeys = [ForeignKey(
        entity = ScanSessionEntity::class,
        parentColumns = ["id"],
        childColumns = ["sessionId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index("sessionId")]
)
data class ScanRecordEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sessionId: Long,
    val epc: String,
    val rssi: String = "",
    val itemNumber: String? = null,
    val itemName: String? = null,
    val photoPath: String? = null,
    val readCount: Int = 1,
    val scannedAt: Long = System.currentTimeMillis()
)

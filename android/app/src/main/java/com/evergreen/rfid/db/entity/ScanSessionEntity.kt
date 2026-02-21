package com.evergreen.rfid.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "scan_sessions")
data class ScanSessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String = "",
    val type: String = "scan",  // scan, count, transfer, po_match
    val startTime: Long = System.currentTimeMillis(),
    val endTime: Long? = null,
    val userId: String = "",
    val gpsLat: Double? = null,
    val gpsLon: Double? = null,
    val tagCount: Int = 0,
    val totalReads: Int = 0,
    val synced: Boolean = false
)

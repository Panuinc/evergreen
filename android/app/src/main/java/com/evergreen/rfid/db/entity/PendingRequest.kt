package com.evergreen.rfid.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_requests")
data class PendingRequest(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String,           // "decode", "upload_session"
    val jsonPayload: String,
    val createdAt: Long = System.currentTimeMillis(),
    val status: String = "pending"  // pending, processing, failed
)

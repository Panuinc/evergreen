package com.evergreen.rfid.db.dao

import androidx.room.*
import com.evergreen.rfid.db.entity.PendingRequest

@Dao
interface SyncDao {
    @Insert
    suspend fun insert(request: PendingRequest)

    @Query("SELECT * FROM pending_requests WHERE status = 'pending' ORDER BY createdAt ASC")
    suspend fun getAllPending(): List<PendingRequest>

    @Query("DELETE FROM pending_requests WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("UPDATE pending_requests SET status = :status WHERE id = :id")
    suspend fun updateStatus(id: Long, status: String)

    @Query("SELECT COUNT(*) FROM pending_requests WHERE status = 'pending'")
    suspend fun getPendingCount(): Int
}

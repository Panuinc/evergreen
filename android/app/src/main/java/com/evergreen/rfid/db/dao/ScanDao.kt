package com.evergreen.rfid.db.dao

import androidx.room.*
import com.evergreen.rfid.db.entity.ScanRecordEntity
import com.evergreen.rfid.db.entity.ScanSessionEntity

@Dao
interface ScanDao {
    @Insert
    suspend fun insertSession(session: ScanSessionEntity): Long

    @Update
    suspend fun updateSession(session: ScanSessionEntity)

    @Insert
    suspend fun insertRecord(record: ScanRecordEntity)

    @Insert
    suspend fun insertRecords(records: List<ScanRecordEntity>)

    @Query("SELECT * FROM scan_sessions ORDER BY startTime DESC")
    suspend fun getAllSessions(): List<ScanSessionEntity>

    @Query("SELECT * FROM scan_sessions WHERE id = :sessionId")
    suspend fun getSession(sessionId: Long): ScanSessionEntity?

    @Query("SELECT * FROM scan_records WHERE sessionId = :sessionId ORDER BY scannedAt DESC")
    suspend fun getRecordsBySession(sessionId: Long): List<ScanRecordEntity>

    @Query("SELECT * FROM scan_sessions WHERE synced = 0 ORDER BY startTime DESC")
    suspend fun getUnsyncedSessions(): List<ScanSessionEntity>

    @Query("DELETE FROM scan_sessions WHERE id = :sessionId")
    suspend fun deleteSession(sessionId: Long)

    @Query("SELECT COUNT(*) FROM scan_sessions")
    suspend fun getSessionCount(): Int
}

package com.evergreen.rfid.db.dao

import androidx.room.*
import com.evergreen.rfid.db.entity.CachedItem

@Dao
interface ItemDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<CachedItem>)

    @Query("SELECT * FROM cached_items WHERE rfidCode = :rfidCode LIMIT 1")
    suspend fun getByRfidCode(rfidCode: Int): CachedItem?

    @Query("SELECT * FROM cached_items WHERE number = :number LIMIT 1")
    suspend fun getByNumber(number: String): CachedItem?

    @Query("SELECT * FROM cached_items WHERE number LIKE :pattern LIMIT 1")
    suspend fun searchByNumber(pattern: String): CachedItem?

    @Query("SELECT COUNT(*) FROM cached_items")
    suspend fun getCount(): Int

    @Query("DELETE FROM cached_items")
    suspend fun deleteAll()
}

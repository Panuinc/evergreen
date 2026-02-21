package com.evergreen.rfid.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.evergreen.rfid.db.dao.ItemDao
import com.evergreen.rfid.db.dao.ScanDao
import com.evergreen.rfid.db.dao.SyncDao
import com.evergreen.rfid.db.entity.CachedItem
import com.evergreen.rfid.db.entity.PendingRequest
import com.evergreen.rfid.db.entity.ScanRecordEntity
import com.evergreen.rfid.db.entity.ScanSessionEntity

@Database(
    entities = [CachedItem::class, ScanSessionEntity::class, ScanRecordEntity::class, PendingRequest::class],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun itemDao(): ItemDao
    abstract fun scanDao(): ScanDao
    abstract fun syncDao(): SyncDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "evergreen_rfid.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

package com.evergreen.rfid.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_items")
data class CachedItem(
    @PrimaryKey val number: String,
    val displayName: String = "",
    val type: String = "",
    val inventory: Double = 0.0,
    val baseUnitOfMeasure: String = "",
    val unitPrice: Double = 0.0,
    val unitCost: Double = 0.0,
    val itemCategoryCode: String = "",
    val rfidCode: Int? = null,
    val projectCode: String? = null,
    val projectName: String? = null,
    val cachedAt: Long = System.currentTimeMillis()
)

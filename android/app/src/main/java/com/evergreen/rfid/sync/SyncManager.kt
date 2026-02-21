package com.evergreen.rfid.sync

import android.content.Context
import android.util.Log
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.CachedItem
import com.evergreen.rfid.util.AppSettings
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.runBlocking
import okhttp3.*
import java.io.IOException
import java.util.concurrent.TimeUnit

class SyncManager(context: Context) {
    companion object {
        private const val TAG = "SyncManager"
        private const val PREFS_NAME = "sync_prefs"
        private const val KEY_LAST_SYNC = "last_item_sync"
    }

    private val db = AppDatabase.getInstance(context)
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    val lastSyncTime: Long get() = prefs.getLong(KEY_LAST_SYNC, 0)
    val cachedItemCount: suspend () -> Int = { db.itemDao().getCount() }

    /**
     * Fetch all items from /api/warehouse/inventory and cache in Room
     */
    fun syncItems(token: String, callback: (Result<Int>) -> Unit) {
        val url = "${AppSettings.baseUrl}/api/warehouse/inventory"

        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Content-Type", "application/json")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Sync items failed: ${e.message}")
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    if (!response.isSuccessful) {
                        callback(Result.failure(Exception("HTTP ${response.code}")))
                        return
                    }

                    val body = response.body?.string() ?: "[]"
                    val type = object : TypeToken<List<Map<String, Any?>>>() {}.type
                    val items: List<Map<String, Any?>> = gson.fromJson(body, type)

                    val cachedItems = items.mapNotNull { map ->
                        try {
                            CachedItem(
                                number = map["number"]?.toString() ?: return@mapNotNull null,
                                displayName = map["displayName"]?.toString() ?: "",
                                type = map["type"]?.toString() ?: "",
                                inventory = (map["inventory"] as? Number)?.toDouble() ?: 0.0,
                                baseUnitOfMeasure = map["baseUnitOfMeasure"]?.toString() ?: "",
                                unitPrice = (map["unitPrice"] as? Number)?.toDouble() ?: 0.0,
                                unitCost = (map["unitCost"] as? Number)?.toDouble() ?: 0.0,
                                itemCategoryCode = map["itemCategoryCode"]?.toString() ?: "",
                                rfidCode = (map["rfidCode"] as? Number)?.toInt(),
                                projectCode = map["projectCode"]?.toString(),
                                projectName = map["projectName"]?.toString()
                            )
                        } catch (e: Exception) {
                            Log.w(TAG, "Skip item: ${e.message}")
                            null
                        }
                    }

                    // Replace all cached items
                    Thread {
                        try {
                            runBlocking {
                                db.itemDao().deleteAll()
                                // Insert in batches of 500
                                cachedItems.chunked(500).forEach { batch ->
                                    db.itemDao().insertAll(batch)
                                }
                            }
                            prefs.edit().putLong(KEY_LAST_SYNC, System.currentTimeMillis()).apply()
                            Log.d(TAG, "Synced ${cachedItems.size} items")
                            callback(Result.success(cachedItems.size))
                        } catch (e: Exception) {
                            Log.e(TAG, "DB insert failed: ${e.message}")
                            callback(Result.failure(e))
                        }
                    }.start()
                } catch (e: Exception) {
                    Log.e(TAG, "Parse failed: ${e.message}")
                    callback(Result.failure(e))
                }
            }
        })
    }
}

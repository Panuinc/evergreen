package com.evergreen.rfid.api

import android.content.Context
import com.evergreen.rfid.db.entity.ScanRecordEntity
import com.evergreen.rfid.db.entity.ScanSessionEntity
import com.evergreen.rfid.model.DecodeResult
import com.evergreen.rfid.util.AppSettings
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

class ApiClient(private val context: Context) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(5, TimeUnit.SECONDS)
        .build()
    private val gson = Gson()
    private val auth = SupabaseAuth(context)
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    val baseUrl: String get() = AppSettings.baseUrl

    private fun buildRequest(url: String): Request.Builder {
        return Request.Builder()
            .url(url)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer ${auth.accessToken ?: ""}")
    }

    fun decodeRfid(epc: String, callback: (Result<DecodeResult>) -> Unit) {
        val json = gson.toJson(mapOf("epc" to epc))
        val body = json.toRequestBody("application/json".toMediaType())

        val request = buildRequest("$baseUrl/api/warehouse/rfid/decode")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val result = gson.fromJson(responseBody, DecodeResult::class.java)
                        callback(Result.success(result))
                    } catch (e: Exception) {
                        callback(Result.failure(e))
                    }
                } else {
                    callback(Result.failure(Exception("Decode failed: ${response.code}")))
                }
            }
        })
    }

    // --- Dashboard ---

    fun fetchDashboard(callback: (Result<Map<String, Any?>>) -> Unit) {
        val request = buildRequest("$baseUrl/api/warehouse/dashboard")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val type = object : TypeToken<Map<String, Any?>>() {}.type
                        val data: Map<String, Any?> = gson.fromJson(body, type)
                        callback(Result.success(data))
                    } catch (e: Exception) { callback(Result.failure(e)) }
                } else { callback(Result.failure(Exception("Dashboard error: ${response.code}"))) }
            }
        })
    }

    // --- Sessions (Upload) ---

    fun uploadSession(session: ScanSessionEntity, records: List<ScanRecordEntity>, callback: (Result<Map<String, Any?>>) -> Unit) {
        val sessionJson = mapOf(
            "name" to session.name,
            "type" to session.type,
            "started_at" to isoFormat.format(Date(session.startTime)),
            "ended_at" to if (session.endTime != null) isoFormat.format(Date(session.endTime)) else null,
            "gps_lat" to session.gpsLat,
            "gps_lon" to session.gpsLon,
            "tag_count" to session.tagCount,
            "total_reads" to session.totalReads
        )

        val body = gson.toJson(sessionJson).toRequestBody("application/json".toMediaType())
        val request = buildRequest("$baseUrl/api/warehouse/sessions")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val type = object : TypeToken<Map<String, Any?>>() {}.type
                        val data: Map<String, Any?> = gson.fromJson(responseBody, type)
                        val serverSessionId = data["id"]?.toString()

                        if (serverSessionId != null && records.isNotEmpty()) {
                            uploadRecords(serverSessionId, records) {}
                        }
                        callback(Result.success(data))
                    } catch (e: Exception) { callback(Result.failure(e)) }
                } else { callback(Result.failure(Exception("Upload failed: ${response.code}"))) }
            }
        })
    }

    private fun uploadRecords(sessionId: String, records: List<ScanRecordEntity>, callback: (Result<Any>) -> Unit) {
        val recordsJson = records.map { r ->
            mapOf(
                "epc" to r.epc,
                "rssi" to r.rssi,
                "item_number" to r.itemNumber,
                "item_name" to r.itemName,
                "photo_url" to r.photoPath,
                "read_count" to r.readCount,
                "scanned_at" to isoFormat.format(Date(r.scannedAt))
            )
        }

        val body = gson.toJson(recordsJson).toRequestBody("application/json".toMediaType())
        val request = buildRequest("$baseUrl/api/warehouse/sessions/$sessionId/records")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) callback(Result.success(Unit))
                else callback(Result.failure(Exception("Records upload failed: ${response.code}")))
            }
        })
    }

    // --- Orders ---

    fun fetchOrders(type: String?, callback: (Result<List<Map<String, Any?>>>) -> Unit) {
        val url = if (type != null) "$baseUrl/api/warehouse/orders?type=$type"
        else "$baseUrl/api/warehouse/orders"

        val request = buildRequest(url).get().build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val type2 = object : TypeToken<List<Map<String, Any?>>>() {}.type
                        val data: List<Map<String, Any?>> = gson.fromJson(body, type2)
                        callback(Result.success(data))
                    } catch (e: Exception) { callback(Result.failure(e)) }
                } else { callback(Result.failure(Exception("Orders error: ${response.code}"))) }
            }
        })
    }

    fun submitMatch(orderNo: String, orderType: String, expectedItems: List<Map<String, Any?>>, scannedItems: List<Map<String, Any?>>, callback: (Result<Map<String, Any?>>) -> Unit) {
        val json = mapOf(
            "order_type" to orderType,
            "order_number" to orderNo,
            "expected_items" to expectedItems,
            "scanned_items" to scannedItems
        )

        val body = gson.toJson(json).toRequestBody("application/json".toMediaType())
        val request = buildRequest("$baseUrl/api/warehouse/orders/$orderNo/match")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val type2 = object : TypeToken<Map<String, Any?>>() {}.type
                        val data: Map<String, Any?> = gson.fromJson(responseBody, type2)
                        callback(Result.success(data))
                    } catch (e: Exception) { callback(Result.failure(e)) }
                } else { callback(Result.failure(Exception("Match submit failed: ${response.code}"))) }
            }
        })
    }

    // --- Transfers ---

    fun createTransfer(fromLocation: String, toLocation: String, sessionId: String?, notes: String?, gpsLat: Double?, gpsLon: Double?, callback: (Result<Map<String, Any?>>) -> Unit) {
        val json = mapOf(
            "from_location" to fromLocation,
            "to_location" to toLocation,
            "session_id" to sessionId,
            "notes" to notes,
            "gps_lat" to gpsLat,
            "gps_lon" to gpsLon
        )

        val body = gson.toJson(json).toRequestBody("application/json".toMediaType())
        val request = buildRequest("$baseUrl/api/warehouse/transfers")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val type2 = object : TypeToken<Map<String, Any?>>() {}.type
                        val data: Map<String, Any?> = gson.fromJson(responseBody, type2)
                        callback(Result.success(data))
                    } catch (e: Exception) { callback(Result.failure(e)) }
                } else { callback(Result.failure(Exception("Transfer failed: ${response.code}"))) }
            }
        })
    }

    // --- Label Reprint ---

    fun printLabel(itemNumber: String, quantity: Int, encodeRfid: Boolean, rfidCode: Int, callback: (Result<Map<String, Any?>>) -> Unit) {
        val json = mapOf(
            "itemNumber" to itemNumber,
            "quantity" to quantity,
            "encodeRfid" to encodeRfid,
            "rfidCode" to rfidCode
        )

        val body = gson.toJson(json).toRequestBody("application/json".toMediaType())
        val request = buildRequest("$baseUrl/api/warehouse/print")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    try {
                        val type2 = object : TypeToken<Map<String, Any?>>() {}.type
                        val data: Map<String, Any?> = gson.fromJson(responseBody, type2)
                        callback(Result.success(data))
                    } catch (e: Exception) { callback(Result.failure(e)) }
                } else { callback(Result.failure(Exception("Print failed: ${response.code}"))) }
            }
        })
    }

    // --- Inventory (for sync) ---

    fun fetchAllItems(callback: (Result<String>) -> Unit) {
        val request = buildRequest("$baseUrl/api/warehouse/inventory")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { callback(Result.failure(e)) }
            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: ""
                if (response.isSuccessful) callback(Result.success(body))
                else callback(Result.failure(Exception("Fetch items failed: ${response.code}")))
            }
        })
    }
}

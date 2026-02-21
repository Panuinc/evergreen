package com.evergreen.rfid.api

import android.content.Context
import android.content.SharedPreferences
import com.evergreen.rfid.model.DecodeResult
import com.google.gson.Gson
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiClient(private val context: Context) {
    companion object {
        private const val PREFS_NAME = "evergreen_settings"
        private const val KEY_BASE_URL = "base_url"
        private const val DEFAULT_BASE_URL = "http://192.168.1.54:3000"
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(5, TimeUnit.SECONDS)
        .build()
    private val gson = Gson()
    private val auth = SupabaseAuth(context)
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    val baseUrl: String get() = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

    fun setBaseUrl(url: String) {
        prefs.edit().putString(KEY_BASE_URL, url).apply()
    }

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

}

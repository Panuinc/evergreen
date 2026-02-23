package com.evergreen.rfid.api

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

data class AuthResponse(
    @SerializedName("access_token") val accessToken: String = "",
    @SerializedName("refresh_token") val refreshToken: String = "",
    @SerializedName("expires_in") val expiresIn: Int = 0,
    @SerializedName("token_type") val tokenType: String = "",
    val user: AuthUser? = null
)

data class AuthUser(
    val id: String = "",
    val email: String = ""
)

data class AuthError(
    val error: String = "",
    @SerializedName("error_description") val errorDescription: String = "",
    val message: String = ""
)

data class PinVerifyResponse(
    val success: Boolean = false,
    @SerializedName("token_hash") val tokenHash: String = "",
    val email: String = "",
    val error: String? = null,
    val attemptsLeft: Int? = null,
    val locked: Boolean? = null
)

class SupabaseAuth(private val context: Context) {
    companion object {
        private const val SUPABASE_URL = "https://nersjlyaqgjrjznbwuhq.supabase.co"
        private const val SUPABASE_ANON_KEY = "sb_publishable_XKQRj-5GRrOSScRocisEpA_qJO5qWfm"
        private const val PREFS_NAME = "evergreen_auth"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_EMAIL = "email"
    }

    private val client = OkHttpClient()
    private val gson = Gson()
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    val accessToken: String? get() = prefs.getString(KEY_ACCESS_TOKEN, null)
    val isLoggedIn: Boolean get() = !accessToken.isNullOrEmpty()
    val email: String? get() = prefs.getString(KEY_EMAIL, null)

    fun login(email: String, password: String, callback: (Result<AuthResponse>) -> Unit) {
        val json = gson.toJson(mapOf("email" to email, "password" to password))
        val body = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$SUPABASE_URL/auth/v1/token?grant_type=password")
            .addHeader("apikey", SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    val auth = gson.fromJson(responseBody, AuthResponse::class.java)
                    saveTokens(auth, email)
                    callback(Result.success(auth))
                } else {
                    val error = try {
                        gson.fromJson(responseBody, AuthError::class.java)
                    } catch (e: Exception) {
                        AuthError(message = "Login failed: ${response.code}")
                    }
                    callback(Result.failure(Exception(error.errorDescription.ifEmpty { error.message })))
                }
            }
        })
    }

    fun loginWithPin(email: String, pin: String, baseUrl: String, callback: (Result<AuthResponse>) -> Unit) {
        // Step 1: Verify PIN with Next.js backend
        val pinJson = gson.toJson(mapOf("email" to email, "pin" to pin))
        val pinBody = pinJson.toRequestBody("application/json".toMediaType())

        val pinRequest = Request.Builder()
            .url("$baseUrl/api/auth/pin/verify")
            .addHeader("Content-Type", "application/json")
            .post(pinBody)
            .build()

        client.newCall(pinRequest).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""

                if (!response.isSuccessful) {
                    val pinResponse = try {
                        gson.fromJson(responseBody, PinVerifyResponse::class.java)
                    } catch (e: Exception) {
                        null
                    }
                    val errorMsg = when {
                        pinResponse?.locked == true -> pinResponse.error ?: "บัญชีถูกล็อก"
                        pinResponse?.attemptsLeft != null -> "${pinResponse.error ?: "PIN ไม่ถูกต้อง"} (เหลืออีก ${pinResponse.attemptsLeft} ครั้ง)"
                        pinResponse?.error != null -> pinResponse.error
                        else -> "PIN ไม่ถูกต้อง"
                    }
                    callback(Result.failure(Exception(errorMsg)))
                    return
                }

                val pinResponse = try {
                    gson.fromJson(responseBody, PinVerifyResponse::class.java)
                } catch (e: Exception) {
                    callback(Result.failure(Exception("ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้")))
                    return
                }

                if (!pinResponse.success || pinResponse.tokenHash.isEmpty()) {
                    callback(Result.failure(Exception("การยืนยัน PIN ล้มเหลว")))
                    return
                }

                // Step 2: Exchange token_hash for access/refresh tokens via Supabase
                verifyOtp(pinResponse.tokenHash, email, callback)
            }
        })
    }

    private fun verifyOtp(tokenHash: String, userEmail: String, callback: (Result<AuthResponse>) -> Unit) {
        val otpJson = gson.toJson(mapOf("token_hash" to tokenHash, "type" to "magiclink"))
        val otpBody = otpJson.toRequestBody("application/json".toMediaType())

        val otpRequest = Request.Builder()
            .url("$SUPABASE_URL/auth/v1/verify")
            .addHeader("apikey", SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .post(otpBody)
            .build()

        client.newCall(otpRequest).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(Exception("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")))
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    val auth = gson.fromJson(responseBody, AuthResponse::class.java)
                    saveTokens(auth, userEmail)
                    callback(Result.success(auth))
                } else {
                    callback(Result.failure(Exception("สร้างเซสชันล้มเหลว")))
                }
            }
        })
    }

    fun refreshToken(callback: (Result<AuthResponse>) -> Unit) {
        val storedRefreshToken = prefs.getString(KEY_REFRESH_TOKEN, null)
        if (storedRefreshToken.isNullOrEmpty()) {
            callback(Result.failure(Exception("No refresh token")))
            return
        }

        val json = gson.toJson(mapOf("refresh_token" to storedRefreshToken))
        val body = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$SUPABASE_URL/auth/v1/token?grant_type=refresh_token")
            .addHeader("apikey", SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    val auth = gson.fromJson(responseBody, AuthResponse::class.java)
                    val currentEmail = email ?: ""
                    saveTokens(auth, currentEmail)
                    callback(Result.success(auth))
                } else {
                    callback(Result.failure(Exception("Refresh failed: ${response.code}")))
                }
            }
        })
    }

    fun refreshTokenSync(): Boolean {
        val storedRefreshToken = prefs.getString(KEY_REFRESH_TOKEN, null)
        if (storedRefreshToken.isNullOrEmpty()) return false

        val json = gson.toJson(mapOf("refresh_token" to storedRefreshToken))
        val body = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$SUPABASE_URL/auth/v1/token?grant_type=refresh_token")
            .addHeader("apikey", SUPABASE_ANON_KEY)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: ""
                val auth = gson.fromJson(responseBody, AuthResponse::class.java)
                val currentEmail = email ?: ""
                saveTokens(auth, currentEmail)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    fun logout() {
        prefs.edit().clear().apply()
    }

    private fun saveTokens(auth: AuthResponse, email: String) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, auth.accessToken)
            .putString(KEY_REFRESH_TOKEN, auth.refreshToken)
            .putString(KEY_EMAIL, email)
            .apply()
    }
}

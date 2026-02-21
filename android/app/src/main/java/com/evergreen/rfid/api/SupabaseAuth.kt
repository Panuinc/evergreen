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

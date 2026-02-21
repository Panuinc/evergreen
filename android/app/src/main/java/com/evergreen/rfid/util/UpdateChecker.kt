package com.evergreen.rfid.util

import android.app.Activity
import android.util.Log
import androidx.appcompat.app.AlertDialog
import com.evergreen.rfid.BuildConfig
import com.evergreen.rfid.R
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.*
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Checks for app updates from /api/warehouse/app-version
 */
object UpdateChecker {
    private const val TAG = "UpdateChecker"

    data class AppVersion(
        val id: String? = null,
        val version_name: String = "",
        val version_code: Int = 0,
        val apk_url: String? = null,
        val release_notes: String? = null,
        val is_mandatory: Boolean = false
    )

    fun check(activity: Activity) {
        val baseUrl = AppSettings.baseUrl
        if (baseUrl.isEmpty()) return

        val client = OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        val request = Request.Builder()
            .url("$baseUrl/api/warehouse/app-version")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.d(TAG, "Update check failed: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                val body = response.body?.string() ?: return
                if (!response.isSuccessful) return

                try {
                    val type = object : TypeToken<AppVersion>() {}.type
                    val version: AppVersion = Gson().fromJson(body, type)

                    val currentCode = BuildConfig.VERSION_CODE
                    Log.d(TAG, "Current: $currentCode, Latest: ${version.version_code}")

                    if (version.version_code > currentCode && !version.apk_url.isNullOrEmpty()) {
                        activity.runOnUiThread {
                            showUpdateDialog(activity, version)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Parse error: ${e.message}")
                }
            }
        })
    }

    private fun showUpdateDialog(activity: Activity, version: AppVersion) {
        val title = String.format(
            activity.getString(R.string.update_available),
            version.version_name
        )

        val message = buildString {
            if (!version.release_notes.isNullOrEmpty()) {
                appendLine(version.release_notes)
                appendLine()
            }
            append(activity.getString(R.string.update_message))
        }

        val builder = AlertDialog.Builder(activity)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton(R.string.update_download) { _, _ ->
                ApkDownloader.download(activity, version.apk_url!!, version.version_name)
            }

        if (version.is_mandatory) {
            builder.setCancelable(false)
        } else {
            builder.setNegativeButton(R.string.update_later, null)
        }

        builder.show()
    }
}

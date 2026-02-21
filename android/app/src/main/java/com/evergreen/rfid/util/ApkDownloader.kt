package com.evergreen.rfid.util

import android.app.Activity
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import android.widget.Toast
import androidx.core.content.FileProvider
import com.evergreen.rfid.R
import java.io.File

/**
 * Downloads APK via DownloadManager and triggers install
 */
object ApkDownloader {
    private const val TAG = "ApkDownloader"
    private var downloadId: Long = -1

    fun download(activity: Activity, url: String, versionName: String) {
        Toast.makeText(activity, activity.getString(R.string.update_downloading), Toast.LENGTH_SHORT).show()

        val fileName = "evergreen-rfid-$versionName.apk"

        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle("Evergreen RFID $versionName")
            .setDescription(activity.getString(R.string.update_downloading))
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setMimeType("application/vnd.android.package-archive")

        val dm = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        downloadId = dm.enqueue(request)

        // Register receiver for download completion
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) ?: return
                if (id != downloadId) return

                try {
                    activity.unregisterReceiver(this)
                } catch (_: Exception) {}

                val file = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    fileName
                )

                if (file.exists()) {
                    installApk(activity, file)
                } else {
                    Log.e(TAG, "Downloaded file not found")
                    activity.runOnUiThread {
                        Toast.makeText(activity, activity.getString(R.string.update_failed), Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(
                receiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            activity.registerReceiver(
                receiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            )
        }
    }

    private fun installApk(activity: Activity, file: File) {
        try {
            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(
                    activity,
                    "${activity.packageName}.fileprovider",
                    file
                )
            } else {
                Uri.fromFile(file)
            }

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            activity.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Install error: ${e.message}")
            activity.runOnUiThread {
                Toast.makeText(activity, "Install error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}

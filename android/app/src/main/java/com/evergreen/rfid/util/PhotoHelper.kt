package com.evergreen.rfid.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

object PhotoHelper {
    private var currentPhotoPath: String? = null

    fun createCaptureIntent(context: Context): Pair<Intent, String>? {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        val photoFile = createImageFile(context) ?: return null
        currentPhotoPath = photoFile.absolutePath

        val photoUri: Uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            photoFile
        )

        intent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        return Pair(intent, photoFile.absolutePath)
    }

    private fun createImageFile(context: Context): File? {
        return try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val storageDir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)
            File.createTempFile("SCAN_${timestamp}_", ".jpg", storageDir)
        } catch (e: Exception) {
            null
        }
    }

    fun getPhotoPath(): String? = currentPhotoPath
}

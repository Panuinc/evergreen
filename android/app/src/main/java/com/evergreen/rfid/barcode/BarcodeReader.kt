package com.evergreen.rfid.barcode

import android.content.Context
import android.util.Log
import com.rscja.deviceapi.Barcode2D

class BarcodeReader {
    companion object {
        private const val TAG = "BarcodeReader"
    }

    private var mBarcode: Barcode2D? = null
    var isInitialized = false
        private set

    fun init(context: Context): Boolean {
        return try {
            mBarcode = Barcode2D.getInstance()
            if (mBarcode == null) {
                Log.e(TAG, "Barcode2D.getInstance() returned null")
                return false
            }
            val ok = mBarcode!!.open(context)
            isInitialized = ok
            Log.d(TAG, "Barcode init: $ok")
            ok
        } catch (e: Exception) {
            Log.e(TAG, "Barcode init error: ${e.message}")
            isInitialized = false
            false
        }
    }

    fun scan(callback: (String?) -> Unit) {
        if (!isInitialized || mBarcode == null) {
            callback(null)
            return
        }

        Thread {
            try {
                val result = mBarcode?.scan()
                callback(result)
            } catch (e: Exception) {
                Log.e(TAG, "Barcode scan error: ${e.message}")
                callback(null)
            }
        }.start()
    }

    fun release() {
        try {
            mBarcode?.close()
            mBarcode = null
            isInitialized = false
            Log.d(TAG, "Barcode released")
        } catch (e: Exception) {
            Log.e(TAG, "Barcode release error: ${e.message}")
        }
    }
}

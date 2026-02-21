package com.evergreen.rfid.rfid

import android.content.Context
import android.os.Build
import android.util.Log
import com.evergreen.rfid.util.AppSettings
import com.rscja.deviceapi.RFIDWithUHFUART
import com.rscja.deviceapi.entity.UHFTAGInfo
import com.rscja.deviceapi.interfaces.IUHFInventoryCallback
import com.rscja.deviceapi.interfaces.IUHFLocationCallback

class RFIDReader {
    companion object {
        private const val TAG = "RFIDReader"
    }

    private var mReader: RFIDWithUHFUART? = null
    private var isScanning = false
    private var scanThread: Thread? = null
    var lastError: String = ""
        private set

    val isInitialized: Boolean get() = mReader != null

    private fun getSystemProp(key: String): String {
        return try {
            val clazz = Class.forName("android.os.SystemProperties")
            val method = clazz.getDeclaredMethod("get", String::class.java)
            method.invoke(null, key) as? String ?: ""
        } catch (_: Exception) { "" }
    }

    fun init(context: Context): Boolean {
        val diag = StringBuilder()
        diag.appendLine("MODEL=${Build.MODEL}")
        diag.appendLine("DISPLAY=${Build.DISPLAY}")

        val cwModel = getSystemProp("ro.cw.model")
        diag.appendLine("ro.cw.model=$cwModel")

        Log.d(TAG, diag.toString())

        // Strategy: try multiple approaches
        // Approach 1: WITHOUT setPowerOnBySystem (uses native JNI UHFInit)
        // Approach 2: WITH setPowerOnBySystem (uses broadcast to system service)
        for (approach in 1..2) {
            for (attempt in 1..2) {
                try {
                    Log.d(TAG, "Approach $approach, attempt $attempt...")
                    mReader = RFIDWithUHFUART.getInstance()
                    if (mReader == null) {
                        diag.appendLine("A${approach}#${attempt}: getInstance=null")
                        Thread.sleep(500)
                        continue
                    }

                    if (approach == 2) {
                        // Approach 2: use system power-on broadcast
                        try {
                            mReader?.setPowerOnBySystem(context)
                            Thread.sleep(1000)
                            diag.appendLine("A2#${attempt}: setPowerOnBySystem OK")
                        } catch (e: Exception) {
                            diag.appendLine("A2#${attempt}: setPowerOnBySystem err=${e.message}")
                        }
                    }

                    val ok = mReader!!.init(context)
                    val errCode = try { mReader?.getErrCode() } catch (_: Exception) { -999 }
                    diag.appendLine("A${approach}#${attempt}: init=$ok err=$errCode")
                    Log.d(TAG, "A${approach}#${attempt}: init=$ok err=$errCode")

                    if (ok) {
                        // EPC-only mode = much faster than EPC+TID
                        try { mReader?.setEPCMode() } catch (_: Exception) {}
                        // Set power from settings
                        try { mReader?.setPower(AppSettings.rfidPower) } catch (_: Exception) {}
                        lastError = ""
                        Log.d(TAG, "RFID ready! approach=$approach attempt=$attempt")
                        return true
                    } else {
                        try { mReader?.free() } catch (_: Exception) {}
                        mReader = null
                        Thread.sleep(1000)
                    }
                } catch (e: Exception) {
                    diag.appendLine("A${approach}#${attempt}: ${e.javaClass.simpleName}: ${e.message}")
                    Log.e(TAG, "Init error", e)
                    try { mReader?.free() } catch (_: Exception) {}
                    mReader = null
                    Thread.sleep(500)
                }
            }
        }

        // Approach 3: try calling uhfPowerOn_11 directly via reflection (C72_6765 specific GPIO)
        try {
            diag.appendLine("A3: trying uhfPowerOn_11...")
            mReader = RFIDWithUHFUART.getInstance()
            if (mReader != null) {
                // Get the internal iuhf field and call uhfPowerOn_11
                val iuhfField = RFIDWithUHFUART::class.java.getDeclaredField("iuhf")
                iuhfField.isAccessible = true
                val iuhf = iuhfField.get(null)
                if (iuhf != null) {
                    diag.appendLine("A3: iuhf class=${iuhf.javaClass.name}")
                    try {
                        val powerMethod = iuhf.javaClass.getMethod("uhfPowerOn_11")
                        val result = powerMethod.invoke(iuhf)
                        diag.appendLine("A3: uhfPowerOn_11=$result")
                        Thread.sleep(500)
                    } catch (e: Exception) {
                        diag.appendLine("A3: uhfPowerOn_11 err=${e.message}")
                    }

                    val ok = mReader!!.init(context)
                    val errCode = try { mReader?.getErrCode() } catch (_: Exception) { -999 }
                    diag.appendLine("A3: init=$ok err=$errCode")

                    if (ok) {
                        try { mReader?.setEPCMode() } catch (_: Exception) {}
                        try { mReader?.setPower(AppSettings.rfidPower) } catch (_: Exception) {}
                        lastError = ""
                        return true
                    }
                }
                try { mReader?.free() } catch (_: Exception) {}
                mReader = null
            }
        } catch (e: Exception) {
            diag.appendLine("A3: ${e.javaClass.simpleName}: ${e.message}")
        }

        lastError = diag.toString()
        return false
    }

    fun release() {
        stopScan()
        try {
            mReader?.free()
            mReader = null
            Log.d(TAG, "Reader released")
        } catch (e: Exception) {
            Log.e(TAG, "Release error: ${e.message}")
        }
    }

    fun startScan(onTag: (epc: String, rssi: String) -> Unit): Boolean {
        if (mReader == null || isScanning) return false

        return try {
            // Set callback for tag reads
            mReader?.setInventoryCallback(IUHFInventoryCallback { tag ->
                if (tag != null && !tag.epc.isNullOrEmpty()) {
                    val epc = tag.epc.replace(" ", "")
                    onTag(epc, tag.rssi ?: "")
                }
            })

            val started = mReader?.startInventoryTag() ?: false
            if (started) {
                isScanning = true
                Log.d(TAG, "Scan started (callback mode)")

                // Watchdog thread: inventory has internal timeout (~5-6s)
                // Monitor isInventorying() and auto-restart to keep RF active continuously
                scanThread = Thread {
                    while (isScanning) {
                        try {
                            Thread.sleep(500)
                            if (isScanning && mReader != null) {
                                val stillRunning = try { mReader?.isInventorying ?: false } catch (_: Exception) { false }
                                if (!stillRunning) {
                                    Log.d(TAG, "Inventory stopped, restarting...")
                                    mReader?.startInventoryTag()
                                }
                            }
                        } catch (_: Exception) {}
                    }
                }
                scanThread?.start()
            }
            isScanning
        } catch (e: Exception) {
            Log.e(TAG, "Start scan error: ${e.message}")
            false
        }
    }

    fun stopScan() {
        isScanning = false
        try {
            mReader?.stopInventory()
            mReader?.setInventoryCallback(null)
            scanThread?.join(1000)
            scanThread = null
            Log.d(TAG, "Scan stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Stop scan error: ${e.message}")
        }
    }

    fun readSingleTag(): Pair<String, String>? {
        return try {
            val tag = mReader?.inventorySingleTag()
            if (tag != null && tag.epc.isNotEmpty()) {
                Pair(tag.epc.replace(" ", ""), tag.rssi ?: "")
            } else null
        } catch (e: Exception) {
            Log.e(TAG, "Read single tag error: ${e.message}")
            null
        }
    }

    fun setPower(power: Int): Boolean {
        return try {
            mReader?.setPower(power) ?: false
        } catch (e: Exception) {
            false
        }
    }

    fun getPower(): Int {
        return try {
            mReader?.power ?: -1
        } catch (e: Exception) {
            -1
        }
    }

    fun getVersion(): String? {
        return try {
            // Try multiple method names — SDK may use getVersion, getFirmwareVersion, etc.
            val reader = mReader ?: return null
            val methods = reader.javaClass.methods
            for (name in listOf("getVersion", "getFirmwareVersion", "firmwareVersion")) {
                val m = methods.find { it.name == name && it.parameterCount == 0 }
                if (m != null) {
                    val result = m.invoke(reader)
                    if (result != null) return result.toString()
                }
            }
            null
        } catch (e: Exception) {
            null
        }
    }

    fun getHardwareVersion(): String? {
        return try {
            val reader = mReader ?: return null
            val methods = reader.javaClass.methods
            for (name in listOf("getHardwareVersion", "hardwareVersion")) {
                val m = methods.find { it.name == name && it.parameterCount == 0 }
                if (m != null) {
                    val result = m.invoke(reader)
                    if (result != null) return result.toString()
                }
            }
            null
        } catch (e: Exception) {
            null
        }
    }

    private var isLocating = false

    fun startLocation(epc: String, onSignal: (Int) -> Unit): Boolean {
        if (mReader == null || isLocating) return false
        return try {
            // Stop any ongoing scan first
            if (isScanning) stopScan()

            isLocating = true

            // Use reflection to find and call startLocation — the SDK callback interface
            // may have varying parameter types across versions
            val reader = mReader!!
            val methods = reader.javaClass.methods

            // Find startLocation method
            val locMethod = methods.filter { it.name == "startLocation" }
                .sortedByDescending { it.parameterCount }
                .firstOrNull()

            if (locMethod == null) {
                Log.e(TAG, "No startLocation method found in SDK")
                isLocating = false
                return false
            }

            Log.d(TAG, "startLocation params: ${locMethod.parameterTypes.joinToString { it.name }}")

            // Create callback using SAM conversion — the callback interface typically
            // provides RSSI value as first int parameter
            val callback = IUHFLocationCallback { rssi, _ ->
                if (isLocating) {
                    // rssi is typically 0-100 range
                    onSignal(rssi)
                }
            }

            val started = when (locMethod.parameterCount) {
                2 -> locMethod.invoke(reader, epc, callback) as? Boolean ?: false
                3 -> locMethod.invoke(reader, null, epc, callback) as? Boolean ?: false
                else -> false
            }

            if (started) {
                Log.d(TAG, "Location started for EPC: $epc")
            } else {
                isLocating = false
                Log.e(TAG, "startLocation returned false")
            }
            started
        } catch (e: Exception) {
            Log.e(TAG, "Start location error: ${e.message}")
            isLocating = false
            false
        }
    }

    fun stopLocation() {
        isLocating = false
        try {
            mReader?.stopLocation()
            Log.d(TAG, "Location stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Stop location error: ${e.message}")
        }
    }

    /**
     * Write EPC data to a tag in the field.
     * The tag must be in range and only one tag should be present.
     */
    fun writeEpc(epc: String): Boolean {
        if (mReader == null) return false
        return try {
            // Stop any ongoing operations
            if (isScanning) stopScan()
            if (isLocating) stopLocation()

            val reader = mReader!!
            // Try SDK writeDataToEpc method via reflection (varies by SDK version)
            val methods = reader.javaClass.methods

            // Try writeDataToEpc(String accessPwd, String epc, int epcLen, int memBank, int offset)
            // or writeEPC(String epc)
            for (name in listOf("writeDataToEpc", "writeEPC", "writeTag")) {
                val m = methods.find { it.name == name }
                if (m != null) {
                    Log.d(TAG, "Using write method: ${m.name} params=${m.parameterCount}")
                    val result = when (m.parameterCount) {
                        1 -> m.invoke(reader, epc)
                        2 -> m.invoke(reader, "00000000", epc) // accessPwd, epc
                        5 -> {
                            // accessPwd, epc, epcLen, memBank(1=EPC), offset(2)
                            val epcLen = epc.length / 4 // hex chars to words
                            m.invoke(reader, "00000000", epc, epcLen, 1, 2)
                        }
                        else -> continue
                    }
                    val success = result as? Boolean ?: (result != null)
                    Log.d(TAG, "Write result: $success")
                    return success
                }
            }
            Log.e(TAG, "No write method found in SDK")
            false
        } catch (e: Exception) {
            Log.e(TAG, "Write EPC error: ${e.message}")
            false
        }
    }

    fun getTemperature(): String? {
        return try {
            val reader = mReader ?: return null
            val methods = reader.javaClass.methods
            for (name in listOf("getTemperature", "temperature")) {
                val m = methods.find { it.name == name && it.parameterCount == 0 }
                if (m != null) {
                    val result = m.invoke(reader)
                    if (result != null) return "${result}°C"
                }
            }
            null
        } catch (e: Exception) {
            null
        }
    }
}

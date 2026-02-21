package com.evergreen.rfid.ui

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.TriggerListener
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.FragmentScannerBinding
import com.evergreen.rfid.databinding.ItemScanResultBinding
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.ScanRecordEntity
import com.evergreen.rfid.db.entity.ScanSessionEntity
import com.evergreen.rfid.model.DecodeResult
import com.evergreen.rfid.model.ScanResult
import com.evergreen.rfid.sync.ConnectivityHelper
import com.evergreen.rfid.util.AppSettings
import com.evergreen.rfid.util.EpcDecoder
import com.evergreen.rfid.util.ExportHelper
import com.evergreen.rfid.util.LocationHelper
import com.evergreen.rfid.util.PhotoHelper
import kotlinx.coroutines.*
import kotlinx.coroutines.runBlocking
import java.text.SimpleDateFormat
import java.util.*

class ScannerFragment : Fragment(), TriggerListener {
    private var _binding: FragmentScannerBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient
    private lateinit var db: AppDatabase
    private val results = mutableListOf<ScanResult>()
    private lateinit var adapter: ScanResultAdapter
    private var isScanning = false
    private var toneGenerator: ToneGenerator? = null
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Modes: 0=Single, 1=Auto, 2=Count
    private var scanMode = 0

    // Stats
    private var totalReads = 0
    private var scanStartTime = 0L

    // Count mode
    private val countSet = mutableSetOf<String>()

    // GPS
    private var sessionLat: Double? = null
    private var sessionLon: Double? = null

    // Photo capture
    private var pendingPhotoEpc: String? = null
    private var pendingPhotoPath: String? = null
    private val photoLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK && pendingPhotoEpc != null && pendingPhotoPath != null) {
            val idx = results.indexOfFirst { it.epc == pendingPhotoEpc }
            if (idx >= 0) {
                results[idx] = results[idx].copy(photoPath = pendingPhotoPath)
                adapter.notifyItemChanged(idx)
            }
        }
        pendingPhotoEpc = null
        pendingPhotoPath = null
    }

    companion object {
        private const val MSG_TAG = 1
        private const val MSG_TIMER = 2
    }

    private val uiHandler: Handler = object : Handler(Looper.getMainLooper()) {
        override fun handleMessage(msg: Message) {
            when (msg.what) {
                MSG_TAG -> {
                    val data = msg.obj as? Pair<*, *> ?: return
                    val epc = data.first as String
                    val rssi = data.second as String
                    totalReads++

                    if (AppSettings.soundEnabled) {
                        try { toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 30) } catch (_: Exception) {}
                    }

                    if (scanMode == 2) {
                        countSet.add(epc)
                        updateCountDisplay()
                    } else {
                        handleTagOnUiThread(epc, rssi)
                    }
                    updateStats()
                }
                MSG_TIMER -> {
                    if (isScanning && scanStartTime > 0) {
                        val elapsed = (System.currentTimeMillis() - scanStartTime) / 1000.0
                        _binding?.tvElapsed?.text = String.format("%.1fs", elapsed)
                        sendEmptyMessageDelayed(MSG_TIMER, 100)
                    }
                }
            }
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentScannerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        apiClient = ApiClient(requireContext())
        db = AppDatabase.getInstance(requireContext())
        adapter = ScanResultAdapter(results,
            onLocate = { epc -> openLocator(epc) },
            onPhoto = { epc -> takePhoto(epc) }
        )

        if (AppSettings.soundEnabled) {
            try { toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100) } catch (_: Exception) {}
        }

        binding.rvResults.layoutManager = LinearLayoutManager(requireContext())
        binding.rvResults.adapter = adapter

        // Mode toggle: default Single
        binding.toggleMode.check(R.id.btnModeSingle)
        binding.toggleMode.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                scanMode = when (checkedId) {
                    R.id.btnModeAuto -> 1
                    R.id.btnModeCount -> 2
                    else -> 0
                }
                if (isScanning) stopScan()
                updateModeDisplay()
                updateScanButton()
            }
        }

        binding.btnScan.setOnClickListener {
            when (scanMode) {
                1, 2 -> toggleAutoScan()
                else -> doSingleScan()
            }
        }

        binding.btnClear.setOnClickListener {
            results.clear()
            countSet.clear()
            totalReads = 0
            adapter.notifyDataSetChanged()
            updateCount()
            updateStats()
            updateCountDisplay()
        }

        binding.btnSummary.setOnClickListener { showSummary() }
        binding.btnExport.setOnClickListener { showExportDialog() }
        binding.btnSaveSession.setOnClickListener { saveSession() }

        // Show notice if RFID reader not available
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            binding.tvNotice.visibility = View.VISIBLE
        }

        // Capture GPS at fragment start
        captureGps()

        updateModeDisplay()
        updateScanButton()
        updateStats()
    }

    private fun captureGps() {
        if (ActivityCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            return
        }
        try {
            val locHelper = LocationHelper(requireContext())
            locHelper.getLastLocation { lat, lon ->
                sessionLat = lat
                sessionLon = lon
            }
        } catch (_: Exception) {}
    }

    // Physical trigger button
    override fun onTriggerPressed() {
        activity?.runOnUiThread {
            when (scanMode) {
                1, 2 -> toggleAutoScan()
                else -> doSingleScan()
            }
        }
    }

    override fun onTriggerReleased() {}

    private fun doSingleScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), getString(R.string.scan_rfid_not_ready), Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnScan.text = getString(R.string.scan_reading)
        binding.btnScan.isEnabled = false

        Thread {
            val tag = reader.readSingleTag()
            activity?.runOnUiThread {
                binding.btnScan.isEnabled = true
                updateScanButton()
                if (tag != null) {
                    totalReads++
                    if (AppSettings.soundEnabled) {
                        try { toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 30) } catch (_: Exception) {}
                    }
                    handleTagOnUiThread(tag.first, tag.second)
                    updateStats()
                } else {
                    Toast.makeText(requireContext(), getString(R.string.scan_no_tag), Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    private fun toggleAutoScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), getString(R.string.scan_rfid_not_ready), Toast.LENGTH_SHORT).show()
            return
        }

        if (isScanning) {
            stopScan()
        } else {
            isScanning = true
            scanStartTime = System.currentTimeMillis()
            uiHandler.sendEmptyMessage(MSG_TIMER)
            updateScanButton()
            reader.startScan { epc, rssi ->
                val msg = uiHandler.obtainMessage(MSG_TAG, Pair(epc, rssi))
                uiHandler.sendMessage(msg)
            }
        }
    }

    private fun stopScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        reader?.stopScan()
        isScanning = false
        uiHandler.removeMessages(MSG_TIMER)
        if (scanStartTime > 0) {
            val elapsed = (System.currentTimeMillis() - scanStartTime) / 1000.0
            binding.tvElapsed.text = String.format("%.1fs", elapsed)
        }
        updateScanButton()
    }

    private fun updateModeDisplay() {
        if (scanMode == 2) {
            binding.countDisplay.visibility = View.VISIBLE
            binding.normalDisplay.visibility = View.GONE
        } else {
            binding.countDisplay.visibility = View.GONE
            binding.normalDisplay.visibility = View.VISIBLE
        }
    }

    private fun updateCountDisplay() {
        _binding?.tvBigCount?.text = countSet.size.toString()
        _binding?.tvBigReads?.text = "${getString(R.string.count_total_reads)}: $totalReads"
    }

    private fun updateScanButton() {
        val ctx = context ?: return
        when (scanMode) {
            1, 2 -> {
                if (isScanning) {
                    binding.btnScan.text = getString(R.string.scan_stop)
                    binding.btnScan.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(ctx, R.color.error))
                } else {
                    binding.btnScan.text = if (scanMode == 2) getString(R.string.mode_count) else getString(R.string.scan_start_auto)
                    binding.btnScan.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(ctx, R.color.primary))
                }
            }
            else -> {
                binding.btnScan.text = getString(R.string.scan_single)
                binding.btnScan.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(ctx, R.color.primary))
            }
        }
    }

    private fun updateStats() {
        _binding?.tvTagCount?.text = if (scanMode == 2) countSet.size.toString() else results.size.toString()
        _binding?.tvTotalReads?.text = totalReads.toString()
    }

    private fun handleTagOnUiThread(epc: String, rssi: String) {
        val existingIdx = results.indexOfFirst { it.epc == epc }
        if (existingIdx >= 0) {
            val existing = results[existingIdx]
            existing.readCount++
            val updatedRssi = if (rssi.isNotEmpty()) rssi else existing.rssi
            results[existingIdx] = existing.copy(rssi = updatedRssi)
            adapter.notifyItemChanged(existingIdx)
            updateCount()
            return
        }

        val scanResult = ScanResult(epc = epc, rssi = rssi)
        results.add(0, scanResult)
        adapter.notifyItemInserted(0)
        binding.rvResults.scrollToPosition(0)
        updateCount()

        // Decode: use offline if no network, otherwise API
        if (AppSettings.autoDecode) {
            decodeTag(epc)
        }
    }

    private fun decodeTag(epc: String) {
        if (ConnectivityHelper.isOnline) {
            apiClient.decodeRfid(epc) { result ->
                result.fold(
                    onSuccess = { decoded -> updateDecodeResult(epc, decoded) },
                    onFailure = { decodeOffline(epc) }
                )
            }
        } else {
            decodeOffline(epc)
        }
    }

    private fun decodeOffline(epc: String) {
        scope.launch {
            try {
                val decoded = withContext(Dispatchers.IO) {
                    EpcDecoder.decode(epc, db)
                }
                updateDecodeResult(epc, decoded)
            } catch (e: Exception) {
                updateDecodeResult(epc, DecodeResult(success = false, message = "Decode error: ${e.message}"))
            }
        }
    }

    private fun updateDecodeResult(epc: String, decoded: DecodeResult) {
        activity?.runOnUiThread {
            val idx = results.indexOfFirst { it.epc == epc }
            if (idx >= 0) {
                results[idx] = results[idx].copy(decodeResult = decoded)
                adapter.notifyItemChanged(idx)
            }
        }
    }

    private fun openLocator(epc: String) {
        if (isScanning) stopScan()
        (activity as? MainActivity)?.loadFragment(TagLocatorFragment.newInstance(epc))
    }

    private fun takePhoto(epc: String) {
        val pair = PhotoHelper.createCaptureIntent(requireContext()) ?: return
        pendingPhotoEpc = epc
        pendingPhotoPath = pair.second
        photoLauncher.launch(pair.first)
    }

    private fun saveSession() {
        if (results.isEmpty() && countSet.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.scan_no_results), Toast.LENGTH_SHORT).show()
            return
        }

        val sessionName = "Scan ${SimpleDateFormat("dd/MM HH:mm", Locale.getDefault()).format(Date())}"
        val endTime = System.currentTimeMillis()

        Thread {
            try {
                val session = ScanSessionEntity(
                    name = sessionName,
                    type = if (scanMode == 2) "count" else "scan",
                    startTime = if (scanStartTime > 0) scanStartTime else endTime,
                    endTime = endTime,
                    userId = SupabaseAuth(requireContext()).email ?: "",
                    gpsLat = sessionLat,
                    gpsLon = sessionLon,
                    tagCount = if (scanMode == 2) countSet.size else results.size,
                    totalReads = totalReads,
                    synced = false
                )
                val sessionId = runBlocking { db.scanDao().insertSession(session) }

                if (scanMode != 2 && results.isNotEmpty()) {
                    val records = results.map { r ->
                        ScanRecordEntity(
                            sessionId = sessionId,
                            epc = r.epc,
                            rssi = r.rssi,
                            itemNumber = r.decodeResult?.item?.number,
                            itemName = r.decodeResult?.item?.displayName,
                            photoPath = r.photoPath,
                            readCount = r.readCount,
                            scannedAt = r.timestamp
                        )
                    }
                    runBlocking { db.scanDao().insertRecords(records) }
                }

                activity?.runOnUiThread {
                    Toast.makeText(requireContext(), getString(R.string.session_saved), Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                activity?.runOnUiThread {
                    Toast.makeText(requireContext(), "Save failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    private fun showSummary() {
        if (results.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.scan_no_results), Toast.LENGTH_SHORT).show()
            return
        }

        val grouped = mutableMapOf<String, MutableList<ScanResult>>()
        var unknownCount = 0

        for (r in results) {
            val itemNum = r.decodeResult?.item?.number
            if (itemNum != null) {
                grouped.getOrPut(itemNum) { mutableListOf() }.add(r)
            } else {
                unknownCount++
            }
        }

        val sb = StringBuilder()
        sb.appendLine(String.format(getString(R.string.summary_total), results.size, totalReads))
        sb.appendLine("──────────────")

        for ((itemNum, items) in grouped.toSortedMap()) {
            val name = items.firstOrNull()?.decodeResult?.item?.displayName ?: ""
            val inv = items.firstOrNull()?.decodeResult?.item?.inventory?.toInt() ?: 0
            val unit = items.firstOrNull()?.decodeResult?.item?.baseUnitOfMeasure ?: ""
            sb.appendLine()
            sb.appendLine("$itemNum  (${String.format(getString(R.string.summary_pieces), items.size)})")
            if (name.isNotEmpty()) sb.appendLine(name)
            if (inv > 0) {
                val diff = items.size - inv
                val status = when {
                    diff == 0 -> getString(R.string.summary_match)
                    diff > 0 -> String.format(getString(R.string.summary_over), diff)
                    else -> String.format(getString(R.string.summary_under), -diff)
                }
                sb.appendLine(String.format(getString(R.string.summary_inventory), inv, unit, status))
            }
        }

        if (unknownCount > 0) {
            sb.appendLine()
            sb.appendLine(String.format(getString(R.string.summary_unknown), unknownCount))
        }

        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.summary_title))
            .setMessage(sb.toString())
            .setPositiveButton(getString(R.string.ok), null)
            .show()
    }

    private fun showExportDialog() {
        if (results.isEmpty() && countSet.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.scan_no_results), Toast.LENGTH_SHORT).show()
            return
        }

        val options = arrayOf(getString(R.string.export_csv), getString(R.string.export_text))
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.scan_export))
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        val csv = ExportHelper.exportAsCsv(results)
                        ExportHelper.share(requireContext(), csv, "text/csv", "Evergreen Scan Results.csv")
                    }
                    1 -> {
                        val text = ExportHelper.exportAsText(results)
                        ExportHelper.share(requireContext(), text, "text/plain", "Evergreen Scan Results")
                    }
                }
            }
            .show()
    }

    private fun updateCount() {
        _binding?.tvCount?.text = String.format(getString(R.string.scan_results), results.size)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        uiHandler.removeCallbacksAndMessages(null)
        scope.cancel()
        if (isScanning) {
            (activity as? MainActivity)?.rfidReader?.stopScan()
        }
        toneGenerator?.release()
        toneGenerator = null
        _binding = null
    }
}

class ScanResultAdapter(
    private val items: List<ScanResult>,
    private val onLocate: ((String) -> Unit)? = null,
    private val onPhoto: ((String) -> Unit)? = null
) : RecyclerView.Adapter<ScanResultAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemScanResultBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemScanResultBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        val decoded = item.decodeResult

        if (decoded?.item != null) {
            holder.binding.tvItemNumber.text = decoded.item.number
            holder.binding.tvItemName.text = decoded.item.displayName
            holder.binding.tvPiece.text = if (decoded.decoded?.pieceNumber != null)
                "Piece ${decoded.decoded.pieceNumber}/${decoded.decoded.totalPieces}" else ""
            holder.binding.tvInventory.text = "Stock: ${decoded.item.inventory.toInt()} ${decoded.item.baseUnitOfMeasure}"
            holder.binding.tvPrice.text = "฿${String.format("%,.2f", decoded.item.unitPrice)}"
            holder.binding.tvHex.text = item.epc
        } else {
            holder.binding.tvItemNumber.text = decoded?.message ?: holder.itemView.context.getString(R.string.scan_searching)
            holder.binding.tvItemName.text = ""
            holder.binding.tvPiece.text = ""
            holder.binding.tvInventory.text = ""
            holder.binding.tvPrice.text = ""
            holder.binding.tvHex.text = item.epc
        }

        holder.binding.tvReadCount.text = "×${item.readCount}"
        holder.binding.tvRssi.text = if (item.rssi.isNotEmpty()) "RSSI: ${item.rssi}" else ""

        // Long press: Locate tag / Take photo
        if (onLocate != null || onPhoto != null) {
            holder.itemView.setOnLongClickListener {
                val ctx = holder.itemView.context
                val options = mutableListOf<String>()
                val actions = mutableListOf<() -> Unit>()

                if (onLocate != null) {
                    options.add(ctx.getString(R.string.action_locate_tag))
                    actions.add { onLocate.invoke(item.epc) }
                }
                if (onPhoto != null) {
                    options.add(ctx.getString(R.string.action_take_photo))
                    actions.add { onPhoto.invoke(item.epc) }
                }

                AlertDialog.Builder(ctx)
                    .setItems(options.toTypedArray()) { _, which -> actions[which]() }
                    .show()
                true
            }
        }
    }

    override fun getItemCount() = items.size
}

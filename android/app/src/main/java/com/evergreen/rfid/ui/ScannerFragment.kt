package com.evergreen.rfid.ui

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
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.TriggerListener
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.databinding.FragmentScannerBinding
import com.evergreen.rfid.databinding.ItemScanResultBinding
import com.evergreen.rfid.model.DecodeResult
import com.evergreen.rfid.model.ScanResult

class ScannerFragment : Fragment(), TriggerListener {
    private var _binding: FragmentScannerBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient
    private val results = mutableListOf<ScanResult>()
    private lateinit var adapter: ScanResultAdapter
    private var isScanning = false
    private var toneGenerator: ToneGenerator? = null
    private var isAutoMode = false // false=Single, true=Auto

    // AppCenter-like stats
    private var totalReads = 0
    private var scanStartTime = 0L

    // Handler for efficient UI updates from scan thread (like AppCenter)
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
                    // Beep on every read (like AppCenter) — short tone blends into continuous sound
                    try { toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 30) } catch (_: Exception) {}
                    handleTagOnUiThread(epc, rssi)
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
        adapter = ScanResultAdapter(results)

        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
        } catch (_: Exception) {}

        binding.rvResults.layoutManager = LinearLayoutManager(requireContext())
        binding.rvResults.adapter = adapter

        // Mode toggle: default Single
        binding.toggleMode.check(R.id.btnModeSingle)
        binding.toggleMode.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                isAutoMode = checkedId == R.id.btnModeAuto
                // Stop scanning when switching modes
                if (isScanning) stopScan()
                updateScanButton()
            }
        }

        binding.btnScan.setOnClickListener {
            if (isAutoMode) {
                toggleAutoScan()
            } else {
                doSingleScan()
            }
        }

        binding.btnClear.setOnClickListener {
            results.clear()
            totalReads = 0
            adapter.notifyDataSetChanged()
            updateCount()
            updateStats()
        }

        binding.btnSummary.setOnClickListener {
            showSummary()
        }

        // Show notice if RFID reader not available
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            binding.tvNotice.visibility = View.VISIBLE
        }

        updateScanButton()
        updateStats()
    }

    // Physical trigger button
    override fun onTriggerPressed() {
        activity?.runOnUiThread {
            if (isAutoMode) {
                toggleAutoScan()
            } else {
                doSingleScan()
            }
        }
    }

    override fun onTriggerReleased() {
        // No action on release for either mode
    }

    private fun doSingleScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), "RFID reader not ready", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnScan.text = "กำลังอ่าน..."
        binding.btnScan.isEnabled = false

        Thread {
            val tag = reader.readSingleTag()
            activity?.runOnUiThread {
                binding.btnScan.isEnabled = true
                updateScanButton()
                if (tag != null) {
                    totalReads++
                    handleTagOnUiThread(tag.first, tag.second)
                    updateStats()
                } else {
                    Toast.makeText(requireContext(), "ไม่พบ tag", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    private fun toggleAutoScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), "RFID reader not ready", Toast.LENGTH_SHORT).show()
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
                // Send to UI thread via Handler (like AppCenter) — faster than runOnUiThread
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
        // Update final elapsed time
        if (scanStartTime > 0) {
            val elapsed = (System.currentTimeMillis() - scanStartTime) / 1000.0
            binding.tvElapsed.text = String.format("%.1fs", elapsed)
        }
        updateScanButton()
    }

    private fun updateScanButton() {
        if (isAutoMode) {
            if (isScanning) {
                binding.btnScan.text = "หยุดสแกน"
                binding.btnScan.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.error))
            } else {
                binding.btnScan.text = "เริ่มสแกน Auto"
                binding.btnScan.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.primary))
            }
        } else {
            binding.btnScan.text = "สแกน Single"
            binding.btnScan.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.primary))
        }
    }

    private fun updateStats() {
        _binding?.tvTagCount?.text = results.size.toString()
        _binding?.tvTotalReads?.text = totalReads.toString()
    }

    /** Called on UI thread — handles both new and duplicate tags */
    private fun handleTagOnUiThread(epc: String, rssi: String) {
        // Check if we already have this tag
        val existingIdx = results.indexOfFirst { it.epc == epc }
        if (existingIdx >= 0) {
            // Increment read count and update RSSI
            val existing = results[existingIdx]
            existing.readCount++
            val updatedRssi = if (rssi.isNotEmpty()) rssi else existing.rssi
            results[existingIdx] = existing.copy(rssi = updatedRssi)
            adapter.notifyItemChanged(existingIdx)
            updateCount()
            return
        }

        // New tag
        val scanResult = ScanResult(epc = epc, rssi = rssi)
        results.add(0, scanResult)
        adapter.notifyItemInserted(0)
        binding.rvResults.scrollToPosition(0)
        updateCount()

        // Decode via API (only for new tags)
        apiClient.decodeRfid(epc) { result ->
            result.fold(
                onSuccess = { decoded ->
                    activity?.runOnUiThread {
                        val idx = results.indexOfFirst { it.epc == epc }
                        if (idx >= 0) {
                            results[idx] = results[idx].copy(decodeResult = decoded)
                            adapter.notifyItemChanged(idx)
                        }
                    }
                },
                onFailure = { err ->
                    activity?.runOnUiThread {
                        val idx = results.indexOfFirst { it.epc == epc }
                        if (idx >= 0) {
                            results[idx] = results[idx].copy(
                                decodeResult = DecodeResult(success = false, message = "Error: ${err.message}")
                            )
                            adapter.notifyItemChanged(idx)
                        }
                    }
                }
            )
        }
    }

    private fun showSummary() {
        if (results.isEmpty()) {
            Toast.makeText(requireContext(), "ยังไม่มีผลสแกน", Toast.LENGTH_SHORT).show()
            return
        }

        // Group by item number
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
        sb.appendLine("สแกนทั้งหมด ${results.size} ชิ้น (อ่าน $totalReads ครั้ง)")
        sb.appendLine("──────────────")

        for ((itemNum, items) in grouped.toSortedMap()) {
            val name = items.firstOrNull()?.decodeResult?.item?.displayName ?: ""
            val inv = items.firstOrNull()?.decodeResult?.item?.inventory?.toInt() ?: 0
            val unit = items.firstOrNull()?.decodeResult?.item?.baseUnitOfMeasure ?: ""
            sb.appendLine()
            sb.appendLine("$itemNum  (${items.size} ชิ้น)")
            if (name.isNotEmpty()) sb.appendLine(name)
            if (inv > 0) {
                val diff = items.size - inv
                val status = when {
                    diff == 0 -> "ตรง"
                    diff > 0 -> "เกิน $diff"
                    else -> "ขาด ${-diff}"
                }
                sb.appendLine("คลัง: $inv $unit → $status")
            }
        }

        if (unknownCount > 0) {
            sb.appendLine()
            sb.appendLine("ไม่ทราบรายการ: $unknownCount ชิ้น")
        }

        AlertDialog.Builder(requireContext())
            .setTitle("สรุปผลสแกน")
            .setMessage(sb.toString())
            .setPositiveButton("OK", null)
            .show()
    }

    private fun updateCount() {
        _binding?.tvCount?.text = "ผลสแกน (${results.size})"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        uiHandler.removeCallbacksAndMessages(null)
        if (isScanning) {
            (activity as? MainActivity)?.rfidReader?.stopScan()
        }
        toneGenerator?.release()
        toneGenerator = null
        _binding = null
    }
}

class ScanResultAdapter(private val items: List<ScanResult>) :
    RecyclerView.Adapter<ScanResultAdapter.ViewHolder>() {

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
                "ชิ้นที่ ${decoded.decoded.pieceNumber}/${decoded.decoded.totalPieces}" else ""
            holder.binding.tvInventory.text = "คงเหลือ: ${decoded.item.inventory.toInt()} ${decoded.item.baseUnitOfMeasure}"
            holder.binding.tvPrice.text = "฿${String.format("%,.2f", decoded.item.unitPrice)}"
            holder.binding.tvHex.text = item.epc
        } else {
            holder.binding.tvItemNumber.text = decoded?.message ?: "กำลังค้นหา..."
            holder.binding.tvItemName.text = ""
            holder.binding.tvPiece.text = ""
            holder.binding.tvInventory.text = ""
            holder.binding.tvPrice.text = ""
            holder.binding.tvHex.text = item.epc
        }

        // Read count badge + RSSI
        holder.binding.tvReadCount.text = "×${item.readCount}"
        holder.binding.tvRssi.text = if (item.rssi.isNotEmpty()) "RSSI: ${item.rssi}" else ""
    }

    override fun getItemCount() = items.size
}

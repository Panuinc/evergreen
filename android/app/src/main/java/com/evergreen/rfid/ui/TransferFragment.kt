package com.evergreen.rfid.ui

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.TriggerListener
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.databinding.FragmentTransferBinding
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.ScanRecordEntity
import com.evergreen.rfid.db.entity.ScanSessionEntity
import com.evergreen.rfid.model.ScanResult
import com.evergreen.rfid.util.AppSettings
import com.evergreen.rfid.util.LocationHelper
import kotlinx.coroutines.runBlocking

class TransferFragment : Fragment(), TriggerListener {
    private var _binding: FragmentTransferBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient
    private lateinit var db: AppDatabase

    private val scannedItems = mutableListOf<ScanResult>()
    private var itemAdapter: TransferItemAdapter? = null
    private var isScanning = false
    private var toneGenerator: ToneGenerator? = null
    private val handler = Handler(Looper.getMainLooper())
    private var gpsLat: Double? = null
    private var gpsLon: Double? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentTransferBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        apiClient = ApiClient(requireContext())
        db = AppDatabase.getInstance(requireContext())

        if (AppSettings.soundEnabled) {
            try { toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100) } catch (_: Exception) {}
        }

        binding.btnBack.setOnClickListener {
            if (isScanning) stopScan()
            (activity as? MainActivity)?.loadFragment(MoreFragment())
        }

        binding.rvItems.layoutManager = LinearLayoutManager(requireContext())
        itemAdapter = TransferItemAdapter(scannedItems)
        binding.rvItems.adapter = itemAdapter

        binding.btnScan.setOnClickListener { toggleScan() }
        binding.btnSubmit.setOnClickListener { submitTransfer() }

        captureGps()
    }

    private fun captureGps() {
        if (ActivityCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) return
        try {
            LocationHelper(requireContext()).getLastLocation { lat, lon ->
                gpsLat = lat
                gpsLon = lon
            }
        } catch (_: Exception) {}
    }

    private fun toggleScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), getString(R.string.scan_rfid_not_ready), Toast.LENGTH_SHORT).show()
            return
        }

        if (isScanning) {
            stopScan()
        } else {
            isScanning = true
            binding.btnScan.text = getString(R.string.scan_stop)
            reader.startScan { epc, rssi ->
                handler.post { handleTag(epc, rssi) }
            }
        }
    }

    private fun stopScan() {
        val reader = (activity as? MainActivity)?.rfidReader
        reader?.stopScan()
        isScanning = false
        binding.btnScan.text = getString(R.string.scan_rfid)
    }

    private fun handleTag(epc: String, rssi: String) {
        if (AppSettings.soundEnabled) {
            try { toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 30) } catch (_: Exception) {}
        }

        val existing = scannedItems.find { it.epc == epc }
        if (existing != null) {
            existing.readCount++
            itemAdapter?.notifyDataSetChanged()
        } else {
            scannedItems.add(0, ScanResult(epc = epc, rssi = rssi))
            itemAdapter?.notifyItemInserted(0)
            binding.rvItems.scrollToPosition(0)

            // Decode
            if (AppSettings.autoDecode) {
                apiClient.decodeRfid(epc) { result ->
                    result.fold(
                        onSuccess = { decoded ->
                            activity?.runOnUiThread {
                                val idx = scannedItems.indexOfFirst { it.epc == epc }
                                if (idx >= 0) {
                                    scannedItems[idx] = scannedItems[idx].copy(decodeResult = decoded)
                                    itemAdapter?.notifyItemChanged(idx)
                                }
                            }
                        },
                        onFailure = {}
                    )
                }
            }
        }

        updateScanCount()
    }

    private fun updateScanCount() {
        binding.tvScanCount.text = String.format(getString(R.string.transfer_scan_count), scannedItems.size)
    }

    private fun submitTransfer() {
        val from = binding.etFromLocation.text.toString().trim()
        val to = binding.etToLocation.text.toString().trim()
        val notes = binding.etNotes.text.toString().trim()

        if (from.isEmpty() || to.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.transfer_fill_locations), Toast.LENGTH_SHORT).show()
            return
        }
        if (scannedItems.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.transfer_no_items), Toast.LENGTH_SHORT).show()
            return
        }

        if (isScanning) stopScan()
        binding.btnSubmit.isEnabled = false

        // Save session locally first
        Thread {
            try {
                val session = ScanSessionEntity(
                    name = "Transfer $from → $to",
                    type = "transfer",
                    startTime = System.currentTimeMillis(),
                    endTime = System.currentTimeMillis(),
                    tagCount = scannedItems.size,
                    totalReads = scannedItems.sumOf { it.readCount },
                    gpsLat = gpsLat,
                    gpsLon = gpsLon,
                    synced = false
                )
                val sessionId = runBlocking { db.scanDao().insertSession(session) }

                val records = scannedItems.map { r ->
                    ScanRecordEntity(
                        sessionId = sessionId,
                        epc = r.epc,
                        rssi = r.rssi,
                        itemNumber = r.decodeResult?.item?.number,
                        itemName = r.decodeResult?.item?.displayName,
                        scannedAt = r.timestamp
                    )
                }
                runBlocking { db.scanDao().insertRecords(records) }

                // Submit to backend
                apiClient.createTransfer(from, to, sessionId.toString(), notes, gpsLat, gpsLon) { result ->
                    activity?.runOnUiThread {
                        binding.btnSubmit.isEnabled = true
                        result.fold(
                            onSuccess = {
                                Toast.makeText(requireContext(), getString(R.string.transfer_submitted), Toast.LENGTH_SHORT).show()
                                // Mark as synced
                                runBlocking {
                                    db.scanDao().updateSession(session.copy(id = sessionId, synced = true))
                                }
                            },
                            onFailure = { e ->
                                Toast.makeText(requireContext(), getString(R.string.transfer_saved_local), Toast.LENGTH_SHORT).show()
                            }
                        )
                    }
                }
            } catch (e: Exception) {
                activity?.runOnUiThread {
                    binding.btnSubmit.isEnabled = true
                    Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    override fun onTriggerPressed() {
        activity?.runOnUiThread { toggleScan() }
    }

    override fun onTriggerReleased() {}

    override fun onDestroyView() {
        super.onDestroyView()
        if (isScanning) stopScan()
        toneGenerator?.release()
        _binding = null
    }
}

private class TransferItemAdapter(
    private val items: List<ScanResult>
) : RecyclerView.Adapter<TransferItemAdapter.VH>() {

    class VH(view: View) : RecyclerView.ViewHolder(view) {
        val card: com.google.android.material.card.MaterialCardView = view as com.google.android.material.card.MaterialCardView
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val dp = parent.context.resources.displayMetrics.density
        val card = com.google.android.material.card.MaterialCardView(parent.context).apply {
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = (4 * dp).toInt() }
            radius = 8f * dp
            cardElevation = 1f * dp
            setContentPadding((12 * dp).toInt(), (8 * dp).toInt(), (12 * dp).toInt(), (8 * dp).toInt())
        }

        val ll = android.widget.LinearLayout(parent.context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
        }
        card.addView(ll)

        val tvItem = android.widget.TextView(parent.context).apply {
            textSize = 13f
            setTypeface(null, android.graphics.Typeface.BOLD)
            tag = "item"
        }
        ll.addView(tvItem)

        val tvEpc = android.widget.TextView(parent.context).apply {
            textSize = 11f
            typeface = android.graphics.Typeface.MONOSPACE
            tag = "epc"
        }
        ll.addView(tvEpc)

        return VH(card)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val r = items[position]
        val ll = (holder.card.getChildAt(0) as android.widget.LinearLayout)
        val tvItem = ll.findViewWithTag<android.widget.TextView>("item")
        val tvEpc = ll.findViewWithTag<android.widget.TextView>("epc")

        val decoded = r.decodeResult
        if (decoded?.item != null) {
            tvItem.text = "${decoded.item.number} — ${decoded.item.displayName}"
        } else {
            tvItem.text = decoded?.message ?: holder.itemView.context.getString(R.string.scan_searching)
        }
        tvEpc.text = "${r.epc} ×${r.readCount}"
    }

    override fun getItemCount() = items.size
}

package com.evergreen.rfid.ui

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.TriggerListener
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.databinding.FragmentOrderMatchBinding
import com.evergreen.rfid.model.DecodeResult
import com.evergreen.rfid.model.ScanResult
import com.evergreen.rfid.util.AppSettings
import com.google.android.material.card.MaterialCardView

class OrderMatchFragment : Fragment(), TriggerListener {
    private var _binding: FragmentOrderMatchBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient

    private var orderNumber: String? = null
    private var orderType: String? = null
    private var expectedItems: List<ExpectedItem> = emptyList()
    private val scannedResults = mutableListOf<ScanResult>()
    private var matchAdapter: MatchAdapter? = null
    private var isScanning = false
    private var toneGenerator: ToneGenerator? = null
    private val handler = Handler(Looper.getMainLooper())

    data class ExpectedItem(
        val itemNumber: String,
        val itemName: String,
        val expectedQty: Int,
        var scannedQty: Int = 0
    )

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentOrderMatchBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        apiClient = ApiClient(requireContext())

        if (AppSettings.soundEnabled) {
            try { toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100) } catch (_: Exception) {}
        }

        binding.btnBack.setOnClickListener {
            if (isScanning) stopScan()
            (activity as? MainActivity)?.loadFragment(MoreFragment())
        }

        binding.rvMatchItems.layoutManager = LinearLayoutManager(requireContext())

        binding.etOrderNumber.setOnEditorActionListener { _, _, _ ->
            searchOrder(binding.etOrderNumber.text.toString().trim())
            true
        }

        binding.btnScan.setOnClickListener { toggleScan() }
        binding.btnSubmit.setOnClickListener { submitMatch() }
    }

    private fun searchOrder(query: String) {
        if (query.isEmpty()) return

        apiClient.fetchOrders(null) { result ->
            result.fold(
                onSuccess = { orders ->
                    activity?.runOnUiThread {
                        val order = orders.find {
                            val num = it["number"]?.toString() ?: it["no"]?.toString() ?: ""
                            num.contains(query, ignoreCase = true)
                        }
                        if (order != null) {
                            orderNumber = order["number"]?.toString() ?: order["no"]?.toString()
                            orderType = order["documentType"]?.toString() ?: "SO"
                            showOrder(order)
                        } else {
                            binding.cardOrder.visibility = View.GONE
                            binding.tvMatchStatus.text = getString(R.string.order_not_found)
                        }
                    }
                },
                onFailure = { e ->
                    activity?.runOnUiThread {
                        binding.tvMatchStatus.text = "Error: ${e.message}"
                    }
                }
            )
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun showOrder(order: Map<String, Any?>) {
        binding.cardOrder.visibility = View.VISIBLE
        binding.tvOrderNumber.text = orderNumber ?: ""
        val customer = order["sellToCustomerName"]?.toString() ?: order["buyFromVendorName"]?.toString() ?: ""
        val date = order["orderDate"]?.toString() ?: ""
        binding.tvOrderInfo.text = "$customer • $date"

        // Parse order lines to get expected items
        val lines = order["lines"] as? List<Map<String, Any?>> ?: emptyList()
        expectedItems = lines.mapNotNull { line ->
            val itemNum = line["number"]?.toString() ?: line["no"]?.toString() ?: return@mapNotNull null
            val itemName = line["description"]?.toString() ?: ""
            val qty = (line["quantity"] as? Number)?.toInt() ?: 1
            ExpectedItem(itemNumber = itemNum, itemName = itemName, expectedQty = qty)
        }

        matchAdapter = MatchAdapter(expectedItems)
        binding.rvMatchItems.adapter = matchAdapter
        updateMatchStatus()
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

        val existing = scannedResults.find { it.epc == epc }
        if (existing != null) {
            existing.readCount++
            return
        }

        val scanResult = ScanResult(epc = epc, rssi = rssi)
        scannedResults.add(scanResult)

        // Decode and match
        if (AppSettings.autoDecode) {
            apiClient.decodeRfid(epc) { result ->
                result.fold(
                    onSuccess = { decoded ->
                        activity?.runOnUiThread {
                            matchDecodedItem(decoded)
                            updateMatchStatus()
                        }
                    },
                    onFailure = {}
                )
            }
        }
    }

    private fun matchDecodedItem(decoded: DecodeResult) {
        val itemNum = decoded.item?.number ?: return
        val match = expectedItems.find { it.itemNumber == itemNum }
        if (match != null) {
            match.scannedQty++
            matchAdapter?.notifyDataSetChanged()
        }
    }

    private fun updateMatchStatus() {
        val total = expectedItems.sumOf { it.expectedQty }
        val scanned = expectedItems.sumOf { it.scannedQty }
        val matched = expectedItems.count { it.scannedQty >= it.expectedQty }
        binding.tvMatchStatus.text = String.format(
            getString(R.string.order_match_status), scanned, total, matched, expectedItems.size
        )
    }

    private fun submitMatch() {
        if (orderNumber == null) {
            Toast.makeText(requireContext(), getString(R.string.order_search_first), Toast.LENGTH_SHORT).show()
            return
        }

        val expectedJson = expectedItems.map {
            mapOf("item_number" to it.itemNumber, "item_name" to it.itemName, "expected_qty" to it.expectedQty)
        }
        val scannedJson = expectedItems.map {
            mapOf("item_number" to it.itemNumber, "scanned_qty" to it.scannedQty)
        }

        apiClient.submitMatch(orderNumber!!, orderType ?: "SO", expectedJson, scannedJson) { result ->
            result.fold(
                onSuccess = {
                    activity?.runOnUiThread {
                        Toast.makeText(requireContext(), getString(R.string.order_match_submitted), Toast.LENGTH_SHORT).show()
                    }
                },
                onFailure = { e ->
                    activity?.runOnUiThread {
                        Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            )
        }
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

private class MatchAdapter(
    private val items: List<OrderMatchFragment.ExpectedItem>
) : RecyclerView.Adapter<MatchAdapter.VH>() {

    class VH(view: View) : RecyclerView.ViewHolder(view) {
        val card: MaterialCardView = view as MaterialCardView
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val dp = parent.context.resources.displayMetrics.density
        val card = MaterialCardView(parent.context).apply {
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
            textSize = 14f
            setTypeface(null, android.graphics.Typeface.BOLD)
            tag = "item"
        }
        ll.addView(tvItem)

        val tvStatus = android.widget.TextView(parent.context).apply {
            textSize = 12f
            tag = "status"
        }
        ll.addView(tvStatus)

        return VH(card)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        val ll = (holder.card.getChildAt(0) as android.widget.LinearLayout)
        val tvItem = ll.findViewWithTag<android.widget.TextView>("item")
        val tvStatus = ll.findViewWithTag<android.widget.TextView>("status")

        tvItem.text = "${item.itemNumber} — ${item.itemName}"

        val ctx = holder.itemView.context
        when {
            item.scannedQty >= item.expectedQty -> {
                tvStatus.text = "${item.scannedQty}/${item.expectedQty} ✓"
                tvStatus.setTextColor(ctx.getColor(R.color.success))
            }
            item.scannedQty > 0 -> {
                tvStatus.text = "${item.scannedQty}/${item.expectedQty}"
                tvStatus.setTextColor(ctx.getColor(R.color.warning_text))
            }
            else -> {
                tvStatus.text = "0/${item.expectedQty}"
                tvStatus.setTextColor(ctx.getColor(R.color.text_secondary))
            }
        }
    }

    override fun getItemCount() = items.size
}

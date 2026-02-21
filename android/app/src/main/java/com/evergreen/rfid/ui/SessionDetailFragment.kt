package com.evergreen.rfid.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.runBlocking
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.databinding.FragmentSessionDetailBinding
import com.evergreen.rfid.databinding.ItemScanResultBinding
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.ScanRecordEntity
import com.evergreen.rfid.db.entity.ScanSessionEntity
import com.evergreen.rfid.model.ScanResult
import com.evergreen.rfid.util.ExportHelper
import java.text.SimpleDateFormat
import java.util.*

class SessionDetailFragment : Fragment() {
    companion object {
        private const val ARG_SESSION_ID = "session_id"
        fun newInstance(sessionId: Long): SessionDetailFragment {
            return SessionDetailFragment().apply {
                arguments = Bundle().apply { putLong(ARG_SESSION_ID, sessionId) }
            }
        }
    }

    private var _binding: FragmentSessionDetailBinding? = null
    private val binding get() = _binding!!
    private lateinit var db: AppDatabase
    private var sessionId: Long = 0
    private var session: ScanSessionEntity? = null
    private val records = mutableListOf<ScanRecordEntity>()
    private lateinit var adapter: RecordAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentSessionDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        db = AppDatabase.getInstance(requireContext())
        sessionId = arguments?.getLong(ARG_SESSION_ID) ?: 0

        adapter = RecordAdapter(records)
        binding.rvRecords.layoutManager = LinearLayoutManager(requireContext())
        binding.rvRecords.adapter = adapter

        binding.btnBack.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(HistoryFragment())
        }

        binding.btnExport.setOnClickListener { exportSession() }

        binding.btnDelete.setOnClickListener { confirmDelete() }

        loadSession()
    }

    private fun loadSession() {
        Thread {
            session = runBlocking { db.scanDao().getSession(sessionId) }
            val recordList = runBlocking { db.scanDao().getRecordsBySession(sessionId) }
            activity?.runOnUiThread {
                val s = session ?: return@runOnUiThread
                binding.tvSessionTitle.text = s.name.ifEmpty {
                    "${getString(R.string.history_session)} #${s.id}"
                }
                binding.tvTags.text = s.tagCount.toString()
                binding.tvReads.text = s.totalReads.toString()

                val duration = if (s.endTime != null) {
                    val secs = (s.endTime - s.startTime) / 1000
                    "${secs}s"
                } else "-"
                binding.tvDuration.text = duration

                records.clear()
                records.addAll(recordList)
                adapter.notifyDataSetChanged()
                binding.tvRecordCount.text = String.format(getString(R.string.scan_results), records.size)
            }
        }.start()
    }

    private fun exportSession() {
        val scanResults = records.map { r ->
            ScanResult(
                epc = r.epc,
                rssi = r.rssi,
                readCount = r.readCount,
                timestamp = r.scannedAt
            )
        }
        if (scanResults.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.scan_no_results), Toast.LENGTH_SHORT).show()
            return
        }

        val options = arrayOf(getString(R.string.export_csv), getString(R.string.export_text))
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.scan_export))
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        val csv = ExportHelper.exportAsCsv(scanResults)
                        ExportHelper.share(requireContext(), csv, "text/csv", "Session_${sessionId}.csv")
                    }
                    1 -> {
                        val text = ExportHelper.exportAsText(scanResults)
                        ExportHelper.share(requireContext(), text, "text/plain", "Session_${sessionId}")
                    }
                }
            }
            .show()
    }

    private fun confirmDelete() {
        AlertDialog.Builder(requireContext())
            .setTitle(getString(R.string.session_delete))
            .setMessage(getString(R.string.session_delete_confirm))
            .setPositiveButton(getString(R.string.ok)) { _, _ ->
                Thread {
                    runBlocking { db.scanDao().deleteSession(sessionId) }
                    activity?.runOnUiThread {
                        (activity as? MainActivity)?.loadFragment(HistoryFragment())
                    }
                }.start()
            }
            .setNegativeButton(getString(R.string.cancel), null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class RecordAdapter(private val items: List<ScanRecordEntity>) :
    RecyclerView.Adapter<RecordAdapter.ViewHolder>() {

    class ViewHolder(val binding: ItemScanResultBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemScanResultBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val record = items[position]

        holder.binding.tvItemNumber.text = record.itemNumber ?: record.epc
        holder.binding.tvItemName.text = record.itemName ?: ""
        holder.binding.tvPiece.text = ""
        holder.binding.tvInventory.text = ""
        holder.binding.tvPrice.text = ""
        holder.binding.tvHex.text = record.epc
        holder.binding.tvReadCount.text = "×${record.readCount}"
        holder.binding.tvRssi.text = if (record.rssi.isNotEmpty()) "RSSI: ${record.rssi}" else ""
    }

    override fun getItemCount() = items.size
}

package com.evergreen.rfid.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.runBlocking
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.FragmentHistoryBinding
import com.evergreen.rfid.databinding.ItemSessionBinding
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.ScanSessionEntity
import com.evergreen.rfid.sync.SyncManager
import java.text.SimpleDateFormat
import java.util.*

class HistoryFragment : Fragment() {
    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!
    private lateinit var db: AppDatabase
    private lateinit var syncManager: SyncManager
    private val sessions = mutableListOf<ScanSessionEntity>()
    private lateinit var adapter: SessionAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        db = AppDatabase.getInstance(requireContext())
        syncManager = SyncManager(requireContext())

        adapter = SessionAdapter(sessions) { session ->
            // Open session detail
            val detail = SessionDetailFragment.newInstance(session.id)
            (activity as? MainActivity)?.loadFragment(detail)
        }

        binding.rvSessions.layoutManager = LinearLayoutManager(requireContext())
        binding.rvSessions.adapter = adapter

        // Sync bar
        binding.syncBar.visibility = View.VISIBLE
        updateSyncStatus()

        binding.btnSyncItems.setOnClickListener { syncItems() }

        loadSessions()
    }

    override fun onResume() {
        super.onResume()
        loadSessions()
    }

    private fun loadSessions() {
        Thread {
            val list = runBlocking { db.scanDao().getAllSessions() }
            activity?.runOnUiThread {
                sessions.clear()
                sessions.addAll(list)
                adapter.notifyDataSetChanged()
                binding.tvSessionCount.text = String.format(getString(R.string.history_count), sessions.size)
                binding.tvEmpty.visibility = if (sessions.isEmpty()) View.VISIBLE else View.GONE
                binding.rvSessions.visibility = if (sessions.isEmpty()) View.GONE else View.VISIBLE
            }
        }.start()
    }

    private fun updateSyncStatus() {
        Thread {
            val count = runBlocking { db.itemDao().getCount() }
            val lastSync = syncManager.lastSyncTime
            activity?.runOnUiThread {
                val syncText = if (count > 0) {
                    val date = if (lastSync > 0) {
                        SimpleDateFormat("dd/MM HH:mm", Locale.getDefault()).format(Date(lastSync))
                    } else "-"
                    String.format(getString(R.string.history_cached_items), count, date)
                } else {
                    getString(R.string.history_no_cache)
                }
                binding.tvSyncStatus.text = syncText
            }
        }.start()
    }

    private fun syncItems() {
        val auth = SupabaseAuth(requireContext())
        val token = auth.accessToken
        if (token.isNullOrEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.history_login_required), Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnSyncItems.isEnabled = false
        binding.btnSyncItems.text = getString(R.string.history_syncing)

        syncManager.syncItems(token) { result ->
            activity?.runOnUiThread {
                binding.btnSyncItems.isEnabled = true
                binding.btnSyncItems.text = getString(R.string.history_sync)
                result.fold(
                    onSuccess = { count ->
                        Toast.makeText(requireContext(), String.format(getString(R.string.history_sync_done), count), Toast.LENGTH_SHORT).show()
                        updateSyncStatus()
                    },
                    onFailure = { err ->
                        Toast.makeText(requireContext(), "Sync failed: ${err.message}", Toast.LENGTH_SHORT).show()
                    }
                )
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

class SessionAdapter(
    private val items: List<ScanSessionEntity>,
    private val onClick: (ScanSessionEntity) -> Unit
) : RecyclerView.Adapter<SessionAdapter.ViewHolder>() {

    private val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())

    class ViewHolder(val binding: ItemSessionBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemSessionBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val session = items[position]
        val ctx = holder.itemView.context

        holder.binding.tvSessionName.text = session.name.ifEmpty {
            "${ctx.getString(R.string.history_session)} #${session.id}"
        }
        holder.binding.tvSessionType.text = session.type.uppercase()
        holder.binding.tvSessionDate.text = dateFormat.format(Date(session.startTime))
        holder.binding.tvTagCount.text = "${session.tagCount} tags • ${session.totalReads} reads"

        if (session.synced) {
            holder.binding.tvSyncStatus.text = ctx.getString(R.string.history_synced)
            holder.binding.tvSyncStatus.setTextColor(ctx.getColor(R.color.primary))
        } else {
            holder.binding.tvSyncStatus.text = ctx.getString(R.string.history_local)
            holder.binding.tvSyncStatus.setTextColor(ctx.getColor(R.color.text_secondary))
        }

        if (session.gpsLat != null && session.gpsLon != null) {
            holder.binding.tvGps.visibility = View.VISIBLE
            holder.binding.tvGps.text = "GPS: %.4f, %.4f".format(session.gpsLat, session.gpsLon)
        } else {
            holder.binding.tvGps.visibility = View.GONE
        }

        holder.itemView.setOnClickListener { onClick(session) }
    }

    override fun getItemCount() = items.size
}

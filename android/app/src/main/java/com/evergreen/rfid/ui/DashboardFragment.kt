package com.evergreen.rfid.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.databinding.FragmentDashboardBinding
import com.evergreen.rfid.db.AppDatabase
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.runBlocking
import java.text.SimpleDateFormat
import java.util.*

class DashboardFragment : Fragment() {
    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient
    private lateinit var db: AppDatabase

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        apiClient = ApiClient(requireContext())
        db = AppDatabase.getInstance(requireContext())

        binding.btnBack.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(MoreFragment())
        }

        binding.rvRecent.layoutManager = LinearLayoutManager(requireContext())

        // Load local stats first
        loadLocalStats()

        // Try to load from API
        apiClient.fetchDashboard { result ->
            result.fold(
                onSuccess = { data ->
                    activity?.runOnUiThread {
                        binding.tvTotalSessions.text = (data["total_sessions"] as? Number)?.toInt()?.toString() ?: "0"
                        binding.tvTotalTags.text = (data["total_tags"] as? Number)?.toInt()?.toString() ?: "0"
                        binding.tvTotalTransfers.text = (data["total_transfers"] as? Number)?.toInt()?.toString() ?: "0"
                        binding.tvPendingTransfers.text = (data["pending_transfers"] as? Number)?.toInt()?.toString() ?: "0"
                    }
                },
                onFailure = { /* Keep local stats */ }
            )
        }
    }

    private fun loadLocalStats() {
        Thread {
            try {
                val sessions = runBlocking { db.scanDao().getAllSessions() }
                val totalSessions = sessions.size
                val totalTags = sessions.sumOf { it.tagCount }
                val unsyncedCount = sessions.count { !it.synced }

                activity?.runOnUiThread {
                    binding.tvTotalSessions.text = totalSessions.toString()
                    binding.tvTotalTags.text = totalTags.toString()

                    if (sessions.isEmpty()) {
                        binding.tvEmpty.visibility = View.VISIBLE
                        binding.rvRecent.visibility = View.GONE
                    } else {
                        binding.tvEmpty.visibility = View.GONE
                        binding.rvRecent.visibility = View.VISIBLE
                        binding.rvRecent.adapter = RecentSessionAdapter(sessions.take(5))
                    }
                }
            } catch (_: Exception) {}
        }.start()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private class RecentSessionAdapter(
    private val sessions: List<com.evergreen.rfid.db.entity.ScanSessionEntity>
) : RecyclerView.Adapter<RecentSessionAdapter.VH>() {

    class VH(view: View) : RecyclerView.ViewHolder(view) {
        val card: MaterialCardView = view as MaterialCardView
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val card = MaterialCardView(parent.context).apply {
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = 8 }
            radius = 12f * resources.displayMetrics.density
            cardElevation = 2f * resources.displayMetrics.density
            setContentPadding(
                (12 * resources.displayMetrics.density).toInt(),
                (12 * resources.displayMetrics.density).toInt(),
                (12 * resources.displayMetrics.density).toInt(),
                (12 * resources.displayMetrics.density).toInt()
            )
        }

        val ll = android.widget.LinearLayout(parent.context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
        }
        card.addView(ll)

        val tvName = android.widget.TextView(parent.context).apply {
            textSize = 14f
            setTypeface(null, android.graphics.Typeface.BOLD)
            tag = "name"
        }
        ll.addView(tvName)

        val tvInfo = android.widget.TextView(parent.context).apply {
            textSize = 12f
            tag = "info"
        }
        ll.addView(tvInfo)

        return VH(card)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val s = sessions[position]
        val ll = (holder.card.getChildAt(0) as android.widget.LinearLayout)
        val tvName = ll.findViewWithTag<android.widget.TextView>("name")
        val tvInfo = ll.findViewWithTag<android.widget.TextView>("info")

        tvName.text = s.name
        val date = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date(s.startTime))
        tvInfo.text = "${s.tagCount} tags • ${s.type} • $date"
    }

    override fun getItemCount() = sessions.size
}

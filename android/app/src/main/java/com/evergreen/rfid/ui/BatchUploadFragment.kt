package com.evergreen.rfid.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.databinding.FragmentBatchUploadBinding
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.db.entity.ScanSessionEntity
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.runBlocking
import java.text.SimpleDateFormat
import java.util.*

class BatchUploadFragment : Fragment() {
    private var _binding: FragmentBatchUploadBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient
    private lateinit var db: AppDatabase
    private val sessions = mutableListOf<ScanSessionEntity>()
    private var adapter: UploadSessionAdapter? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentBatchUploadBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        apiClient = ApiClient(requireContext())
        db = AppDatabase.getInstance(requireContext())

        binding.btnBack.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(MoreFragment())
        }

        binding.rvSessions.layoutManager = LinearLayoutManager(requireContext())
        adapter = UploadSessionAdapter(sessions) { session -> uploadSession(session) }
        binding.rvSessions.adapter = adapter

        binding.btnUploadAll.setOnClickListener { uploadAll() }

        loadUnsyncedSessions()
    }

    private fun loadUnsyncedSessions() {
        Thread {
            try {
                val unsynced = runBlocking { db.scanDao().getUnsyncedSessions() }
                activity?.runOnUiThread {
                    sessions.clear()
                    sessions.addAll(unsynced)
                    adapter?.notifyDataSetChanged()
                    binding.tvUploadCount.text = String.format(getString(R.string.upload_count), unsynced.size)
                    binding.tvEmpty.visibility = if (unsynced.isEmpty()) View.VISIBLE else View.GONE
                    binding.btnUploadAll.isEnabled = unsynced.isNotEmpty()
                }
            } catch (_: Exception) {}
        }.start()
    }

    private fun uploadSession(session: ScanSessionEntity) {
        Thread {
            try {
                val records = runBlocking { db.scanDao().getRecordsBySession(session.id) }

                apiClient.uploadSession(session, records) { result ->
                    result.fold(
                        onSuccess = {
                            runBlocking {
                                db.scanDao().updateSession(session.copy(synced = true))
                            }
                            activity?.runOnUiThread {
                                Toast.makeText(requireContext(),
                                    String.format(getString(R.string.upload_success), session.name),
                                    Toast.LENGTH_SHORT).show()
                                loadUnsyncedSessions()
                            }
                        },
                        onFailure = { e ->
                            activity?.runOnUiThread {
                                Toast.makeText(requireContext(), "Upload failed: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }
            } catch (e: Exception) {
                activity?.runOnUiThread {
                    Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    private fun uploadAll() {
        binding.btnUploadAll.isEnabled = false
        binding.tvUploadCount.text = getString(R.string.upload_uploading)

        Thread {
            var successCount = 0
            for (session in sessions.toList()) {
                try {
                    val records = runBlocking { db.scanDao().getRecordsBySession(session.id) }
                    var uploadResult: Result<Map<String, Any?>>? = null

                    apiClient.uploadSession(session, records) { result ->
                        uploadResult = result
                    }

                    // Wait briefly for callback
                    Thread.sleep(3000)

                    if (uploadResult?.isSuccess == true) {
                        runBlocking { db.scanDao().updateSession(session.copy(synced = true)) }
                        successCount++
                    }
                } catch (_: Exception) {}
            }

            val count = successCount
            activity?.runOnUiThread {
                Toast.makeText(requireContext(),
                    String.format(getString(R.string.upload_all_done), count, sessions.size),
                    Toast.LENGTH_SHORT).show()
                loadUnsyncedSessions()
            }
        }.start()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

private class UploadSessionAdapter(
    private val sessions: List<ScanSessionEntity>,
    private val onUpload: (ScanSessionEntity) -> Unit
) : RecyclerView.Adapter<UploadSessionAdapter.VH>() {

    class VH(view: View) : RecyclerView.ViewHolder(view) {
        val card: MaterialCardView = view as MaterialCardView
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val dp = parent.context.resources.displayMetrics.density
        val card = MaterialCardView(parent.context).apply {
            layoutParams = ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = (8 * dp).toInt() }
            radius = 12f * dp
            cardElevation = 2f * dp
            setContentPadding((12 * dp).toInt(), (12 * dp).toInt(), (12 * dp).toInt(), (12 * dp).toInt())
            isClickable = true
            isFocusable = true
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

        holder.card.setOnClickListener { onUpload(s) }
    }

    override fun getItemCount() = sessions.size
}

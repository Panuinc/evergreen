package com.evergreen.rfid.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.api.ApiClient
import com.evergreen.rfid.databinding.FragmentWriteTagBinding
import com.evergreen.rfid.db.AppDatabase
import com.evergreen.rfid.util.EpcGenerator
import kotlinx.coroutines.runBlocking

class WriteTagFragment : Fragment() {
    private var _binding: FragmentWriteTagBinding? = null
    private val binding get() = _binding!!
    private lateinit var apiClient: ApiClient
    private lateinit var db: AppDatabase

    private var selectedItemNumber: String? = null
    private var selectedRfidCode: Int? = null
    private var selectedItemName: String? = null
    private var generatedEpcs: List<EpcGenerator.EpcEntry> = emptyList()
    private var currentWriteIndex = 0

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentWriteTagBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        apiClient = ApiClient(requireContext())
        db = AppDatabase.getInstance(requireContext())

        binding.btnBack.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(MoreFragment())
        }

        binding.etItemSearch.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                searchItem(binding.etItemSearch.text.toString().trim())
                true
            } else false
        }

        binding.etQuantity.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) updateEpcPreview()
        }

        binding.btnWrite.setOnClickListener { startWrite() }
    }

    private fun searchItem(query: String) {
        if (query.isEmpty()) return

        binding.tvWriteStatus.visibility = View.VISIBLE
        binding.tvWriteStatus.text = getString(R.string.scan_searching)

        // Try local DB first, then API
        Thread {
            try {
                val cached = runBlocking { db.itemDao().getByNumber(query) }
                    ?: runBlocking { db.itemDao().searchByNumber("%$query%") }

                activity?.runOnUiThread {
                    if (cached != null) {
                        selectedItemNumber = cached.number
                        selectedRfidCode = if ((cached.rfidCode ?: 0) > 0) cached.rfidCode else null
                        selectedItemName = cached.displayName
                        showItemInfo(cached.number, cached.displayName, "Stock: ${cached.inventory.toInt()} ${cached.baseUnitOfMeasure}")
                        updateEpcPreview()
                    } else {
                        binding.tvWriteStatus.text = getString(R.string.write_not_found)
                        binding.cardItem.visibility = View.GONE
                        binding.btnWrite.isEnabled = false
                    }
                }
            } catch (e: Exception) {
                activity?.runOnUiThread {
                    binding.tvWriteStatus.text = "Error: ${e.message}"
                }
            }
        }.start()
    }

    private fun showItemInfo(number: String, name: String, info: String) {
        binding.cardItem.visibility = View.VISIBLE
        binding.tvItemNumber.text = number
        binding.tvItemName.text = name
        binding.tvItemInfo.text = info
        binding.tvWriteStatus.visibility = View.GONE
        binding.btnWrite.isEnabled = true
    }

    private fun updateEpcPreview() {
        val qty = binding.etQuantity.text.toString().toIntOrNull() ?: 1
        val codeOrNumber: Any = selectedRfidCode ?: selectedItemNumber ?: return

        generatedEpcs = EpcGenerator.generateBatch(codeOrNumber, qty)
        currentWriteIndex = 0

        if (generatedEpcs.isNotEmpty()) {
            binding.tvEpcPreview.visibility = View.VISIBLE
            val preview = generatedEpcs.joinToString("\n") { "${it.sequenceText}: ${it.epc}" }
            binding.tvEpcPreview.text = preview
        }
    }

    private fun startWrite() {
        if (generatedEpcs.isEmpty()) {
            updateEpcPreview()
        }
        if (generatedEpcs.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.write_no_item), Toast.LENGTH_SHORT).show()
            return
        }

        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), getString(R.string.scan_rfid_not_ready), Toast.LENGTH_SHORT).show()
            return
        }

        if (currentWriteIndex >= generatedEpcs.size) {
            binding.tvWriteStatus.visibility = View.VISIBLE
            binding.tvWriteStatus.text = getString(R.string.write_all_done)
            binding.tvWriteStatus.setTextColor(requireContext().getColor(R.color.success))
            return
        }

        val entry = generatedEpcs[currentWriteIndex]
        binding.btnWrite.isEnabled = false
        binding.tvWriteStatus.visibility = View.VISIBLE
        binding.tvWriteStatus.text = String.format(getString(R.string.write_writing), entry.sequenceText)
        binding.tvWriteStatus.setTextColor(requireContext().getColor(R.color.text_secondary))

        Thread {
            val success = reader.writeEpc(entry.epc)
            activity?.runOnUiThread {
                if (success) {
                    currentWriteIndex++
                    if (currentWriteIndex >= generatedEpcs.size) {
                        binding.tvWriteStatus.text = getString(R.string.write_all_done)
                        binding.tvWriteStatus.setTextColor(requireContext().getColor(R.color.success))
                    } else {
                        val next = generatedEpcs[currentWriteIndex]
                        binding.tvWriteStatus.text = String.format(getString(R.string.write_success_next), entry.sequenceText, next.sequenceText)
                        binding.tvWriteStatus.setTextColor(requireContext().getColor(R.color.success))
                    }
                } else {
                    binding.tvWriteStatus.text = String.format(getString(R.string.write_failed), entry.sequenceText)
                    binding.tvWriteStatus.setTextColor(requireContext().getColor(R.color.error))
                }
                binding.btnWrite.isEnabled = true
            }
        }.start()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

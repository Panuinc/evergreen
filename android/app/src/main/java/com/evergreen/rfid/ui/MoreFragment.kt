package com.evergreen.rfid.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.evergreen.rfid.BuildConfig
import com.evergreen.rfid.LoginActivity
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.FragmentMoreBinding

class MoreFragment : Fragment() {
    private var _binding: FragmentMoreBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentMoreBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val auth = SupabaseAuth(requireContext())
        binding.tvUserEmail.text = auth.email ?: "—"
        binding.tvAppVersion.text = "Evergreen RFID v${BuildConfig.VERSION_NAME}"

        // Warehouse tools
        binding.menuDashboard.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(DashboardFragment())
        }

        binding.menuWriteTag.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(WriteTagFragment())
        }

        binding.menuTransfer.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(TransferFragment())
        }

        binding.menuOrderMatch.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(OrderMatchFragment())
        }

        binding.menuBatchUpload.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(BatchUploadFragment())
        }

        // App settings
        binding.menuSettings.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(SettingsFragment())
        }

        binding.menuDeviceInfo.setOnClickListener {
            (activity as? MainActivity)?.loadFragment(DeviceInfoFragment())
        }

        binding.menuLogout.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle(R.string.confirm_logout_title)
                .setMessage(R.string.confirm_logout_message)
                .setPositiveButton(R.string.logout) { _, _ ->
                    auth.logout()
                    (activity as? MainActivity)?.rfidReader?.release()
                    startActivity(Intent(requireContext(), LoginActivity::class.java))
                    activity?.finish()
                }
                .setNegativeButton(R.string.cancel, null)
                .show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

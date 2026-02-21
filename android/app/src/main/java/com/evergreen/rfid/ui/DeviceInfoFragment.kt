package com.evergreen.rfid.ui

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.evergreen.rfid.BuildConfig
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.FragmentDeviceInfoBinding
import com.evergreen.rfid.util.AppSettings

class DeviceInfoFragment : Fragment() {
    private var _binding: FragmentDeviceInfoBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDeviceInfoBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val reader = (activity as? MainActivity)?.rfidReader
        val auth = SupabaseAuth(requireContext())

        // Device section
        setInfoRow(binding.rowModel.root, getString(R.string.device_model), Build.MODEL)
        setInfoRow(binding.rowAndroid.root, getString(R.string.device_android), "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
        setInfoRow(binding.rowBattery.root, getString(R.string.device_battery), getBatteryLevel())

        // RFID section
        val rfidStatus = if (reader?.isInitialized == true) getString(R.string.device_rfid_ready) else getString(R.string.device_rfid_error)
        setInfoRow(binding.rowRfidStatus.root, getString(R.string.device_rfid_status), rfidStatus)
        setInfoRow(binding.rowRfidFirmware.root, getString(R.string.device_rfid_firmware), reader?.getVersion() ?: "—")
        setInfoRow(binding.rowRfidHardware.root, getString(R.string.device_rfid_hardware), reader?.getHardwareVersion() ?: "—")
        setInfoRow(binding.rowRfidTemp.root, getString(R.string.device_rfid_temp), reader?.getTemperature() ?: "—")
        setInfoRow(binding.rowRfidPower.root, getString(R.string.device_rfid_power), "${AppSettings.rfidPower} dBm")

        // App section
        setInfoRow(binding.rowAppVersion.root, getString(R.string.device_app_version), "v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})")
        setInfoRow(binding.rowServerUrl.root, getString(R.string.device_server_url), AppSettings.baseUrl)
        setInfoRow(binding.rowUser.root, getString(R.string.device_user), auth.email ?: "—")
    }

    private fun setInfoRow(view: View, label: String, value: String) {
        view.findViewById<TextView>(R.id.tvLabel).text = label
        view.findViewById<TextView>(R.id.tvValue).text = value
    }

    private fun getBatteryLevel(): String {
        val batteryIntent = requireContext().registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val pct = if (level >= 0 && scale > 0) (level * 100 / scale) else -1
        val charging = status == BatteryManager.BATTERY_STATUS_CHARGING
        return if (pct >= 0) "${pct}%${if (charging) " ⚡" else ""}" else "—"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

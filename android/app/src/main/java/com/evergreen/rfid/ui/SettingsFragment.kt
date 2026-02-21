package com.evergreen.rfid.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import androidx.fragment.app.Fragment
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.databinding.FragmentSettingsBinding
import com.evergreen.rfid.util.AppSettings
import okhttp3.*
import java.io.IOException

class SettingsFragment : Fragment() {
    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Load current values
        binding.etServerUrl.setText(AppSettings.baseUrl)
        binding.sliderPower.value = AppSettings.rfidPower.toFloat()
        binding.tvPowerValue.text = "${AppSettings.rfidPower} dBm"
        binding.switchAutoDecode.isChecked = AppSettings.autoDecode
        binding.switchSound.isChecked = AppSettings.soundEnabled

        // Language toggle
        if (AppSettings.language == "en") {
            binding.toggleLanguage.check(R.id.btnLangEn)
        } else {
            binding.toggleLanguage.check(R.id.btnLangTh)
        }

        // Server URL — save on focus lost
        binding.etServerUrl.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                val url = binding.etServerUrl.text.toString().trim()
                if (url.isNotEmpty()) {
                    AppSettings.baseUrl = url
                }
            }
        }

        // Test connection
        binding.btnTestConnection.setOnClickListener {
            val url = binding.etServerUrl.text.toString().trim()
            if (url.isEmpty()) {
                Toast.makeText(requireContext(), getString(R.string.settings_url_empty), Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            AppSettings.baseUrl = url
            binding.btnTestConnection.isEnabled = false
            binding.btnTestConnection.text = getString(R.string.settings_testing)

            val client = OkHttpClient()
            val request = Request.Builder().url("$url/api/warehouse/inventory").head().build()
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    activity?.runOnUiThread {
                        binding.btnTestConnection.isEnabled = true
                        binding.btnTestConnection.text = getString(R.string.settings_test_connection)
                        Toast.makeText(requireContext(), "Connection failed: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
                override fun onResponse(call: Call, response: Response) {
                    activity?.runOnUiThread {
                        binding.btnTestConnection.isEnabled = true
                        binding.btnTestConnection.text = getString(R.string.settings_test_connection)
                        if (response.isSuccessful || response.code == 401) {
                            Toast.makeText(requireContext(), getString(R.string.settings_connection_ok), Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(requireContext(), "Server responded: ${response.code}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            })
        }

        // Power slider
        binding.sliderPower.addOnChangeListener { _, value, fromUser ->
            if (fromUser) {
                val power = value.toInt()
                binding.tvPowerValue.text = "$power dBm"
                AppSettings.rfidPower = power
                val reader = (activity as? MainActivity)?.rfidReader
                reader?.setPower(power)
            }
        }

        // Auto decode toggle
        binding.switchAutoDecode.setOnCheckedChangeListener { _, isChecked ->
            AppSettings.autoDecode = isChecked
        }

        // Sound toggle
        binding.switchSound.setOnCheckedChangeListener { _, isChecked ->
            AppSettings.soundEnabled = isChecked
        }

        // Language toggle
        binding.toggleLanguage.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                val lang = if (checkedId == R.id.btnLangEn) "en" else "th"
                if (lang != AppSettings.language) {
                    AppSettings.language = lang
                    val locales = LocaleListCompat.forLanguageTags(lang)
                    AppCompatDelegate.setApplicationLocales(locales)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // Save URL on exit
        _binding?.etServerUrl?.let {
            val url = it.text.toString().trim()
            if (url.isNotEmpty()) AppSettings.baseUrl = url
        }
        _binding = null
    }
}

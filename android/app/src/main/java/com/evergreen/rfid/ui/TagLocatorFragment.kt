package com.evergreen.rfid.ui

import android.content.res.ColorStateList
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.evergreen.rfid.MainActivity
import com.evergreen.rfid.R
import com.evergreen.rfid.databinding.FragmentTagLocatorBinding
import com.evergreen.rfid.util.AppSettings

class TagLocatorFragment : Fragment() {
    companion object {
        private const val ARG_EPC = "epc"
        fun newInstance(epc: String? = null): TagLocatorFragment {
            return TagLocatorFragment().apply {
                arguments = Bundle().apply { epc?.let { putString(ARG_EPC, it) } }
            }
        }
    }

    private var _binding: FragmentTagLocatorBinding? = null
    private val binding get() = _binding!!
    private var isLocating = false
    private var toneGenerator: ToneGenerator? = null
    private val handler = Handler(Looper.getMainLooper())
    private var lastSignal = 0

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentTagLocatorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Pre-fill EPC if provided
        arguments?.getString(ARG_EPC)?.let { epc ->
            binding.etEpc.setText(epc)
        }

        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
        } catch (_: Exception) {}

        binding.btnBack.setOnClickListener {
            if (isLocating) stopLocating()
            (activity as? MainActivity)?.loadFragment(ScannerFragment())
        }

        binding.btnLocate.setOnClickListener {
            if (isLocating) {
                stopLocating()
            } else {
                startLocating()
            }
        }
    }

    private fun startLocating() {
        val epc = binding.etEpc.text.toString().trim().replace(" ", "")
        if (epc.isEmpty()) {
            Toast.makeText(requireContext(), getString(R.string.locator_enter_epc), Toast.LENGTH_SHORT).show()
            return
        }

        val reader = (activity as? MainActivity)?.rfidReader
        if (reader == null || !reader.isInitialized) {
            Toast.makeText(requireContext(), getString(R.string.scan_rfid_not_ready), Toast.LENGTH_SHORT).show()
            return
        }

        isLocating = true
        updateButton()
        binding.tvStatus.text = getString(R.string.locator_searching)

        reader.startLocation(epc) { signal ->
            handler.post {
                lastSignal = signal
                updateSignalDisplay(signal)

                // Beep with frequency proportional to signal strength
                if (AppSettings.soundEnabled && signal > 0) {
                    try {
                        toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 30)
                    } catch (_: Exception) {}
                }
            }
        }
    }

    private fun stopLocating() {
        val reader = (activity as? MainActivity)?.rfidReader
        reader?.stopLocation()
        isLocating = false
        updateButton()
        binding.tvStatus.text = if (lastSignal > 0)
            String.format(getString(R.string.locator_last_signal), lastSignal)
        else getString(R.string.locator_stopped)
    }

    private fun updateSignalDisplay(signal: Int) {
        _binding?.tvSignalPercent?.text = "${signal}%"
        _binding?.progressSignal?.progress = signal

        val color = when {
            signal > 70 -> R.color.primary
            signal > 40 -> R.color.warning_text
            signal > 0 -> R.color.error
            else -> R.color.text_secondary
        }
        _binding?.tvSignalPercent?.setTextColor(ContextCompat.getColor(requireContext(), color))

        _binding?.tvStatus?.text = when {
            signal > 70 -> getString(R.string.locator_very_close)
            signal > 40 -> getString(R.string.locator_getting_closer)
            signal > 0 -> getString(R.string.locator_far_away)
            else -> getString(R.string.locator_searching)
        }
    }

    private fun updateButton() {
        val ctx = context ?: return
        if (isLocating) {
            binding.btnLocate.text = getString(R.string.locator_stop)
            binding.btnLocate.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(ctx, R.color.error))
        } else {
            binding.btnLocate.text = getString(R.string.locator_start)
            binding.btnLocate.backgroundTintList = ColorStateList.valueOf(ContextCompat.getColor(ctx, R.color.primary))
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (isLocating) {
            (activity as? MainActivity)?.rfidReader?.stopLocation()
        }
        handler.removeCallbacksAndMessages(null)
        toneGenerator?.release()
        toneGenerator = null
        _binding = null
    }
}

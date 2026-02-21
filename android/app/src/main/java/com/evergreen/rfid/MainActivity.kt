package com.evergreen.rfid

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.KeyEvent
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.barcode.BarcodeReader
import com.evergreen.rfid.databinding.ActivityMainBinding
import com.evergreen.rfid.rfid.RFIDReader
import com.evergreen.rfid.sync.ConnectivityHelper
import com.evergreen.rfid.ui.HistoryFragment
import com.evergreen.rfid.ui.MoreFragment
import com.evergreen.rfid.ui.ScannerFragment
import com.evergreen.rfid.util.AppSettings
import com.evergreen.rfid.util.UpdateChecker

interface TriggerListener {
    fun onTriggerPressed()
    fun onTriggerReleased()
}

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    lateinit var rfidReader: RFIDReader
        private set
    lateinit var barcodeReader: BarcodeReader
        private set
    private lateinit var auth: SupabaseAuth

    // Physical trigger key codes for Chainway C72
    private val triggerKeyCodes = setOf(
        KeyEvent.KEYCODE_F1,    // 131
        KeyEvent.KEYCODE_F2,    // 132
        KeyEvent.KEYCODE_F3,    // 133
        KeyEvent.KEYCODE_F4,    // 134
        KeyEvent.KEYCODE_F9,    // 292
        280, 281, 282, 283,     // Common Chainway scan codes
        293, 294, 295, 296,     // More scan codes
        311, 312, 313           // Additional scan codes
    )

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppSettings.init(this)
        ConnectivityHelper.init(this)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        auth = SupabaseAuth(this)
        rfidReader = RFIDReader()
        barcodeReader = BarcodeReader()

        // Request permissions for Phase 2 features
        requestPermissions()

        // Init RFID reader in background
        supportActionBar?.subtitle = getString(R.string.rfid_connecting)
        Thread {
            val ok = rfidReader.init(this@MainActivity)
            // Also try to init barcode reader
            try { barcodeReader.init(this@MainActivity) } catch (_: Exception) {}
            runOnUiThread {
                if (ok) {
                    supportActionBar?.subtitle = "${getString(R.string.rfid_ready)} • ${auth.email ?: ""}"
                } else {
                    supportActionBar?.subtitle = getString(R.string.rfid_error)
                    AlertDialog.Builder(this)
                        .setTitle(getString(R.string.rfid_init_failed))
                        .setMessage(rfidReader.lastError)
                        .setPositiveButton(getString(R.string.ok), null)
                        .setCancelable(false)
                        .show()
                }
                // Refresh current fragment
                val current = supportFragmentManager.findFragmentById(R.id.fragment_container)
                if (current is ScannerFragment) {
                    loadFragment(ScannerFragment())
                }
            }
        }.start()

        // Set default fragment
        if (savedInstanceState == null) {
            loadFragment(ScannerFragment())
        }

        // Check for app updates
        UpdateChecker.check(this)

        // Bottom navigation — 3 tabs
        binding.bottomNav.visibility = android.view.View.VISIBLE
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_scanner -> loadFragment(ScannerFragment())
                R.id.nav_history -> loadFragment(HistoryFragment())
                R.id.nav_more -> loadFragment(MoreFragment())
                else -> false
            }
        }
    }

    private fun requestPermissions() {
        val permissions = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA)
        }
        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode in triggerKeyCodes) {
            val fragment = supportFragmentManager.findFragmentById(R.id.fragment_container)
            if (fragment is TriggerListener) {
                fragment.onTriggerPressed()
            }
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode in triggerKeyCodes) {
            val fragment = supportFragmentManager.findFragmentById(R.id.fragment_container)
            if (fragment is TriggerListener) {
                fragment.onTriggerReleased()
            }
            return true
        }
        return super.onKeyUp(keyCode, event)
    }

    fun loadFragment(fragment: Fragment): Boolean {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
        return true
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> {
                auth.logout()
                rfidReader.release()
                barcodeReader.release()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        rfidReader.release()
        barcodeReader.release()
    }
}

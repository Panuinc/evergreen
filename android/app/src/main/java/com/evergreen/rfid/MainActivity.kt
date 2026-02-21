package com.evergreen.rfid

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.ActivityMainBinding
import com.evergreen.rfid.rfid.RFIDReader
import com.evergreen.rfid.ui.ScannerFragment

interface TriggerListener {
    fun onTriggerPressed()
    fun onTriggerReleased()
}

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    lateinit var rfidReader: RFIDReader
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        auth = SupabaseAuth(this)
        rfidReader = RFIDReader()

        // Init RFID reader in background
        supportActionBar?.subtitle = "RFID: กำลังเชื่อมต่อ..."
        Thread {
            val ok = rfidReader.init(this@MainActivity)
            runOnUiThread {
                if (ok) {
                    supportActionBar?.subtitle = "RFID Ready"
                } else {
                    supportActionBar?.subtitle = "RFID Error"
                    AlertDialog.Builder(this)
                        .setTitle("RFID Init Failed")
                        .setMessage(rfidReader.lastError)
                        .setPositiveButton("OK", null)
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

        // Hide bottom nav — only scanner tab remains
        binding.bottomNav.visibility = android.view.View.GONE
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

    private fun loadFragment(fragment: Fragment): Boolean {
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
    }
}

package com.evergreen.rfid

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.KeyEvent
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.ActivityLoginBinding
import com.evergreen.rfid.util.AppSettings

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var auth: SupabaseAuth
    private lateinit var pinFields: List<EditText>
    private var isPinMode = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        auth = SupabaseAuth(this)

        // Auto-login if token exists
        if (auth.isLoggedIn) {
            goToMain()
            return
        }

        pinFields = listOf(
            binding.pin1, binding.pin2, binding.pin3,
            binding.pin4, binding.pin5, binding.pin6
        )

        setupPasswordMode()
        setupPinMode()
        showPasswordMode()
    }

    // ═══ Password Mode ═══

    private fun setupPasswordMode() {
        // Show PIN toggle if there's a saved email
        val lastEmail = auth.email
        if (!lastEmail.isNullOrEmpty()) {
            binding.btnSwitchToPin.visibility = View.VISIBLE
        }

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "กรุณากรอก email และ password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            setLoading(true)

            auth.login(email, password) { result ->
                runOnUiThread {
                    setLoading(false)
                    result.fold(
                        onSuccess = { goToMain() },
                        onFailure = { e ->
                            Toast.makeText(this, "Login failed: ${e.message}", Toast.LENGTH_LONG).show()
                        }
                    )
                }
            }
        }

        binding.btnSwitchToPin.setOnClickListener {
            showPinMode()
        }
    }

    // ═══ PIN Mode ═══

    private fun setupPinMode() {
        // Auto-advance and backspace handling for PIN fields
        for (i in pinFields.indices) {
            val field = pinFields[i]

            field.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (s != null && s.length == 1) {
                        // Move to next field
                        if (i < pinFields.size - 1) {
                            pinFields[i + 1].requestFocus()
                        }
                        // Check if all 6 digits entered
                        val pin = getPin()
                        if (pin.length == 6) {
                            handlePinVerify()
                        }
                    }
                }
            })

            field.setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_DEL && event.action == KeyEvent.ACTION_DOWN) {
                    if (field.text.isEmpty() && i > 0) {
                        pinFields[i - 1].text.clear()
                        pinFields[i - 1].requestFocus()
                        return@setOnKeyListener true
                    }
                }
                false
            }
        }

        binding.btnPinUnlock.setOnClickListener {
            val pin = getPin()
            if (pin.length != 6) {
                Toast.makeText(this, "กรุณาใส่ PIN 6 หลัก", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            handlePinVerify()
        }

        binding.btnSwitchToPassword.setOnClickListener {
            showPasswordMode()
        }
    }

    private fun getPin(): String {
        return pinFields.joinToString("") { it.text.toString() }
    }

    private fun clearPin() {
        pinFields.forEach { it.text.clear() }
        pinFields[0].requestFocus()
    }

    private fun handlePinVerify() {
        val email = auth.email ?: return
        val pin = getPin()
        if (pin.length != 6) return

        setLoading(true)
        binding.tvPinError.visibility = View.GONE

        auth.loginWithPin(email, pin, AppSettings.baseUrl) { result ->
            runOnUiThread {
                setLoading(false)
                result.fold(
                    onSuccess = { goToMain() },
                    onFailure = { e ->
                        binding.tvPinError.text = e.message
                        binding.tvPinError.visibility = View.VISIBLE
                        clearPin()
                    }
                )
            }
        }
    }

    // ═══ Mode Switching ═══

    private fun showPasswordMode() {
        isPinMode = false
        binding.groupPassword.visibility = View.VISIBLE
        binding.groupPin.visibility = View.GONE
        binding.tvPinError.visibility = View.GONE
        clearPin()
    }

    private fun showPinMode() {
        val lastEmail = auth.email
        if (lastEmail.isNullOrEmpty()) {
            Toast.makeText(this, "กรุณาลงชื่อเข้าใช้ด้วยรหัสผ่านก่อน", Toast.LENGTH_SHORT).show()
            return
        }

        isPinMode = true
        binding.groupPassword.visibility = View.GONE
        binding.groupPin.visibility = View.VISIBLE
        binding.tvPinEmail.text = lastEmail
        binding.tvPinError.visibility = View.GONE
        clearPin()
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        if (isPinMode) {
            binding.btnPinUnlock.isEnabled = !loading
            pinFields.forEach { it.isEnabled = !loading }
        } else {
            binding.btnLogin.isEnabled = !loading
        }
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}

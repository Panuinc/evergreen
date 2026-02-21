package com.evergreen.rfid

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.evergreen.rfid.api.SupabaseAuth
import com.evergreen.rfid.databinding.ActivityLoginBinding

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var auth: SupabaseAuth

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

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "กรุณากรอก email และ password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            binding.btnLogin.isEnabled = false
            binding.progressBar.visibility = View.VISIBLE

            auth.login(email, password) { result ->
                runOnUiThread {
                    binding.btnLogin.isEnabled = true
                    binding.progressBar.visibility = View.GONE

                    result.fold(
                        onSuccess = { goToMain() },
                        onFailure = { e ->
                            Toast.makeText(this, "Login failed: ${e.message}", Toast.LENGTH_LONG).show()
                        }
                    )
                }
            }
        }
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}

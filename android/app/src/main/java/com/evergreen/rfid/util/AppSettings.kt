package com.evergreen.rfid.util

import android.content.Context
import android.content.SharedPreferences

object AppSettings {
    private const val PREFS_NAME = "evergreen_settings"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_RFID_POWER = "rfid_power"
    private const val KEY_SOUND_ENABLED = "sound_enabled"
    private const val KEY_AUTO_DECODE = "auto_decode"
    private const val KEY_LANGUAGE = "language"

    private const val DEFAULT_BASE_URL = "http://192.168.1.54:3000"
    private const val DEFAULT_RFID_POWER = 30
    private const val DEFAULT_SOUND_ENABLED = true
    private const val DEFAULT_AUTO_DECODE = true
    private const val DEFAULT_LANGUAGE = "th"

    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    var baseUrl: String
        get() = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        set(value) = prefs.edit().putString(KEY_BASE_URL, value).apply()

    var rfidPower: Int
        get() = prefs.getInt(KEY_RFID_POWER, DEFAULT_RFID_POWER)
        set(value) = prefs.edit().putInt(KEY_RFID_POWER, value.coerceIn(0, 30)).apply()

    var soundEnabled: Boolean
        get() = prefs.getBoolean(KEY_SOUND_ENABLED, DEFAULT_SOUND_ENABLED)
        set(value) = prefs.edit().putBoolean(KEY_SOUND_ENABLED, value).apply()

    var autoDecode: Boolean
        get() = prefs.getBoolean(KEY_AUTO_DECODE, DEFAULT_AUTO_DECODE)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_DECODE, value).apply()

    var language: String
        get() = prefs.getString(KEY_LANGUAGE, DEFAULT_LANGUAGE) ?: DEFAULT_LANGUAGE
        set(value) = prefs.edit().putString(KEY_LANGUAGE, value).apply()
}

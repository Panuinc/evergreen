package com.evergreen.rfid.util;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0016\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010)\u001a\u00020*2\u0006\u0010+\u001a\u00020,R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0006X\u0082T\u00a2\u0006\u0002\n\u0000R$\u0010\u0012\u001a\u00020\u00042\u0006\u0010\u0011\u001a\u00020\u00048F@FX\u0086\u000e\u00a2\u0006\f\u001a\u0004\b\u0013\u0010\u0014\"\u0004\b\u0015\u0010\u0016R$\u0010\u0017\u001a\u00020\u00062\u0006\u0010\u0011\u001a\u00020\u00068F@FX\u0086\u000e\u00a2\u0006\f\u001a\u0004\b\u0018\u0010\u0019\"\u0004\b\u001a\u0010\u001bR$\u0010\u001c\u001a\u00020\u00062\u0006\u0010\u0011\u001a\u00020\u00068F@FX\u0086\u000e\u00a2\u0006\f\u001a\u0004\b\u001d\u0010\u0019\"\u0004\b\u001e\u0010\u001bR\u000e\u0010\u001f\u001a\u00020 X\u0082.\u00a2\u0006\u0002\n\u0000R$\u0010!\u001a\u00020\t2\u0006\u0010\u0011\u001a\u00020\t8F@FX\u0086\u000e\u00a2\u0006\f\u001a\u0004\b\"\u0010#\"\u0004\b$\u0010%R$\u0010&\u001a\u00020\u00042\u0006\u0010\u0011\u001a\u00020\u00048F@FX\u0086\u000e\u00a2\u0006\f\u001a\u0004\b\'\u0010\u0014\"\u0004\b(\u0010\u0016\u00a8\u0006-"}, d2 = {"Lcom/evergreen/rfid/util/AppSettings;", "", "()V", "DEFAULT_AUTO_DECODE", "", "DEFAULT_BASE_URL", "", "DEFAULT_LANGUAGE", "DEFAULT_RFID_POWER", "", "DEFAULT_SOUND_ENABLED", "KEY_AUTO_DECODE", "KEY_BASE_URL", "KEY_LANGUAGE", "KEY_RFID_POWER", "KEY_SOUND_ENABLED", "PREFS_NAME", "value", "autoDecode", "getAutoDecode", "()Z", "setAutoDecode", "(Z)V", "baseUrl", "getBaseUrl", "()Ljava/lang/String;", "setBaseUrl", "(Ljava/lang/String;)V", "language", "getLanguage", "setLanguage", "prefs", "Landroid/content/SharedPreferences;", "rfidPower", "getRfidPower", "()I", "setRfidPower", "(I)V", "soundEnabled", "getSoundEnabled", "setSoundEnabled", "init", "", "context", "Landroid/content/Context;", "app_debug"})
public final class AppSettings {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String PREFS_NAME = "evergreen_settings";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_BASE_URL = "base_url";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_RFID_POWER = "rfid_power";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_SOUND_ENABLED = "sound_enabled";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_AUTO_DECODE = "auto_decode";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_LANGUAGE = "language";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String DEFAULT_BASE_URL = "http://192.168.1.120:3000";
    private static final int DEFAULT_RFID_POWER = 30;
    private static final boolean DEFAULT_SOUND_ENABLED = true;
    private static final boolean DEFAULT_AUTO_DECODE = true;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String DEFAULT_LANGUAGE = "th";
    private static android.content.SharedPreferences prefs;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.util.AppSettings INSTANCE = null;
    
    private AppSettings() {
        super();
    }
    
    public final void init(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getBaseUrl() {
        return null;
    }
    
    public final void setBaseUrl(@org.jetbrains.annotations.NotNull()
    java.lang.String value) {
    }
    
    public final int getRfidPower() {
        return 0;
    }
    
    public final void setRfidPower(int value) {
    }
    
    public final boolean getSoundEnabled() {
        return false;
    }
    
    public final void setSoundEnabled(boolean value) {
    }
    
    public final boolean getAutoDecode() {
        return false;
    }
    
    public final void setAutoDecode(boolean value) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getLanguage() {
        return null;
    }
    
    public final void setLanguage(@org.jetbrains.annotations.NotNull()
    java.lang.String value) {
    }
}
package com.evergreen.rfid.api;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\r\u0018\u0000 &2\u00020\u0001:\u0001&B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J0\u0010\u0014\u001a\u00020\u00152\u0006\u0010\u000b\u001a\u00020\u00062\u0006\u0010\u0016\u001a\u00020\u00062\u0018\u0010\u0017\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u001a0\u0019\u0012\u0004\u0012\u00020\u00150\u0018J8\u0010\u001b\u001a\u00020\u00152\u0006\u0010\u000b\u001a\u00020\u00062\u0006\u0010\u001c\u001a\u00020\u00062\u0006\u0010\u001d\u001a\u00020\u00062\u0018\u0010\u0017\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u001a0\u0019\u0012\u0004\u0012\u00020\u00150\u0018J\u0006\u0010\u001e\u001a\u00020\u0015J \u0010\u001f\u001a\u00020\u00152\u0018\u0010\u0017\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u001a0\u0019\u0012\u0004\u0012\u00020\u00150\u0018J\u0006\u0010 \u001a\u00020\u0010J\u0018\u0010!\u001a\u00020\u00152\u0006\u0010\"\u001a\u00020\u001a2\u0006\u0010\u000b\u001a\u00020\u0006H\u0002J2\u0010#\u001a\u00020\u00152\u0006\u0010$\u001a\u00020\u00062\u0006\u0010%\u001a\u00020\u00062\u0018\u0010\u0017\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u001a0\u0019\u0012\u0004\u0012\u00020\u00150\u0018H\u0002R\u0013\u0010\u0005\u001a\u0004\u0018\u00010\u00068F\u00a2\u0006\u0006\u001a\u0004\b\u0007\u0010\bR\u000e\u0010\t\u001a\u00020\nX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0013\u0010\u000b\u001a\u0004\u0018\u00010\u00068F\u00a2\u0006\u0006\u001a\u0004\b\f\u0010\bR\u000e\u0010\r\u001a\u00020\u000eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0011\u0010\u000f\u001a\u00020\u00108F\u00a2\u0006\u0006\u001a\u0004\b\u000f\u0010\u0011R\u000e\u0010\u0012\u001a\u00020\u0013X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\'"}, d2 = {"Lcom/evergreen/rfid/api/SupabaseAuth;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "accessToken", "", "getAccessToken", "()Ljava/lang/String;", "client", "Lokhttp3/OkHttpClient;", "email", "getEmail", "gson", "Lcom/google/gson/Gson;", "isLoggedIn", "", "()Z", "prefs", "Landroid/content/SharedPreferences;", "login", "", "password", "callback", "Lkotlin/Function1;", "Lkotlin/Result;", "Lcom/evergreen/rfid/api/AuthResponse;", "loginWithPin", "pin", "baseUrl", "logout", "refreshToken", "refreshTokenSync", "saveTokens", "auth", "verifyOtp", "tokenHash", "userEmail", "Companion", "app_debug"})
public final class SupabaseAuth {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String PREFS_NAME = "evergreen_auth";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_ACCESS_TOKEN = "access_token";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_REFRESH_TOKEN = "refresh_token";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_EMAIL = "email";
    @org.jetbrains.annotations.NotNull()
    private final okhttp3.OkHttpClient client = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.gson.Gson gson = null;
    @org.jetbrains.annotations.NotNull()
    private final android.content.SharedPreferences prefs = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.api.SupabaseAuth.Companion Companion = null;
    
    public SupabaseAuth(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getAccessToken() {
        return null;
    }
    
    public final boolean isLoggedIn() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getEmail() {
        return null;
    }
    
    public final void login(@org.jetbrains.annotations.NotNull()
    java.lang.String email, @org.jetbrains.annotations.NotNull()
    java.lang.String password, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<com.evergreen.rfid.api.AuthResponse>, kotlin.Unit> callback) {
    }
    
    public final void loginWithPin(@org.jetbrains.annotations.NotNull()
    java.lang.String email, @org.jetbrains.annotations.NotNull()
    java.lang.String pin, @org.jetbrains.annotations.NotNull()
    java.lang.String baseUrl, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<com.evergreen.rfid.api.AuthResponse>, kotlin.Unit> callback) {
    }
    
    private final void verifyOtp(java.lang.String tokenHash, java.lang.String userEmail, kotlin.jvm.functions.Function1<? super kotlin.Result<com.evergreen.rfid.api.AuthResponse>, kotlin.Unit> callback) {
    }
    
    public final void refreshToken(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<com.evergreen.rfid.api.AuthResponse>, kotlin.Unit> callback) {
    }
    
    public final boolean refreshTokenSync() {
        return false;
    }
    
    public final void logout() {
    }
    
    private final void saveTokens(com.evergreen.rfid.api.AuthResponse auth, java.lang.String email) {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0004\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\b"}, d2 = {"Lcom/evergreen/rfid/api/SupabaseAuth$Companion;", "", "()V", "KEY_ACCESS_TOKEN", "", "KEY_EMAIL", "KEY_REFRESH_TOKEN", "PREFS_NAME", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}
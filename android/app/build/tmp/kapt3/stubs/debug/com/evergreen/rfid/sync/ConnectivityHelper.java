package com.evergreen.rfid.sync;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000.\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\b\u0010\u000b\u001a\u00020\u0004H\u0002J\u000e\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000fR\u000e\u0010\u0003\u001a\u00020\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0005\u001a\u0004\u0018\u00010\u0006X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0011\u0010\u0007\u001a\u00020\u00048F\u00a2\u0006\u0006\u001a\u0004\b\u0007\u0010\bR\u0010\u0010\t\u001a\u0004\u0018\u00010\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0010"}, d2 = {"Lcom/evergreen/rfid/sync/ConnectivityHelper;", "", "()V", "_isOnline", "", "connectivityManager", "Landroid/net/ConnectivityManager;", "isOnline", "()Z", "networkCallback", "Landroid/net/ConnectivityManager$NetworkCallback;", "checkNetwork", "init", "", "context", "Landroid/content/Context;", "app_debug"})
public final class ConnectivityHelper {
    @org.jetbrains.annotations.Nullable()
    private static android.net.ConnectivityManager connectivityManager;
    @org.jetbrains.annotations.Nullable()
    private static android.net.ConnectivityManager.NetworkCallback networkCallback;
    private static boolean _isOnline = false;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.sync.ConnectivityHelper INSTANCE = null;
    
    private ConnectivityHelper() {
        super();
    }
    
    public final boolean isOnline() {
        return false;
    }
    
    public final void init(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
    }
    
    private final boolean checkNetwork() {
        return false;
    }
}
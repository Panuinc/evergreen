package com.evergreen.rfid.sync;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000X\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u0000 \u001f2\u00020\u0001:\u0001\u001fB\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J(\u0010\u0019\u001a\u00020\u001a2\u0006\u0010\u001b\u001a\u00020\u001c2\u0018\u0010\u001d\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u001e\u0012\u0004\u0012\u00020\u001a0\u0006R)\u0010\u0005\u001a\u0018\b\u0001\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u0007\u0012\u0006\u0012\u0004\u0018\u00010\u00010\u0006\u00a2\u0006\n\n\u0002\u0010\u000b\u001a\u0004\b\t\u0010\nR\u000e\u0010\f\u001a\u00020\rX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u000fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0011\u0010\u0012\u001a\u00020\u00138F\u00a2\u0006\u0006\u001a\u0004\b\u0014\u0010\u0015R\u0016\u0010\u0016\u001a\n \u0018*\u0004\u0018\u00010\u00170\u0017X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006 "}, d2 = {"Lcom/evergreen/rfid/sync/SyncManager;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "cachedItemCount", "Lkotlin/Function1;", "Lkotlin/coroutines/Continuation;", "", "getCachedItemCount", "()Lkotlin/jvm/functions/Function1;", "Lkotlin/jvm/functions/Function1;", "client", "Lokhttp3/OkHttpClient;", "db", "Lcom/evergreen/rfid/db/AppDatabase;", "gson", "Lcom/google/gson/Gson;", "lastSyncTime", "", "getLastSyncTime", "()J", "prefs", "Landroid/content/SharedPreferences;", "kotlin.jvm.PlatformType", "syncItems", "", "token", "", "callback", "Lkotlin/Result;", "Companion", "app_debug"})
public final class SyncManager {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "SyncManager";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String PREFS_NAME = "sync_prefs";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String KEY_LAST_SYNC = "last_item_sync";
    @org.jetbrains.annotations.NotNull()
    private final com.evergreen.rfid.db.AppDatabase db = null;
    private final android.content.SharedPreferences prefs = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.gson.Gson gson = null;
    @org.jetbrains.annotations.NotNull()
    private final okhttp3.OkHttpClient client = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlin.jvm.functions.Function1<kotlin.coroutines.Continuation<? super java.lang.Integer>, java.lang.Object> cachedItemCount = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.sync.SyncManager.Companion Companion = null;
    
    public SyncManager(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    public final long getLastSyncTime() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlin.jvm.functions.Function1<kotlin.coroutines.Continuation<? super java.lang.Integer>, java.lang.Object> getCachedItemCount() {
        return null;
    }
    
    /**
     * Fetch all items from /api/warehouse/inventory and cache in Room
     */
    public final void syncItems(@org.jetbrains.annotations.NotNull()
    java.lang.String token, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<java.lang.Integer>, kotlin.Unit> callback) {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0003\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0007"}, d2 = {"Lcom/evergreen/rfid/sync/SyncManager$Companion;", "", "()V", "KEY_LAST_SYNC", "", "PREFS_NAME", "TAG", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}
package com.evergreen.rfid.api;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0086\u0001\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0002\b\u0005\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0010$\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\b\u0003\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000b\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0010\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u0013\u001a\u00020\bH\u0002Jk\u0010\u0014\u001a\u00020\u00152\u0006\u0010\u0016\u001a\u00020\b2\u0006\u0010\u0017\u001a\u00020\b2\b\u0010\u0018\u001a\u0004\u0018\u00010\b2\b\u0010\u0019\u001a\u0004\u0018\u00010\b2\b\u0010\u001a\u001a\u0004\u0018\u00010\u001b2\b\u0010\u001c\u001a\u0004\u0018\u00010\u001b2&\u0010\u001d\u001a\"\u0012\u0018\u0012\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0\u001f\u0012\u0004\u0012\u00020\u00150\u001e\u00a2\u0006\u0002\u0010!J(\u0010\"\u001a\u00020\u00152\u0006\u0010#\u001a\u00020\b2\u0018\u0010\u001d\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020$0\u001f\u0012\u0004\u0012\u00020\u00150\u001eJ \u0010%\u001a\u00020\u00152\u0018\u0010\u001d\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\b0\u001f\u0012\u0004\u0012\u00020\u00150\u001eJ.\u0010&\u001a\u00020\u00152&\u0010\u001d\u001a\"\u0012\u0018\u0012\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0\u001f\u0012\u0004\u0012\u00020\u00150\u001eJ>\u0010\'\u001a\u00020\u00152\b\u0010(\u001a\u0004\u0018\u00010\b2,\u0010\u001d\u001a(\u0012\u001e\u0012\u001c\u0012\u0018\u0012\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0)0\u001f\u0012\u0004\u0012\u00020\u00150\u001eJN\u0010*\u001a\u00020\u00152\u0006\u0010+\u001a\u00020\b2\u0006\u0010,\u001a\u00020-2\u0006\u0010.\u001a\u00020/2\u0006\u00100\u001a\u00020-2&\u0010\u001d\u001a\"\u0012\u0018\u0012\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0\u001f\u0012\u0004\u0012\u00020\u00150\u001eJv\u00101\u001a\u00020\u00152\u0006\u00102\u001a\u00020\b2\u0006\u00103\u001a\u00020\b2\u001a\u00104\u001a\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0)2\u001a\u00105\u001a\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0)2&\u0010\u001d\u001a\"\u0012\u0018\u0012\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0\u001f\u0012\u0004\u0012\u00020\u00150\u001eJ8\u00106\u001a\u00020\u00152\u0006\u0010\u0018\u001a\u00020\b2\f\u00107\u001a\b\u0012\u0004\u0012\u0002080)2\u0018\u0010\u001d\u001a\u0014\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00010\u001f\u0012\u0004\u0012\u00020\u00150\u001eH\u0002JD\u00109\u001a\u00020\u00152\u0006\u0010:\u001a\u00020;2\f\u00107\u001a\b\u0012\u0004\u0012\u0002080)2&\u0010\u001d\u001a\"\u0012\u0018\u0012\u0016\u0012\u0012\u0012\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010 0\u001f\u0012\u0004\u0012\u00020\u00150\u001eR\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0011\u0010\u0007\u001a\u00020\b8F\u00a2\u0006\u0006\u001a\u0004\b\t\u0010\nR\u000e\u0010\u000b\u001a\u00020\fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0010X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006<"}, d2 = {"Lcom/evergreen/rfid/api/ApiClient;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "auth", "Lcom/evergreen/rfid/api/SupabaseAuth;", "baseUrl", "", "getBaseUrl", "()Ljava/lang/String;", "client", "Lokhttp3/OkHttpClient;", "gson", "Lcom/google/gson/Gson;", "isoFormat", "Ljava/text/SimpleDateFormat;", "buildRequest", "Lokhttp3/Request$Builder;", "url", "createTransfer", "", "fromLocation", "toLocation", "sessionId", "notes", "gpsLat", "", "gpsLon", "callback", "Lkotlin/Function1;", "Lkotlin/Result;", "", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/Double;Ljava/lang/Double;Lkotlin/jvm/functions/Function1;)V", "decodeRfid", "epc", "Lcom/evergreen/rfid/model/DecodeResult;", "fetchAllItems", "fetchDashboard", "fetchOrders", "type", "", "printLabel", "itemNumber", "quantity", "", "encodeRfid", "", "rfidCode", "submitMatch", "orderNo", "orderType", "expectedItems", "scannedItems", "uploadRecords", "records", "Lcom/evergreen/rfid/db/entity/ScanRecordEntity;", "uploadSession", "session", "Lcom/evergreen/rfid/db/entity/ScanSessionEntity;", "app_debug"})
public final class ApiClient {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull()
    private final okhttp3.OkHttpClient client = null;
    @org.jetbrains.annotations.NotNull()
    private final com.google.gson.Gson gson = null;
    @org.jetbrains.annotations.NotNull()
    private final com.evergreen.rfid.api.SupabaseAuth auth = null;
    @org.jetbrains.annotations.NotNull()
    private final java.text.SimpleDateFormat isoFormat = null;
    
    public ApiClient(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getBaseUrl() {
        return null;
    }
    
    private final okhttp3.Request.Builder buildRequest(java.lang.String url) {
        return null;
    }
    
    public final void decodeRfid(@org.jetbrains.annotations.NotNull()
    java.lang.String epc, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<com.evergreen.rfid.model.DecodeResult>, kotlin.Unit> callback) {
    }
    
    public final void fetchDashboard(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>, kotlin.Unit> callback) {
    }
    
    public final void uploadSession(@org.jetbrains.annotations.NotNull()
    com.evergreen.rfid.db.entity.ScanSessionEntity session, @org.jetbrains.annotations.NotNull()
    java.util.List<com.evergreen.rfid.db.entity.ScanRecordEntity> records, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>, kotlin.Unit> callback) {
    }
    
    private final void uploadRecords(java.lang.String sessionId, java.util.List<com.evergreen.rfid.db.entity.ScanRecordEntity> records, kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.lang.Object>, kotlin.Unit> callback) {
    }
    
    public final void fetchOrders(@org.jetbrains.annotations.Nullable()
    java.lang.String type, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.util.List<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>>, kotlin.Unit> callback) {
    }
    
    public final void submitMatch(@org.jetbrains.annotations.NotNull()
    java.lang.String orderNo, @org.jetbrains.annotations.NotNull()
    java.lang.String orderType, @org.jetbrains.annotations.NotNull()
    java.util.List<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>> expectedItems, @org.jetbrains.annotations.NotNull()
    java.util.List<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>> scannedItems, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>, kotlin.Unit> callback) {
    }
    
    public final void createTransfer(@org.jetbrains.annotations.NotNull()
    java.lang.String fromLocation, @org.jetbrains.annotations.NotNull()
    java.lang.String toLocation, @org.jetbrains.annotations.Nullable()
    java.lang.String sessionId, @org.jetbrains.annotations.Nullable()
    java.lang.String notes, @org.jetbrains.annotations.Nullable()
    java.lang.Double gpsLat, @org.jetbrains.annotations.Nullable()
    java.lang.Double gpsLon, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>, kotlin.Unit> callback) {
    }
    
    public final void printLabel(@org.jetbrains.annotations.NotNull()
    java.lang.String itemNumber, int quantity, boolean encodeRfid, int rfidCode, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<? extends java.util.Map<java.lang.String, ? extends java.lang.Object>>, kotlin.Unit> callback) {
    }
    
    public final void fetchAllItems(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super kotlin.Result<java.lang.String>, kotlin.Unit> callback) {
    }
}
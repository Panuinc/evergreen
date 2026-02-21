package com.evergreen.rfid.util;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00004\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u0010\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\u0006H\u0002J\u0014\u0010\b\u001a\u00020\u00062\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u000b0\nJ\u0014\u0010\f\u001a\u00020\u00062\f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u000b0\nJ(\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0011\u001a\u00020\u00062\u0006\u0010\u0012\u001a\u00020\u00062\b\b\u0002\u0010\u0013\u001a\u00020\u0006R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0014"}, d2 = {"Lcom/evergreen/rfid/util/ExportHelper;", "", "()V", "dateFormat", "Ljava/text/SimpleDateFormat;", "csvEscape", "", "value", "exportAsCsv", "results", "", "Lcom/evergreen/rfid/model/ScanResult;", "exportAsText", "share", "", "context", "Landroid/content/Context;", "content", "mimeType", "title", "app_debug"})
public final class ExportHelper {
    @org.jetbrains.annotations.NotNull()
    private static final java.text.SimpleDateFormat dateFormat = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.util.ExportHelper INSTANCE = null;
    
    private ExportHelper() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String exportAsCsv(@org.jetbrains.annotations.NotNull()
    java.util.List<com.evergreen.rfid.model.ScanResult> results) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String exportAsText(@org.jetbrains.annotations.NotNull()
    java.util.List<com.evergreen.rfid.model.ScanResult> results) {
        return null;
    }
    
    public final void share(@org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    java.lang.String content, @org.jetbrains.annotations.NotNull()
    java.lang.String mimeType, @org.jetbrains.annotations.NotNull()
    java.lang.String title) {
    }
    
    private final java.lang.String csvEscape(java.lang.String value) {
        return null;
    }
}
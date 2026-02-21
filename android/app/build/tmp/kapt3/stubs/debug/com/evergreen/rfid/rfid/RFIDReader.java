package com.evergreen.rfid.rfid;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000Z\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0007\u0018\u0000 .2\u00020\u0001:\u0001.B\u0005\u00a2\u0006\u0002\u0010\u0002J\b\u0010\u0011\u001a\u0004\u0018\u00010\tJ\u0006\u0010\u0012\u001a\u00020\u0013J\u0010\u0010\u0014\u001a\u00020\t2\u0006\u0010\u0015\u001a\u00020\tH\u0002J\b\u0010\u0016\u001a\u0004\u0018\u00010\tJ\b\u0010\u0017\u001a\u0004\u0018\u00010\tJ\u000e\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u001aJ\u0014\u0010\u001b\u001a\u0010\u0012\u0004\u0012\u00020\t\u0012\u0004\u0012\u00020\t\u0018\u00010\u001cJ\u0006\u0010\u001d\u001a\u00020\u001eJ\u000e\u0010\u001f\u001a\u00020\u00042\u0006\u0010 \u001a\u00020\u0013J\"\u0010!\u001a\u00020\u00042\u0006\u0010\"\u001a\u00020\t2\u0012\u0010#\u001a\u000e\u0012\u0004\u0012\u00020\u0013\u0012\u0004\u0012\u00020\u001e0$J>\u0010%\u001a\u00020\u000426\u0010&\u001a2\u0012\u0013\u0012\u00110\t\u00a2\u0006\f\b(\u0012\b\b)\u0012\u0004\b\b(\"\u0012\u0013\u0012\u00110\t\u00a2\u0006\f\b(\u0012\b\b)\u0012\u0004\b\b(*\u0012\u0004\u0012\u00020\u001e0\'J\u0006\u0010+\u001a\u00020\u001eJ\u0006\u0010,\u001a\u00020\u001eJ\u000e\u0010-\u001a\u00020\u00042\u0006\u0010\"\u001a\u00020\tR\u0011\u0010\u0003\u001a\u00020\u00048F\u00a2\u0006\u0006\u001a\u0004\b\u0003\u0010\u0005R\u000e\u0010\u0006\u001a\u00020\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u001e\u0010\n\u001a\u00020\t2\u0006\u0010\b\u001a\u00020\t@BX\u0086\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0010\u0010\r\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000f\u001a\u0004\u0018\u00010\u0010X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006/"}, d2 = {"Lcom/evergreen/rfid/rfid/RFIDReader;", "", "()V", "isInitialized", "", "()Z", "isLocating", "isScanning", "<set-?>", "", "lastError", "getLastError", "()Ljava/lang/String;", "mReader", "Lcom/rscja/deviceapi/RFIDWithUHFUART;", "scanThread", "Ljava/lang/Thread;", "getHardwareVersion", "getPower", "", "getSystemProp", "key", "getTemperature", "getVersion", "init", "context", "Landroid/content/Context;", "readSingleTag", "Lkotlin/Pair;", "release", "", "setPower", "power", "startLocation", "epc", "onSignal", "Lkotlin/Function1;", "startScan", "onTag", "Lkotlin/Function2;", "Lkotlin/ParameterName;", "name", "rssi", "stopLocation", "stopScan", "writeEpc", "Companion", "app_debug"})
public final class RFIDReader {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "RFIDReader";
    @org.jetbrains.annotations.Nullable()
    private com.rscja.deviceapi.RFIDWithUHFUART mReader;
    private boolean isScanning = false;
    @org.jetbrains.annotations.Nullable()
    private java.lang.Thread scanThread;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String lastError = "";
    private boolean isLocating = false;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.rfid.RFIDReader.Companion Companion = null;
    
    public RFIDReader() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getLastError() {
        return null;
    }
    
    public final boolean isInitialized() {
        return false;
    }
    
    private final java.lang.String getSystemProp(java.lang.String key) {
        return null;
    }
    
    public final boolean init(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        return false;
    }
    
    public final void release() {
    }
    
    public final boolean startScan(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function2<? super java.lang.String, ? super java.lang.String, kotlin.Unit> onTag) {
        return false;
    }
    
    public final void stopScan() {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.Pair<java.lang.String, java.lang.String> readSingleTag() {
        return null;
    }
    
    public final boolean setPower(int power) {
        return false;
    }
    
    public final int getPower() {
        return 0;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getVersion() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getHardwareVersion() {
        return null;
    }
    
    public final boolean startLocation(@org.jetbrains.annotations.NotNull()
    java.lang.String epc, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onSignal) {
        return false;
    }
    
    public final void stopLocation() {
    }
    
    /**
     * Write EPC data to a tag in the field.
     * The tag must be in range and only one tag should be present.
     */
    public final boolean writeEpc(@org.jetbrains.annotations.NotNull()
    java.lang.String epc) {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getTemperature() {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0012\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0005"}, d2 = {"Lcom/evergreen/rfid/rfid/RFIDReader$Companion;", "", "()V", "TAG", "", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}
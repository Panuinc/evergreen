package com.evergreen.rfid.ui;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u00a4\u0001\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010#\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010!\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0010\n\u0002\u0018\u0002\n\u0002\b\u0005\u0018\u0000 P2\u00020\u00012\u00020\u0002:\u0001PB\u0005\u00a2\u0006\u0002\u0010\u0003J\b\u0010,\u001a\u00020-H\u0002J\u0010\u0010.\u001a\u00020-2\u0006\u0010/\u001a\u00020\u000fH\u0002J\u0010\u00100\u001a\u00020-2\u0006\u0010/\u001a\u00020\u000fH\u0002J\b\u00101\u001a\u00020-H\u0002J\u0018\u00102\u001a\u00020-2\u0006\u0010/\u001a\u00020\u000f2\u0006\u00103\u001a\u00020\u000fH\u0002J$\u00104\u001a\u0002052\u0006\u00106\u001a\u0002072\b\u00108\u001a\u0004\u0018\u0001092\b\u0010:\u001a\u0004\u0018\u00010;H\u0016J\b\u0010<\u001a\u00020-H\u0016J\b\u0010=\u001a\u00020-H\u0016J\b\u0010>\u001a\u00020-H\u0016J\u001a\u0010?\u001a\u00020-2\u0006\u0010@\u001a\u0002052\b\u0010:\u001a\u0004\u0018\u00010;H\u0016J\u0010\u0010A\u001a\u00020-2\u0006\u0010/\u001a\u00020\u000fH\u0002J\b\u0010B\u001a\u00020-H\u0002J\b\u0010C\u001a\u00020-H\u0002J\b\u0010D\u001a\u00020-H\u0002J\b\u0010E\u001a\u00020-H\u0002J\u0010\u0010F\u001a\u00020-2\u0006\u0010/\u001a\u00020\u000fH\u0002J\b\u0010G\u001a\u00020-H\u0002J\b\u0010H\u001a\u00020-H\u0002J\b\u0010I\u001a\u00020-H\u0002J\u0018\u0010J\u001a\u00020-2\u0006\u0010/\u001a\u00020\u000f2\u0006\u0010K\u001a\u00020LH\u0002J\b\u0010M\u001a\u00020-H\u0002J\b\u0010N\u001a\u00020-H\u0002J\b\u0010O\u001a\u00020-H\u0002R\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082.\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082.\u00a2\u0006\u0002\n\u0000R\u0014\u0010\n\u001a\u00020\u00058BX\u0082\u0004\u00a2\u0006\u0006\u001a\u0004\b\u000b\u0010\fR\u0014\u0010\r\u001a\b\u0012\u0004\u0012\u00020\u000f0\u000eX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082.\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0013X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0014\u001a\u0004\u0018\u00010\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0015\u001a\u0004\u0018\u00010\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u001c\u0010\u0016\u001a\u0010\u0012\f\u0012\n \u0019*\u0004\u0018\u00010\u00180\u00180\u0017X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u001c0\u001bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001d\u001a\u00020\u001eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001f\u001a\u00020 X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010!\u001a\u00020\"X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0012\u0010#\u001a\u0004\u0018\u00010$X\u0082\u000e\u00a2\u0006\u0004\n\u0002\u0010%R\u0012\u0010&\u001a\u0004\u0018\u00010$X\u0082\u000e\u00a2\u0006\u0004\n\u0002\u0010%R\u0010\u0010\'\u001a\u0004\u0018\u00010(X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010)\u001a\u00020\u001eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010*\u001a\u00020+X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006Q"}, d2 = {"Lcom/evergreen/rfid/ui/ScannerFragment;", "Landroidx/fragment/app/Fragment;", "Lcom/evergreen/rfid/TriggerListener;", "()V", "_binding", "Lcom/evergreen/rfid/databinding/FragmentScannerBinding;", "adapter", "Lcom/evergreen/rfid/ui/ScanResultAdapter;", "apiClient", "Lcom/evergreen/rfid/api/ApiClient;", "binding", "getBinding", "()Lcom/evergreen/rfid/databinding/FragmentScannerBinding;", "countSet", "", "", "db", "Lcom/evergreen/rfid/db/AppDatabase;", "isScanning", "", "pendingPhotoEpc", "pendingPhotoPath", "photoLauncher", "Landroidx/activity/result/ActivityResultLauncher;", "Landroid/content/Intent;", "kotlin.jvm.PlatformType", "results", "", "Lcom/evergreen/rfid/model/ScanResult;", "scanMode", "", "scanStartTime", "", "scope", "Lkotlinx/coroutines/CoroutineScope;", "sessionLat", "", "Ljava/lang/Double;", "sessionLon", "toneGenerator", "Landroid/media/ToneGenerator;", "totalReads", "uiHandler", "Landroid/os/Handler;", "captureGps", "", "decodeOffline", "epc", "decodeTag", "doSingleScan", "handleTagOnUiThread", "rssi", "onCreateView", "Landroid/view/View;", "inflater", "Landroid/view/LayoutInflater;", "container", "Landroid/view/ViewGroup;", "savedInstanceState", "Landroid/os/Bundle;", "onDestroyView", "onTriggerPressed", "onTriggerReleased", "onViewCreated", "view", "openLocator", "saveSession", "showExportDialog", "showSummary", "stopScan", "takePhoto", "toggleAutoScan", "updateCount", "updateCountDisplay", "updateDecodeResult", "decoded", "Lcom/evergreen/rfid/model/DecodeResult;", "updateModeDisplay", "updateScanButton", "updateStats", "Companion", "app_debug"})
public final class ScannerFragment extends androidx.fragment.app.Fragment implements com.evergreen.rfid.TriggerListener {
    @org.jetbrains.annotations.Nullable()
    private com.evergreen.rfid.databinding.FragmentScannerBinding _binding;
    private com.evergreen.rfid.api.ApiClient apiClient;
    private com.evergreen.rfid.db.AppDatabase db;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.evergreen.rfid.model.ScanResult> results = null;
    private com.evergreen.rfid.ui.ScanResultAdapter adapter;
    private boolean isScanning = false;
    @org.jetbrains.annotations.Nullable()
    private android.media.ToneGenerator toneGenerator;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.CoroutineScope scope = null;
    private int scanMode = 0;
    private int totalReads = 0;
    private long scanStartTime = 0L;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Set<java.lang.String> countSet = null;
    @org.jetbrains.annotations.Nullable()
    private java.lang.Double sessionLat;
    @org.jetbrains.annotations.Nullable()
    private java.lang.Double sessionLon;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String pendingPhotoEpc;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String pendingPhotoPath;
    @org.jetbrains.annotations.NotNull()
    private final androidx.activity.result.ActivityResultLauncher<android.content.Intent> photoLauncher = null;
    private static final int MSG_TAG = 1;
    private static final int MSG_TIMER = 2;
    @org.jetbrains.annotations.NotNull()
    private final android.os.Handler uiHandler = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.ui.ScannerFragment.Companion Companion = null;
    
    public ScannerFragment() {
        super();
    }
    
    private final com.evergreen.rfid.databinding.FragmentScannerBinding getBinding() {
        return null;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public android.view.View onCreateView(@org.jetbrains.annotations.NotNull()
    android.view.LayoutInflater inflater, @org.jetbrains.annotations.Nullable()
    android.view.ViewGroup container, @org.jetbrains.annotations.Nullable()
    android.os.Bundle savedInstanceState) {
        return null;
    }
    
    @java.lang.Override()
    public void onViewCreated(@org.jetbrains.annotations.NotNull()
    android.view.View view, @org.jetbrains.annotations.Nullable()
    android.os.Bundle savedInstanceState) {
    }
    
    private final void captureGps() {
    }
    
    @java.lang.Override()
    public void onTriggerPressed() {
    }
    
    @java.lang.Override()
    public void onTriggerReleased() {
    }
    
    private final void doSingleScan() {
    }
    
    private final void toggleAutoScan() {
    }
    
    private final void stopScan() {
    }
    
    private final void updateModeDisplay() {
    }
    
    private final void updateCountDisplay() {
    }
    
    private final void updateScanButton() {
    }
    
    private final void updateStats() {
    }
    
    private final void handleTagOnUiThread(java.lang.String epc, java.lang.String rssi) {
    }
    
    private final void decodeTag(java.lang.String epc) {
    }
    
    private final void decodeOffline(java.lang.String epc) {
    }
    
    private final void updateDecodeResult(java.lang.String epc, com.evergreen.rfid.model.DecodeResult decoded) {
    }
    
    private final void openLocator(java.lang.String epc) {
    }
    
    private final void takePhoto(java.lang.String epc) {
    }
    
    private final void saveSession() {
    }
    
    private final void showSummary() {
    }
    
    private final void showExportDialog() {
    }
    
    private final void updateCount() {
    }
    
    @java.lang.Override()
    public void onDestroyView() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0006"}, d2 = {"Lcom/evergreen/rfid/ui/ScannerFragment$Companion;", "", "()V", "MSG_TAG", "", "MSG_TIMER", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}
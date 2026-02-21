package com.evergreen.rfid.ui;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000x\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010!\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\n\u0018\u00002\u00020\u00012\u00020\u0002B\u0005\u00a2\u0006\u0002\u0010\u0003J\b\u0010\u001c\u001a\u00020\u001dH\u0002J\u0018\u0010\u001e\u001a\u00020\u001d2\u0006\u0010\u001f\u001a\u00020 2\u0006\u0010!\u001a\u00020 H\u0002J$\u0010\"\u001a\u00020#2\u0006\u0010$\u001a\u00020%2\b\u0010&\u001a\u0004\u0018\u00010\'2\b\u0010(\u001a\u0004\u0018\u00010)H\u0016J\b\u0010*\u001a\u00020\u001dH\u0016J\b\u0010+\u001a\u00020\u001dH\u0016J\b\u0010,\u001a\u00020\u001dH\u0016J\u001a\u0010-\u001a\u00020\u001d2\u0006\u0010.\u001a\u00020#2\b\u0010(\u001a\u0004\u0018\u00010)H\u0016J\b\u0010/\u001a\u00020\u001dH\u0002J\b\u00100\u001a\u00020\u001dH\u0002J\b\u00101\u001a\u00020\u001dH\u0002J\b\u00102\u001a\u00020\u001dH\u0002R\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082.\u00a2\u0006\u0002\n\u0000R\u0014\u0010\b\u001a\u00020\u00058BX\u0082\u0004\u00a2\u0006\u0006\u001a\u0004\b\t\u0010\nR\u000e\u0010\u000b\u001a\u00020\fX\u0082.\u00a2\u0006\u0002\n\u0000R\u0012\u0010\r\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0004\n\u0002\u0010\u000fR\u0012\u0010\u0010\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0004\n\u0002\u0010\u000fR\u000e\u0010\u0011\u001a\u00020\u0012X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0013\u001a\u00020\u0014X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0015\u001a\u0004\u0018\u00010\u0016X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00190\u0018X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u001a\u001a\u0004\u0018\u00010\u001bX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u00063"}, d2 = {"Lcom/evergreen/rfid/ui/TransferFragment;", "Landroidx/fragment/app/Fragment;", "Lcom/evergreen/rfid/TriggerListener;", "()V", "_binding", "Lcom/evergreen/rfid/databinding/FragmentTransferBinding;", "apiClient", "Lcom/evergreen/rfid/api/ApiClient;", "binding", "getBinding", "()Lcom/evergreen/rfid/databinding/FragmentTransferBinding;", "db", "Lcom/evergreen/rfid/db/AppDatabase;", "gpsLat", "", "Ljava/lang/Double;", "gpsLon", "handler", "Landroid/os/Handler;", "isScanning", "", "itemAdapter", "Lcom/evergreen/rfid/ui/TransferItemAdapter;", "scannedItems", "", "Lcom/evergreen/rfid/model/ScanResult;", "toneGenerator", "Landroid/media/ToneGenerator;", "captureGps", "", "handleTag", "epc", "", "rssi", "onCreateView", "Landroid/view/View;", "inflater", "Landroid/view/LayoutInflater;", "container", "Landroid/view/ViewGroup;", "savedInstanceState", "Landroid/os/Bundle;", "onDestroyView", "onTriggerPressed", "onTriggerReleased", "onViewCreated", "view", "stopScan", "submitTransfer", "toggleScan", "updateScanCount", "app_debug"})
public final class TransferFragment extends androidx.fragment.app.Fragment implements com.evergreen.rfid.TriggerListener {
    @org.jetbrains.annotations.Nullable()
    private com.evergreen.rfid.databinding.FragmentTransferBinding _binding;
    private com.evergreen.rfid.api.ApiClient apiClient;
    private com.evergreen.rfid.db.AppDatabase db;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.evergreen.rfid.model.ScanResult> scannedItems = null;
    @org.jetbrains.annotations.Nullable()
    private com.evergreen.rfid.ui.TransferItemAdapter itemAdapter;
    private boolean isScanning = false;
    @org.jetbrains.annotations.Nullable()
    private android.media.ToneGenerator toneGenerator;
    @org.jetbrains.annotations.NotNull()
    private final android.os.Handler handler = null;
    @org.jetbrains.annotations.Nullable()
    private java.lang.Double gpsLat;
    @org.jetbrains.annotations.Nullable()
    private java.lang.Double gpsLon;
    
    public TransferFragment() {
        super();
    }
    
    private final com.evergreen.rfid.databinding.FragmentTransferBinding getBinding() {
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
    
    private final void toggleScan() {
    }
    
    private final void stopScan() {
    }
    
    private final void handleTag(java.lang.String epc, java.lang.String rssi) {
    }
    
    private final void updateScanCount() {
    }
    
    private final void submitTransfer() {
    }
    
    @java.lang.Override()
    public void onTriggerPressed() {
    }
    
    @java.lang.Override()
    public void onTriggerReleased() {
    }
    
    @java.lang.Override()
    public void onDestroyView() {
    }
}
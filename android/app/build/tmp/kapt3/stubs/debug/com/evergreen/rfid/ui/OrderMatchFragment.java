package com.evergreen.rfid.ui;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0086\u0001\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010!\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010$\n\u0002\u0010\u0000\n\u0002\b\u0006\u0018\u00002\u00020\u00012\u00020\u0002:\u0001:B\u0005\u00a2\u0006\u0002\u0010\u0003J\u0018\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u00152\u0006\u0010\u001f\u001a\u00020\u0015H\u0002J\u0010\u0010 \u001a\u00020\u001d2\u0006\u0010!\u001a\u00020\"H\u0002J$\u0010#\u001a\u00020$2\u0006\u0010%\u001a\u00020&2\b\u0010\'\u001a\u0004\u0018\u00010(2\b\u0010)\u001a\u0004\u0018\u00010*H\u0016J\b\u0010+\u001a\u00020\u001dH\u0016J\b\u0010,\u001a\u00020\u001dH\u0016J\b\u0010-\u001a\u00020\u001dH\u0016J\u001a\u0010.\u001a\u00020\u001d2\u0006\u0010/\u001a\u00020$2\b\u0010)\u001a\u0004\u0018\u00010*H\u0016J\u0010\u00100\u001a\u00020\u001d2\u0006\u00101\u001a\u00020\u0015H\u0002J\u001e\u00102\u001a\u00020\u001d2\u0014\u00103\u001a\u0010\u0012\u0004\u0012\u00020\u0015\u0012\u0006\u0012\u0004\u0018\u00010504H\u0002J\b\u00106\u001a\u00020\u001dH\u0002J\b\u00107\u001a\u00020\u001dH\u0002J\b\u00108\u001a\u00020\u001dH\u0002J\b\u00109\u001a\u00020\u001dH\u0002R\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082.\u00a2\u0006\u0002\n\u0000R\u0014\u0010\b\u001a\u00020\u00058BX\u0082\u0004\u00a2\u0006\u0006\u001a\u0004\b\t\u0010\nR\u0014\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\r0\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u000fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0012\u001a\u0004\u0018\u00010\u0013X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0014\u001a\u0004\u0018\u00010\u0015X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0016\u001a\u0004\u0018\u00010\u0015X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00190\u0018X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u001a\u001a\u0004\u0018\u00010\u001bX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006;"}, d2 = {"Lcom/evergreen/rfid/ui/OrderMatchFragment;", "Landroidx/fragment/app/Fragment;", "Lcom/evergreen/rfid/TriggerListener;", "()V", "_binding", "Lcom/evergreen/rfid/databinding/FragmentOrderMatchBinding;", "apiClient", "Lcom/evergreen/rfid/api/ApiClient;", "binding", "getBinding", "()Lcom/evergreen/rfid/databinding/FragmentOrderMatchBinding;", "expectedItems", "", "Lcom/evergreen/rfid/ui/OrderMatchFragment$ExpectedItem;", "handler", "Landroid/os/Handler;", "isScanning", "", "matchAdapter", "Lcom/evergreen/rfid/ui/MatchAdapter;", "orderNumber", "", "orderType", "scannedResults", "", "Lcom/evergreen/rfid/model/ScanResult;", "toneGenerator", "Landroid/media/ToneGenerator;", "handleTag", "", "epc", "rssi", "matchDecodedItem", "decoded", "Lcom/evergreen/rfid/model/DecodeResult;", "onCreateView", "Landroid/view/View;", "inflater", "Landroid/view/LayoutInflater;", "container", "Landroid/view/ViewGroup;", "savedInstanceState", "Landroid/os/Bundle;", "onDestroyView", "onTriggerPressed", "onTriggerReleased", "onViewCreated", "view", "searchOrder", "query", "showOrder", "order", "", "", "stopScan", "submitMatch", "toggleScan", "updateMatchStatus", "ExpectedItem", "app_debug"})
public final class OrderMatchFragment extends androidx.fragment.app.Fragment implements com.evergreen.rfid.TriggerListener {
    @org.jetbrains.annotations.Nullable()
    private com.evergreen.rfid.databinding.FragmentOrderMatchBinding _binding;
    private com.evergreen.rfid.api.ApiClient apiClient;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String orderNumber;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String orderType;
    @org.jetbrains.annotations.NotNull()
    private java.util.List<com.evergreen.rfid.ui.OrderMatchFragment.ExpectedItem> expectedItems;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.evergreen.rfid.model.ScanResult> scannedResults = null;
    @org.jetbrains.annotations.Nullable()
    private com.evergreen.rfid.ui.MatchAdapter matchAdapter;
    private boolean isScanning = false;
    @org.jetbrains.annotations.Nullable()
    private android.media.ToneGenerator toneGenerator;
    @org.jetbrains.annotations.NotNull()
    private final android.os.Handler handler = null;
    
    public OrderMatchFragment() {
        super();
    }
    
    private final com.evergreen.rfid.databinding.FragmentOrderMatchBinding getBinding() {
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
    
    private final void searchOrder(java.lang.String query) {
    }
    
    @kotlin.Suppress(names = {"UNCHECKED_CAST"})
    private final void showOrder(java.util.Map<java.lang.String, ? extends java.lang.Object> order) {
    }
    
    private final void toggleScan() {
    }
    
    private final void stopScan() {
    }
    
    private final void handleTag(java.lang.String epc, java.lang.String rssi) {
    }
    
    private final void matchDecodedItem(com.evergreen.rfid.model.DecodeResult decoded) {
    }
    
    private final void updateMatchStatus() {
    }
    
    private final void submitMatch() {
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
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0010\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0086\b\u0018\u00002\u00020\u0001B\'\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\b\b\u0002\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\u0002\u0010\bJ\t\u0010\u0011\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0012\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0013\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\u0006H\u00c6\u0003J1\u0010\u0015\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\u0006H\u00c6\u0001J\u0013\u0010\u0016\u001a\u00020\u00172\b\u0010\u0018\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0019\u001a\u00020\u0006H\u00d6\u0001J\t\u0010\u001a\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\fR\u001a\u0010\u0007\u001a\u00020\u0006X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u000e\u0010\n\"\u0004\b\u000f\u0010\u0010\u00a8\u0006\u001b"}, d2 = {"Lcom/evergreen/rfid/ui/OrderMatchFragment$ExpectedItem;", "", "itemNumber", "", "itemName", "expectedQty", "", "scannedQty", "(Ljava/lang/String;Ljava/lang/String;II)V", "getExpectedQty", "()I", "getItemName", "()Ljava/lang/String;", "getItemNumber", "getScannedQty", "setScannedQty", "(I)V", "component1", "component2", "component3", "component4", "copy", "equals", "", "other", "hashCode", "toString", "app_debug"})
    public static final class ExpectedItem {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String itemNumber = null;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String itemName = null;
        private final int expectedQty = 0;
        private int scannedQty;
        
        public ExpectedItem(@org.jetbrains.annotations.NotNull()
        java.lang.String itemNumber, @org.jetbrains.annotations.NotNull()
        java.lang.String itemName, int expectedQty, int scannedQty) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getItemNumber() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getItemName() {
            return null;
        }
        
        public final int getExpectedQty() {
            return 0;
        }
        
        public final int getScannedQty() {
            return 0;
        }
        
        public final void setScannedQty(int p0) {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component2() {
            return null;
        }
        
        public final int component3() {
            return 0;
        }
        
        public final int component4() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.evergreen.rfid.ui.OrderMatchFragment.ExpectedItem copy(@org.jetbrains.annotations.NotNull()
        java.lang.String itemNumber, @org.jetbrains.annotations.NotNull()
        java.lang.String itemName, int expectedQty, int scannedQty) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
}
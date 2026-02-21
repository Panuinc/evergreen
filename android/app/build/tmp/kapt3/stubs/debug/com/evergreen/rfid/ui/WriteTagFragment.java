package com.evergreen.rfid.ui;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000X\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u000b\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J$\u0010\u0016\u001a\u00020\u00172\u0006\u0010\u0018\u001a\u00020\u00192\b\u0010\u001a\u001a\u0004\u0018\u00010\u001b2\b\u0010\u001c\u001a\u0004\u0018\u00010\u001dH\u0016J\b\u0010\u001e\u001a\u00020\u001fH\u0016J\u001a\u0010 \u001a\u00020\u001f2\u0006\u0010!\u001a\u00020\u00172\b\u0010\u001c\u001a\u0004\u0018\u00010\u001dH\u0016J\u0010\u0010\"\u001a\u00020\u001f2\u0006\u0010#\u001a\u00020\u0012H\u0002J \u0010$\u001a\u00020\u001f2\u0006\u0010%\u001a\u00020\u00122\u0006\u0010&\u001a\u00020\u00122\u0006\u0010\'\u001a\u00020\u0012H\u0002J\b\u0010(\u001a\u00020\u001fH\u0002J\b\u0010)\u001a\u00020\u001fH\u0002R\u0010\u0010\u0003\u001a\u0004\u0018\u00010\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082.\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u0007\u001a\u00020\u00048BX\u0082\u0004\u00a2\u0006\u0006\u001a\u0004\b\b\u0010\tR\u000e\u0010\n\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\rX\u0082.\u00a2\u0006\u0002\n\u0000R\u0014\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0011\u001a\u0004\u0018\u00010\u0012X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0013\u001a\u0004\u0018\u00010\u0012X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0012\u0010\u0014\u001a\u0004\u0018\u00010\u000bX\u0082\u000e\u00a2\u0006\u0004\n\u0002\u0010\u0015\u00a8\u0006*"}, d2 = {"Lcom/evergreen/rfid/ui/WriteTagFragment;", "Landroidx/fragment/app/Fragment;", "()V", "_binding", "Lcom/evergreen/rfid/databinding/FragmentWriteTagBinding;", "apiClient", "Lcom/evergreen/rfid/api/ApiClient;", "binding", "getBinding", "()Lcom/evergreen/rfid/databinding/FragmentWriteTagBinding;", "currentWriteIndex", "", "db", "Lcom/evergreen/rfid/db/AppDatabase;", "generatedEpcs", "", "Lcom/evergreen/rfid/util/EpcGenerator$EpcEntry;", "selectedItemName", "", "selectedItemNumber", "selectedRfidCode", "Ljava/lang/Integer;", "onCreateView", "Landroid/view/View;", "inflater", "Landroid/view/LayoutInflater;", "container", "Landroid/view/ViewGroup;", "savedInstanceState", "Landroid/os/Bundle;", "onDestroyView", "", "onViewCreated", "view", "searchItem", "query", "showItemInfo", "number", "name", "info", "startWrite", "updateEpcPreview", "app_debug"})
public final class WriteTagFragment extends androidx.fragment.app.Fragment {
    @org.jetbrains.annotations.Nullable()
    private com.evergreen.rfid.databinding.FragmentWriteTagBinding _binding;
    private com.evergreen.rfid.api.ApiClient apiClient;
    private com.evergreen.rfid.db.AppDatabase db;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String selectedItemNumber;
    @org.jetbrains.annotations.Nullable()
    private java.lang.Integer selectedRfidCode;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String selectedItemName;
    @org.jetbrains.annotations.NotNull()
    private java.util.List<com.evergreen.rfid.util.EpcGenerator.EpcEntry> generatedEpcs;
    private int currentWriteIndex = 0;
    
    public WriteTagFragment() {
        super();
    }
    
    private final com.evergreen.rfid.databinding.FragmentWriteTagBinding getBinding() {
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
    
    private final void searchItem(java.lang.String query) {
    }
    
    private final void showItemInfo(java.lang.String number, java.lang.String name, java.lang.String info) {
    }
    
    private final void updateEpcPreview() {
    }
    
    private final void startWrite() {
    }
    
    @java.lang.Override()
    public void onDestroyView() {
    }
}
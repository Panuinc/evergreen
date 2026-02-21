package com.evergreen.rfid.model;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0011\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001B3\u0012\b\b\u0002\u0010\u0002\u001a\u00020\u0003\u0012\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u0012\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\u0002\u0010\nJ\t\u0010\u0013\u001a\u00020\u0003H\u00c6\u0003J\u000b\u0010\u0014\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003J\u000b\u0010\u0015\u001a\u0004\u0018\u00010\u0007H\u00c6\u0003J\u000b\u0010\u0016\u001a\u0004\u0018\u00010\tH\u00c6\u0003J7\u0010\u0017\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u00052\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u00072\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\tH\u00c6\u0001J\u0013\u0010\u0018\u001a\u00020\u00032\b\u0010\u0019\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001a\u001a\u00020\u001bH\u00d6\u0001J\t\u0010\u001c\u001a\u00020\tH\u00d6\u0001R\u0013\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0013\u0010\u0006\u001a\u0004\u0018\u00010\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0013\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012\u00a8\u0006\u001d"}, d2 = {"Lcom/evergreen/rfid/model/DecodeResult;", "", "success", "", "decoded", "Lcom/evergreen/rfid/model/DecodedInfo;", "item", "Lcom/evergreen/rfid/model/Item;", "message", "", "(ZLcom/evergreen/rfid/model/DecodedInfo;Lcom/evergreen/rfid/model/Item;Ljava/lang/String;)V", "getDecoded", "()Lcom/evergreen/rfid/model/DecodedInfo;", "getItem", "()Lcom/evergreen/rfid/model/Item;", "getMessage", "()Ljava/lang/String;", "getSuccess", "()Z", "component1", "component2", "component3", "component4", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
public final class DecodeResult {
    private final boolean success = false;
    @org.jetbrains.annotations.Nullable()
    private final com.evergreen.rfid.model.DecodedInfo decoded = null;
    @org.jetbrains.annotations.Nullable()
    private final com.evergreen.rfid.model.Item item = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String message = null;
    
    public DecodeResult(boolean success, @org.jetbrains.annotations.Nullable()
    com.evergreen.rfid.model.DecodedInfo decoded, @org.jetbrains.annotations.Nullable()
    com.evergreen.rfid.model.Item item, @org.jetbrains.annotations.Nullable()
    java.lang.String message) {
        super();
    }
    
    public final boolean getSuccess() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.evergreen.rfid.model.DecodedInfo getDecoded() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.evergreen.rfid.model.Item getItem() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getMessage() {
        return null;
    }
    
    public DecodeResult() {
        super();
    }
    
    public final boolean component1() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.evergreen.rfid.model.DecodedInfo component2() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.evergreen.rfid.model.Item component3() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.evergreen.rfid.model.DecodeResult copy(boolean success, @org.jetbrains.annotations.Nullable()
    com.evergreen.rfid.model.DecodedInfo decoded, @org.jetbrains.annotations.Nullable()
    com.evergreen.rfid.model.Item item, @org.jetbrains.annotations.Nullable()
    java.lang.String message) {
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
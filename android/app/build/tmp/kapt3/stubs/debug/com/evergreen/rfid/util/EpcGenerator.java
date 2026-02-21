package com.evergreen.rfid.util;

/**
 * EPC generator — ported from src/lib/chainWay/epc.js
 * Generates 96-bit (24 hex chars) EPC tags
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0003\b\u00c6\u0002\u0018\u00002\u00020\u0001:\u0001\u000eB\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u001e\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\u00012\u0006\u0010\b\u001a\u00020\u00042\u0006\u0010\t\u001a\u00020\u0004J\u001c\u0010\n\u001a\b\u0012\u0004\u0012\u00020\f0\u000b2\u0006\u0010\u0007\u001a\u00020\u00012\u0006\u0010\r\u001a\u00020\u0004R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u000f"}, d2 = {"Lcom/evergreen/rfid/util/EpcGenerator;", "", "()V", "EPC_BYTES", "", "generate", "", "rfidCodeOrItemNumber", "sequenceNumber", "totalQuantity", "generateBatch", "", "Lcom/evergreen/rfid/util/EpcGenerator$EpcEntry;", "quantity", "EpcEntry", "app_debug"})
public final class EpcGenerator {
    private static final int EPC_BYTES = 12;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.util.EpcGenerator INSTANCE = null;
    
    private EpcGenerator() {
        super();
    }
    
    /**
     * Generate a single EPC hex string
     * @param rfidCodeOrItemNumber Either an Int rfidCode or String item number
     * @param sequenceNumber 1-based piece index
     * @param totalQuantity total pieces
     * @return 24-char hex EPC string
     */
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String generate(@org.jetbrains.annotations.NotNull()
    java.lang.Object rfidCodeOrItemNumber, int sequenceNumber, int totalQuantity) {
        return null;
    }
    
    /**
     * Generate batch of EPCs for an item
     */
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.evergreen.rfid.util.EpcGenerator.EpcEntry> generateBatch(@org.jetbrains.annotations.NotNull()
    java.lang.Object rfidCodeOrItemNumber, int quantity) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0002\b\u000f\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0086\b\u0018\u00002\u00020\u0001B%\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0005\u0012\u0006\u0010\u0007\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\bJ\t\u0010\u000f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0011\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0012\u001a\u00020\u0003H\u00c6\u0003J1\u0010\u0013\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00052\b\b\u0002\u0010\u0007\u001a\u00020\u0003H\u00c6\u0001J\u0013\u0010\u0014\u001a\u00020\u00152\b\u0010\u0016\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0017\u001a\u00020\u0005H\u00d6\u0001J\t\u0010\u0018\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0007\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\nR\u0011\u0010\u0006\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\f\u00a8\u0006\u0019"}, d2 = {"Lcom/evergreen/rfid/util/EpcGenerator$EpcEntry;", "", "epc", "", "sequenceNumber", "", "totalQuantity", "sequenceText", "(Ljava/lang/String;IILjava/lang/String;)V", "getEpc", "()Ljava/lang/String;", "getSequenceNumber", "()I", "getSequenceText", "getTotalQuantity", "component1", "component2", "component3", "component4", "copy", "equals", "", "other", "hashCode", "toString", "app_debug"})
    public static final class EpcEntry {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String epc = null;
        private final int sequenceNumber = 0;
        private final int totalQuantity = 0;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String sequenceText = null;
        
        public EpcEntry(@org.jetbrains.annotations.NotNull()
        java.lang.String epc, int sequenceNumber, int totalQuantity, @org.jetbrains.annotations.NotNull()
        java.lang.String sequenceText) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getEpc() {
            return null;
        }
        
        public final int getSequenceNumber() {
            return 0;
        }
        
        public final int getTotalQuantity() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getSequenceText() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        public final int component2() {
            return 0;
        }
        
        public final int component3() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component4() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.evergreen.rfid.util.EpcGenerator.EpcEntry copy(@org.jetbrains.annotations.NotNull()
        java.lang.String epc, int sequenceNumber, int totalQuantity, @org.jetbrains.annotations.NotNull()
        java.lang.String sequenceText) {
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
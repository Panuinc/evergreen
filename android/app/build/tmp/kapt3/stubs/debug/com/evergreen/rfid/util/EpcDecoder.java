package com.evergreen.rfid.util;

/**
 * Offline EPC decoder — ported from src/app/api/warehouse/rfid/decode/route.js
 * Decodes 24-char hex EPC → ASCII → parse ITEM_PART/SEQCHAR+TOTALCHAR → lookup from Room cache
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001:\u0001\fB\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u001e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\bH\u0086@\u00a2\u0006\u0002\u0010\tJ\u000e\u0010\n\u001a\u00020\u000b2\u0006\u0010\u0005\u001a\u00020\u0006\u00a8\u0006\r"}, d2 = {"Lcom/evergreen/rfid/util/EpcDecoder;", "", "()V", "decode", "Lcom/evergreen/rfid/model/DecodeResult;", "hex", "", "db", "Lcom/evergreen/rfid/db/AppDatabase;", "(Ljava/lang/String;Lcom/evergreen/rfid/db/AppDatabase;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "parseEpc", "Lcom/evergreen/rfid/util/EpcDecoder$ParsedEpc;", "ParsedEpc", "app_debug"})
public final class EpcDecoder {
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.util.EpcDecoder INSTANCE = null;
    
    private EpcDecoder() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.evergreen.rfid.util.EpcDecoder.ParsedEpc parseEpc(@org.jetbrains.annotations.NotNull()
    java.lang.String hex) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object decode(@org.jetbrains.annotations.NotNull()
    java.lang.String hex, @org.jetbrains.annotations.NotNull()
    com.evergreen.rfid.db.AppDatabase db, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.evergreen.rfid.model.DecodeResult> $completion) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0002\b\u0018\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0086\b\u0018\u00002\u00020\u0001BE\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u0012\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u0003\u0012\b\b\u0002\u0010\u0007\u001a\u00020\u0005\u0012\b\b\u0002\u0010\b\u001a\u00020\u0005\u0012\n\b\u0002\u0010\t\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\u0002\u0010\nJ\t\u0010\u0015\u001a\u00020\u0003H\u00c6\u0003J\u0010\u0010\u0016\u001a\u0004\u0018\u00010\u0005H\u00c6\u0003\u00a2\u0006\u0002\u0010\u0011J\u000b\u0010\u0017\u001a\u0004\u0018\u00010\u0003H\u00c6\u0003J\t\u0010\u0018\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0019\u001a\u00020\u0005H\u00c6\u0003J\u000b\u0010\u001a\u001a\u0004\u0018\u00010\u0003H\u00c6\u0003JP\u0010\u001b\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u00052\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u00032\b\b\u0002\u0010\u0007\u001a\u00020\u00052\b\b\u0002\u0010\b\u001a\u00020\u00052\n\b\u0002\u0010\t\u001a\u0004\u0018\u00010\u0003H\u00c6\u0001\u00a2\u0006\u0002\u0010\u001cJ\u0013\u0010\u001d\u001a\u00020\u001e2\b\u0010\u001f\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010 \u001a\u00020\u0005H\u00d6\u0001J\t\u0010!\u001a\u00020\u0003H\u00d6\u0001R\u0013\u0010\u0006\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0007\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0013\u0010\t\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\fR\u0015\u0010\u0004\u001a\u0004\u0018\u00010\u0005\u00a2\u0006\n\n\u0002\u0010\u0012\u001a\u0004\b\u0010\u0010\u0011R\u0011\u0010\b\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u000eR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\f\u00a8\u0006\""}, d2 = {"Lcom/evergreen/rfid/util/EpcDecoder$ParsedEpc;", "", "type", "", "rfidCode", "", "itemCompact", "pieceNumber", "totalPieces", "raw", "(Ljava/lang/String;Ljava/lang/Integer;Ljava/lang/String;IILjava/lang/String;)V", "getItemCompact", "()Ljava/lang/String;", "getPieceNumber", "()I", "getRaw", "getRfidCode", "()Ljava/lang/Integer;", "Ljava/lang/Integer;", "getTotalPieces", "getType", "component1", "component2", "component3", "component4", "component5", "component6", "copy", "(Ljava/lang/String;Ljava/lang/Integer;Ljava/lang/String;IILjava/lang/String;)Lcom/evergreen/rfid/util/EpcDecoder$ParsedEpc;", "equals", "", "other", "hashCode", "toString", "app_debug"})
    public static final class ParsedEpc {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String type = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.Integer rfidCode = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String itemCompact = null;
        private final int pieceNumber = 0;
        private final int totalPieces = 0;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String raw = null;
        
        public ParsedEpc(@org.jetbrains.annotations.NotNull()
        java.lang.String type, @org.jetbrains.annotations.Nullable()
        java.lang.Integer rfidCode, @org.jetbrains.annotations.Nullable()
        java.lang.String itemCompact, int pieceNumber, int totalPieces, @org.jetbrains.annotations.Nullable()
        java.lang.String raw) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getType() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Integer getRfidCode() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getItemCompact() {
            return null;
        }
        
        public final int getPieceNumber() {
            return 0;
        }
        
        public final int getTotalPieces() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getRaw() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.Integer component2() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component3() {
            return null;
        }
        
        public final int component4() {
            return 0;
        }
        
        public final int component5() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component6() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.evergreen.rfid.util.EpcDecoder.ParsedEpc copy(@org.jetbrains.annotations.NotNull()
        java.lang.String type, @org.jetbrains.annotations.Nullable()
        java.lang.Integer rfidCode, @org.jetbrains.annotations.Nullable()
        java.lang.String itemCompact, int pieceNumber, int totalPieces, @org.jetbrains.annotations.Nullable()
        java.lang.String raw) {
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
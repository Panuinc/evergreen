package com.evergreen.rfid.db.dao;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\b\u0004\bg\u0018\u00002\u00020\u0001J\u000e\u0010\u0002\u001a\u00020\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0004J\u0018\u0010\u0005\u001a\u0004\u0018\u00010\u00062\u0006\u0010\u0007\u001a\u00020\bH\u00a7@\u00a2\u0006\u0002\u0010\tJ\u0018\u0010\n\u001a\u0004\u0018\u00010\u00062\u0006\u0010\u000b\u001a\u00020\fH\u00a7@\u00a2\u0006\u0002\u0010\rJ\u000e\u0010\u000e\u001a\u00020\fH\u00a7@\u00a2\u0006\u0002\u0010\u0004J\u001c\u0010\u000f\u001a\u00020\u00032\f\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\u00060\u0011H\u00a7@\u00a2\u0006\u0002\u0010\u0012J\u0018\u0010\u0013\u001a\u0004\u0018\u00010\u00062\u0006\u0010\u0014\u001a\u00020\bH\u00a7@\u00a2\u0006\u0002\u0010\t\u00a8\u0006\u0015"}, d2 = {"Lcom/evergreen/rfid/db/dao/ItemDao;", "", "deleteAll", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getByNumber", "Lcom/evergreen/rfid/db/entity/CachedItem;", "number", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getByRfidCode", "rfidCode", "", "(ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getCount", "insertAll", "items", "", "(Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "searchByNumber", "pattern", "app_debug"})
@androidx.room.Dao()
public abstract interface ItemDao {
    
    @androidx.room.Insert(onConflict = 1)
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object insertAll(@org.jetbrains.annotations.NotNull()
    java.util.List<com.evergreen.rfid.db.entity.CachedItem> items, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    @androidx.room.Query(value = "SELECT * FROM cached_items WHERE rfidCode = :rfidCode LIMIT 1")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getByRfidCode(int rfidCode, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.evergreen.rfid.db.entity.CachedItem> $completion);
    
    @androidx.room.Query(value = "SELECT * FROM cached_items WHERE number = :number LIMIT 1")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getByNumber(@org.jetbrains.annotations.NotNull()
    java.lang.String number, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.evergreen.rfid.db.entity.CachedItem> $completion);
    
    @androidx.room.Query(value = "SELECT * FROM cached_items WHERE number LIKE :pattern LIMIT 1")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object searchByNumber(@org.jetbrains.annotations.NotNull()
    java.lang.String pattern, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super com.evergreen.rfid.db.entity.CachedItem> $completion);
    
    @androidx.room.Query(value = "SELECT COUNT(*) FROM cached_items")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getCount(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.lang.Integer> $completion);
    
    @androidx.room.Query(value = "DELETE FROM cached_items")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object deleteAll(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
}
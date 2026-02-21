package com.evergreen.rfid.db.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.evergreen.rfid.db.entity.CachedItem;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Integer;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class ItemDao_Impl implements ItemDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<CachedItem> __insertionAdapterOfCachedItem;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public ItemDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfCachedItem = new EntityInsertionAdapter<CachedItem>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `cached_items` (`number`,`displayName`,`type`,`inventory`,`baseUnitOfMeasure`,`unitPrice`,`unitCost`,`itemCategoryCode`,`rfidCode`,`cachedAt`) VALUES (?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CachedItem entity) {
        if (entity.getNumber() == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.getNumber());
        }
        if (entity.getDisplayName() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getDisplayName());
        }
        if (entity.getType() == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.getType());
        }
        statement.bindDouble(4, entity.getInventory());
        if (entity.getBaseUnitOfMeasure() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getBaseUnitOfMeasure());
        }
        statement.bindDouble(6, entity.getUnitPrice());
        statement.bindDouble(7, entity.getUnitCost());
        if (entity.getItemCategoryCode() == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.getItemCategoryCode());
        }
        if (entity.getRfidCode() == null) {
          statement.bindNull(9);
        } else {
          statement.bindLong(9, entity.getRfidCode());
        }
        statement.bindLong(10, entity.getCachedAt());
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM cached_items";
        return _query;
      }
    };
  }

  @Override
  public Object insertAll(final List<CachedItem> items,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfCachedItem.insert(items);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAll(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAll.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteAll.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object getByRfidCode(final int rfidCode,
      final Continuation<? super CachedItem> $completion) {
    final String _sql = "SELECT * FROM cached_items WHERE rfidCode = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, rfidCode);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<CachedItem>() {
      @Override
      @Nullable
      public CachedItem call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "number");
          final int _cursorIndexOfDisplayName = CursorUtil.getColumnIndexOrThrow(_cursor, "displayName");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfInventory = CursorUtil.getColumnIndexOrThrow(_cursor, "inventory");
          final int _cursorIndexOfBaseUnitOfMeasure = CursorUtil.getColumnIndexOrThrow(_cursor, "baseUnitOfMeasure");
          final int _cursorIndexOfUnitPrice = CursorUtil.getColumnIndexOrThrow(_cursor, "unitPrice");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfItemCategoryCode = CursorUtil.getColumnIndexOrThrow(_cursor, "itemCategoryCode");
          final int _cursorIndexOfRfidCode = CursorUtil.getColumnIndexOrThrow(_cursor, "rfidCode");
          final int _cursorIndexOfCachedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "cachedAt");
          final CachedItem _result;
          if (_cursor.moveToFirst()) {
            final String _tmpNumber;
            if (_cursor.isNull(_cursorIndexOfNumber)) {
              _tmpNumber = null;
            } else {
              _tmpNumber = _cursor.getString(_cursorIndexOfNumber);
            }
            final String _tmpDisplayName;
            if (_cursor.isNull(_cursorIndexOfDisplayName)) {
              _tmpDisplayName = null;
            } else {
              _tmpDisplayName = _cursor.getString(_cursorIndexOfDisplayName);
            }
            final String _tmpType;
            if (_cursor.isNull(_cursorIndexOfType)) {
              _tmpType = null;
            } else {
              _tmpType = _cursor.getString(_cursorIndexOfType);
            }
            final double _tmpInventory;
            _tmpInventory = _cursor.getDouble(_cursorIndexOfInventory);
            final String _tmpBaseUnitOfMeasure;
            if (_cursor.isNull(_cursorIndexOfBaseUnitOfMeasure)) {
              _tmpBaseUnitOfMeasure = null;
            } else {
              _tmpBaseUnitOfMeasure = _cursor.getString(_cursorIndexOfBaseUnitOfMeasure);
            }
            final double _tmpUnitPrice;
            _tmpUnitPrice = _cursor.getDouble(_cursorIndexOfUnitPrice);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final String _tmpItemCategoryCode;
            if (_cursor.isNull(_cursorIndexOfItemCategoryCode)) {
              _tmpItemCategoryCode = null;
            } else {
              _tmpItemCategoryCode = _cursor.getString(_cursorIndexOfItemCategoryCode);
            }
            final Integer _tmpRfidCode;
            if (_cursor.isNull(_cursorIndexOfRfidCode)) {
              _tmpRfidCode = null;
            } else {
              _tmpRfidCode = _cursor.getInt(_cursorIndexOfRfidCode);
            }
            final long _tmpCachedAt;
            _tmpCachedAt = _cursor.getLong(_cursorIndexOfCachedAt);
            _result = new CachedItem(_tmpNumber,_tmpDisplayName,_tmpType,_tmpInventory,_tmpBaseUnitOfMeasure,_tmpUnitPrice,_tmpUnitCost,_tmpItemCategoryCode,_tmpRfidCode,_tmpCachedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getByNumber(final String number,
      final Continuation<? super CachedItem> $completion) {
    final String _sql = "SELECT * FROM cached_items WHERE number = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (number == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, number);
    }
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<CachedItem>() {
      @Override
      @Nullable
      public CachedItem call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "number");
          final int _cursorIndexOfDisplayName = CursorUtil.getColumnIndexOrThrow(_cursor, "displayName");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfInventory = CursorUtil.getColumnIndexOrThrow(_cursor, "inventory");
          final int _cursorIndexOfBaseUnitOfMeasure = CursorUtil.getColumnIndexOrThrow(_cursor, "baseUnitOfMeasure");
          final int _cursorIndexOfUnitPrice = CursorUtil.getColumnIndexOrThrow(_cursor, "unitPrice");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfItemCategoryCode = CursorUtil.getColumnIndexOrThrow(_cursor, "itemCategoryCode");
          final int _cursorIndexOfRfidCode = CursorUtil.getColumnIndexOrThrow(_cursor, "rfidCode");
          final int _cursorIndexOfCachedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "cachedAt");
          final CachedItem _result;
          if (_cursor.moveToFirst()) {
            final String _tmpNumber;
            if (_cursor.isNull(_cursorIndexOfNumber)) {
              _tmpNumber = null;
            } else {
              _tmpNumber = _cursor.getString(_cursorIndexOfNumber);
            }
            final String _tmpDisplayName;
            if (_cursor.isNull(_cursorIndexOfDisplayName)) {
              _tmpDisplayName = null;
            } else {
              _tmpDisplayName = _cursor.getString(_cursorIndexOfDisplayName);
            }
            final String _tmpType;
            if (_cursor.isNull(_cursorIndexOfType)) {
              _tmpType = null;
            } else {
              _tmpType = _cursor.getString(_cursorIndexOfType);
            }
            final double _tmpInventory;
            _tmpInventory = _cursor.getDouble(_cursorIndexOfInventory);
            final String _tmpBaseUnitOfMeasure;
            if (_cursor.isNull(_cursorIndexOfBaseUnitOfMeasure)) {
              _tmpBaseUnitOfMeasure = null;
            } else {
              _tmpBaseUnitOfMeasure = _cursor.getString(_cursorIndexOfBaseUnitOfMeasure);
            }
            final double _tmpUnitPrice;
            _tmpUnitPrice = _cursor.getDouble(_cursorIndexOfUnitPrice);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final String _tmpItemCategoryCode;
            if (_cursor.isNull(_cursorIndexOfItemCategoryCode)) {
              _tmpItemCategoryCode = null;
            } else {
              _tmpItemCategoryCode = _cursor.getString(_cursorIndexOfItemCategoryCode);
            }
            final Integer _tmpRfidCode;
            if (_cursor.isNull(_cursorIndexOfRfidCode)) {
              _tmpRfidCode = null;
            } else {
              _tmpRfidCode = _cursor.getInt(_cursorIndexOfRfidCode);
            }
            final long _tmpCachedAt;
            _tmpCachedAt = _cursor.getLong(_cursorIndexOfCachedAt);
            _result = new CachedItem(_tmpNumber,_tmpDisplayName,_tmpType,_tmpInventory,_tmpBaseUnitOfMeasure,_tmpUnitPrice,_tmpUnitCost,_tmpItemCategoryCode,_tmpRfidCode,_tmpCachedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object searchByNumber(final String pattern,
      final Continuation<? super CachedItem> $completion) {
    final String _sql = "SELECT * FROM cached_items WHERE number LIKE ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (pattern == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, pattern);
    }
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<CachedItem>() {
      @Override
      @Nullable
      public CachedItem call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "number");
          final int _cursorIndexOfDisplayName = CursorUtil.getColumnIndexOrThrow(_cursor, "displayName");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfInventory = CursorUtil.getColumnIndexOrThrow(_cursor, "inventory");
          final int _cursorIndexOfBaseUnitOfMeasure = CursorUtil.getColumnIndexOrThrow(_cursor, "baseUnitOfMeasure");
          final int _cursorIndexOfUnitPrice = CursorUtil.getColumnIndexOrThrow(_cursor, "unitPrice");
          final int _cursorIndexOfUnitCost = CursorUtil.getColumnIndexOrThrow(_cursor, "unitCost");
          final int _cursorIndexOfItemCategoryCode = CursorUtil.getColumnIndexOrThrow(_cursor, "itemCategoryCode");
          final int _cursorIndexOfRfidCode = CursorUtil.getColumnIndexOrThrow(_cursor, "rfidCode");
          final int _cursorIndexOfCachedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "cachedAt");
          final CachedItem _result;
          if (_cursor.moveToFirst()) {
            final String _tmpNumber;
            if (_cursor.isNull(_cursorIndexOfNumber)) {
              _tmpNumber = null;
            } else {
              _tmpNumber = _cursor.getString(_cursorIndexOfNumber);
            }
            final String _tmpDisplayName;
            if (_cursor.isNull(_cursorIndexOfDisplayName)) {
              _tmpDisplayName = null;
            } else {
              _tmpDisplayName = _cursor.getString(_cursorIndexOfDisplayName);
            }
            final String _tmpType;
            if (_cursor.isNull(_cursorIndexOfType)) {
              _tmpType = null;
            } else {
              _tmpType = _cursor.getString(_cursorIndexOfType);
            }
            final double _tmpInventory;
            _tmpInventory = _cursor.getDouble(_cursorIndexOfInventory);
            final String _tmpBaseUnitOfMeasure;
            if (_cursor.isNull(_cursorIndexOfBaseUnitOfMeasure)) {
              _tmpBaseUnitOfMeasure = null;
            } else {
              _tmpBaseUnitOfMeasure = _cursor.getString(_cursorIndexOfBaseUnitOfMeasure);
            }
            final double _tmpUnitPrice;
            _tmpUnitPrice = _cursor.getDouble(_cursorIndexOfUnitPrice);
            final double _tmpUnitCost;
            _tmpUnitCost = _cursor.getDouble(_cursorIndexOfUnitCost);
            final String _tmpItemCategoryCode;
            if (_cursor.isNull(_cursorIndexOfItemCategoryCode)) {
              _tmpItemCategoryCode = null;
            } else {
              _tmpItemCategoryCode = _cursor.getString(_cursorIndexOfItemCategoryCode);
            }
            final Integer _tmpRfidCode;
            if (_cursor.isNull(_cursorIndexOfRfidCode)) {
              _tmpRfidCode = null;
            } else {
              _tmpRfidCode = _cursor.getInt(_cursorIndexOfRfidCode);
            }
            final long _tmpCachedAt;
            _tmpCachedAt = _cursor.getLong(_cursorIndexOfCachedAt);
            _result = new CachedItem(_tmpNumber,_tmpDisplayName,_tmpType,_tmpInventory,_tmpBaseUnitOfMeasure,_tmpUnitPrice,_tmpUnitCost,_tmpItemCategoryCode,_tmpRfidCode,_tmpCachedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getCount(final Continuation<? super Integer> $completion) {
    final String _sql = "SELECT COUNT(*) FROM cached_items";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<Integer>() {
      @Override
      @NonNull
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final Integer _tmp;
            if (_cursor.isNull(0)) {
              _tmp = null;
            } else {
              _tmp = _cursor.getInt(0);
            }
            _result = _tmp;
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}

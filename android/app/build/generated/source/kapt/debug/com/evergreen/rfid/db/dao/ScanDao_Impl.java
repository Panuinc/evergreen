package com.evergreen.rfid.db.dao;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.evergreen.rfid.db.entity.ScanRecordEntity;
import com.evergreen.rfid.db.entity.ScanSessionEntity;
import java.lang.Class;
import java.lang.Double;
import java.lang.Exception;
import java.lang.Integer;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class ScanDao_Impl implements ScanDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ScanSessionEntity> __insertionAdapterOfScanSessionEntity;

  private final EntityInsertionAdapter<ScanRecordEntity> __insertionAdapterOfScanRecordEntity;

  private final EntityDeletionOrUpdateAdapter<ScanSessionEntity> __updateAdapterOfScanSessionEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteSession;

  public ScanDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfScanSessionEntity = new EntityInsertionAdapter<ScanSessionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `scan_sessions` (`id`,`name`,`type`,`startTime`,`endTime`,`userId`,`gpsLat`,`gpsLon`,`tagCount`,`totalReads`,`synced`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ScanSessionEntity entity) {
        statement.bindLong(1, entity.getId());
        if (entity.getName() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getName());
        }
        if (entity.getType() == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.getType());
        }
        statement.bindLong(4, entity.getStartTime());
        if (entity.getEndTime() == null) {
          statement.bindNull(5);
        } else {
          statement.bindLong(5, entity.getEndTime());
        }
        if (entity.getUserId() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getUserId());
        }
        if (entity.getGpsLat() == null) {
          statement.bindNull(7);
        } else {
          statement.bindDouble(7, entity.getGpsLat());
        }
        if (entity.getGpsLon() == null) {
          statement.bindNull(8);
        } else {
          statement.bindDouble(8, entity.getGpsLon());
        }
        statement.bindLong(9, entity.getTagCount());
        statement.bindLong(10, entity.getTotalReads());
        final int _tmp = entity.getSynced() ? 1 : 0;
        statement.bindLong(11, _tmp);
      }
    };
    this.__insertionAdapterOfScanRecordEntity = new EntityInsertionAdapter<ScanRecordEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `scan_records` (`id`,`sessionId`,`epc`,`rssi`,`itemNumber`,`itemName`,`photoPath`,`readCount`,`scannedAt`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ScanRecordEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getSessionId());
        if (entity.getEpc() == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.getEpc());
        }
        if (entity.getRssi() == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.getRssi());
        }
        if (entity.getItemNumber() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getItemNumber());
        }
        if (entity.getItemName() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getItemName());
        }
        if (entity.getPhotoPath() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getPhotoPath());
        }
        statement.bindLong(8, entity.getReadCount());
        statement.bindLong(9, entity.getScannedAt());
      }
    };
    this.__updateAdapterOfScanSessionEntity = new EntityDeletionOrUpdateAdapter<ScanSessionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `scan_sessions` SET `id` = ?,`name` = ?,`type` = ?,`startTime` = ?,`endTime` = ?,`userId` = ?,`gpsLat` = ?,`gpsLon` = ?,`tagCount` = ?,`totalReads` = ?,`synced` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ScanSessionEntity entity) {
        statement.bindLong(1, entity.getId());
        if (entity.getName() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getName());
        }
        if (entity.getType() == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.getType());
        }
        statement.bindLong(4, entity.getStartTime());
        if (entity.getEndTime() == null) {
          statement.bindNull(5);
        } else {
          statement.bindLong(5, entity.getEndTime());
        }
        if (entity.getUserId() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getUserId());
        }
        if (entity.getGpsLat() == null) {
          statement.bindNull(7);
        } else {
          statement.bindDouble(7, entity.getGpsLat());
        }
        if (entity.getGpsLon() == null) {
          statement.bindNull(8);
        } else {
          statement.bindDouble(8, entity.getGpsLon());
        }
        statement.bindLong(9, entity.getTagCount());
        statement.bindLong(10, entity.getTotalReads());
        final int _tmp = entity.getSynced() ? 1 : 0;
        statement.bindLong(11, _tmp);
        statement.bindLong(12, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteSession = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM scan_sessions WHERE id = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertSession(final ScanSessionEntity session,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfScanSessionEntity.insertAndReturnId(session);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertRecord(final ScanRecordEntity record,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfScanRecordEntity.insert(record);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertRecords(final List<ScanRecordEntity> records,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfScanRecordEntity.insert(records);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateSession(final ScanSessionEntity session,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfScanSessionEntity.handle(session);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteSession(final long sessionId, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteSession.acquire();
        int _argIndex = 1;
        _stmt.bindLong(_argIndex, sessionId);
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
          __preparedStmtOfDeleteSession.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Object getAllSessions(final Continuation<? super List<ScanSessionEntity>> $completion) {
    final String _sql = "SELECT * FROM scan_sessions ORDER BY startTime DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<ScanSessionEntity>>() {
      @Override
      @NonNull
      public List<ScanSessionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfStartTime = CursorUtil.getColumnIndexOrThrow(_cursor, "startTime");
          final int _cursorIndexOfEndTime = CursorUtil.getColumnIndexOrThrow(_cursor, "endTime");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfGpsLat = CursorUtil.getColumnIndexOrThrow(_cursor, "gpsLat");
          final int _cursorIndexOfGpsLon = CursorUtil.getColumnIndexOrThrow(_cursor, "gpsLon");
          final int _cursorIndexOfTagCount = CursorUtil.getColumnIndexOrThrow(_cursor, "tagCount");
          final int _cursorIndexOfTotalReads = CursorUtil.getColumnIndexOrThrow(_cursor, "totalReads");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final List<ScanSessionEntity> _result = new ArrayList<ScanSessionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ScanSessionEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpName;
            if (_cursor.isNull(_cursorIndexOfName)) {
              _tmpName = null;
            } else {
              _tmpName = _cursor.getString(_cursorIndexOfName);
            }
            final String _tmpType;
            if (_cursor.isNull(_cursorIndexOfType)) {
              _tmpType = null;
            } else {
              _tmpType = _cursor.getString(_cursorIndexOfType);
            }
            final long _tmpStartTime;
            _tmpStartTime = _cursor.getLong(_cursorIndexOfStartTime);
            final Long _tmpEndTime;
            if (_cursor.isNull(_cursorIndexOfEndTime)) {
              _tmpEndTime = null;
            } else {
              _tmpEndTime = _cursor.getLong(_cursorIndexOfEndTime);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final Double _tmpGpsLat;
            if (_cursor.isNull(_cursorIndexOfGpsLat)) {
              _tmpGpsLat = null;
            } else {
              _tmpGpsLat = _cursor.getDouble(_cursorIndexOfGpsLat);
            }
            final Double _tmpGpsLon;
            if (_cursor.isNull(_cursorIndexOfGpsLon)) {
              _tmpGpsLon = null;
            } else {
              _tmpGpsLon = _cursor.getDouble(_cursorIndexOfGpsLon);
            }
            final int _tmpTagCount;
            _tmpTagCount = _cursor.getInt(_cursorIndexOfTagCount);
            final int _tmpTotalReads;
            _tmpTotalReads = _cursor.getInt(_cursorIndexOfTotalReads);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _item = new ScanSessionEntity(_tmpId,_tmpName,_tmpType,_tmpStartTime,_tmpEndTime,_tmpUserId,_tmpGpsLat,_tmpGpsLon,_tmpTagCount,_tmpTotalReads,_tmpSynced);
            _result.add(_item);
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
  public Object getSession(final long sessionId,
      final Continuation<? super ScanSessionEntity> $completion) {
    final String _sql = "SELECT * FROM scan_sessions WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, sessionId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<ScanSessionEntity>() {
      @Override
      @Nullable
      public ScanSessionEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfStartTime = CursorUtil.getColumnIndexOrThrow(_cursor, "startTime");
          final int _cursorIndexOfEndTime = CursorUtil.getColumnIndexOrThrow(_cursor, "endTime");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfGpsLat = CursorUtil.getColumnIndexOrThrow(_cursor, "gpsLat");
          final int _cursorIndexOfGpsLon = CursorUtil.getColumnIndexOrThrow(_cursor, "gpsLon");
          final int _cursorIndexOfTagCount = CursorUtil.getColumnIndexOrThrow(_cursor, "tagCount");
          final int _cursorIndexOfTotalReads = CursorUtil.getColumnIndexOrThrow(_cursor, "totalReads");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final ScanSessionEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpName;
            if (_cursor.isNull(_cursorIndexOfName)) {
              _tmpName = null;
            } else {
              _tmpName = _cursor.getString(_cursorIndexOfName);
            }
            final String _tmpType;
            if (_cursor.isNull(_cursorIndexOfType)) {
              _tmpType = null;
            } else {
              _tmpType = _cursor.getString(_cursorIndexOfType);
            }
            final long _tmpStartTime;
            _tmpStartTime = _cursor.getLong(_cursorIndexOfStartTime);
            final Long _tmpEndTime;
            if (_cursor.isNull(_cursorIndexOfEndTime)) {
              _tmpEndTime = null;
            } else {
              _tmpEndTime = _cursor.getLong(_cursorIndexOfEndTime);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final Double _tmpGpsLat;
            if (_cursor.isNull(_cursorIndexOfGpsLat)) {
              _tmpGpsLat = null;
            } else {
              _tmpGpsLat = _cursor.getDouble(_cursorIndexOfGpsLat);
            }
            final Double _tmpGpsLon;
            if (_cursor.isNull(_cursorIndexOfGpsLon)) {
              _tmpGpsLon = null;
            } else {
              _tmpGpsLon = _cursor.getDouble(_cursorIndexOfGpsLon);
            }
            final int _tmpTagCount;
            _tmpTagCount = _cursor.getInt(_cursorIndexOfTagCount);
            final int _tmpTotalReads;
            _tmpTotalReads = _cursor.getInt(_cursorIndexOfTotalReads);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _result = new ScanSessionEntity(_tmpId,_tmpName,_tmpType,_tmpStartTime,_tmpEndTime,_tmpUserId,_tmpGpsLat,_tmpGpsLon,_tmpTagCount,_tmpTotalReads,_tmpSynced);
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
  public Object getRecordsBySession(final long sessionId,
      final Continuation<? super List<ScanRecordEntity>> $completion) {
    final String _sql = "SELECT * FROM scan_records WHERE sessionId = ? ORDER BY scannedAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, sessionId);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<ScanRecordEntity>>() {
      @Override
      @NonNull
      public List<ScanRecordEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "sessionId");
          final int _cursorIndexOfEpc = CursorUtil.getColumnIndexOrThrow(_cursor, "epc");
          final int _cursorIndexOfRssi = CursorUtil.getColumnIndexOrThrow(_cursor, "rssi");
          final int _cursorIndexOfItemNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "itemNumber");
          final int _cursorIndexOfItemName = CursorUtil.getColumnIndexOrThrow(_cursor, "itemName");
          final int _cursorIndexOfPhotoPath = CursorUtil.getColumnIndexOrThrow(_cursor, "photoPath");
          final int _cursorIndexOfReadCount = CursorUtil.getColumnIndexOrThrow(_cursor, "readCount");
          final int _cursorIndexOfScannedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "scannedAt");
          final List<ScanRecordEntity> _result = new ArrayList<ScanRecordEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ScanRecordEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpSessionId;
            _tmpSessionId = _cursor.getLong(_cursorIndexOfSessionId);
            final String _tmpEpc;
            if (_cursor.isNull(_cursorIndexOfEpc)) {
              _tmpEpc = null;
            } else {
              _tmpEpc = _cursor.getString(_cursorIndexOfEpc);
            }
            final String _tmpRssi;
            if (_cursor.isNull(_cursorIndexOfRssi)) {
              _tmpRssi = null;
            } else {
              _tmpRssi = _cursor.getString(_cursorIndexOfRssi);
            }
            final String _tmpItemNumber;
            if (_cursor.isNull(_cursorIndexOfItemNumber)) {
              _tmpItemNumber = null;
            } else {
              _tmpItemNumber = _cursor.getString(_cursorIndexOfItemNumber);
            }
            final String _tmpItemName;
            if (_cursor.isNull(_cursorIndexOfItemName)) {
              _tmpItemName = null;
            } else {
              _tmpItemName = _cursor.getString(_cursorIndexOfItemName);
            }
            final String _tmpPhotoPath;
            if (_cursor.isNull(_cursorIndexOfPhotoPath)) {
              _tmpPhotoPath = null;
            } else {
              _tmpPhotoPath = _cursor.getString(_cursorIndexOfPhotoPath);
            }
            final int _tmpReadCount;
            _tmpReadCount = _cursor.getInt(_cursorIndexOfReadCount);
            final long _tmpScannedAt;
            _tmpScannedAt = _cursor.getLong(_cursorIndexOfScannedAt);
            _item = new ScanRecordEntity(_tmpId,_tmpSessionId,_tmpEpc,_tmpRssi,_tmpItemNumber,_tmpItemName,_tmpPhotoPath,_tmpReadCount,_tmpScannedAt);
            _result.add(_item);
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
  public Object getUnsyncedSessions(
      final Continuation<? super List<ScanSessionEntity>> $completion) {
    final String _sql = "SELECT * FROM scan_sessions WHERE synced = 0 ORDER BY startTime DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<ScanSessionEntity>>() {
      @Override
      @NonNull
      public List<ScanSessionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfStartTime = CursorUtil.getColumnIndexOrThrow(_cursor, "startTime");
          final int _cursorIndexOfEndTime = CursorUtil.getColumnIndexOrThrow(_cursor, "endTime");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfGpsLat = CursorUtil.getColumnIndexOrThrow(_cursor, "gpsLat");
          final int _cursorIndexOfGpsLon = CursorUtil.getColumnIndexOrThrow(_cursor, "gpsLon");
          final int _cursorIndexOfTagCount = CursorUtil.getColumnIndexOrThrow(_cursor, "tagCount");
          final int _cursorIndexOfTotalReads = CursorUtil.getColumnIndexOrThrow(_cursor, "totalReads");
          final int _cursorIndexOfSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "synced");
          final List<ScanSessionEntity> _result = new ArrayList<ScanSessionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ScanSessionEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpName;
            if (_cursor.isNull(_cursorIndexOfName)) {
              _tmpName = null;
            } else {
              _tmpName = _cursor.getString(_cursorIndexOfName);
            }
            final String _tmpType;
            if (_cursor.isNull(_cursorIndexOfType)) {
              _tmpType = null;
            } else {
              _tmpType = _cursor.getString(_cursorIndexOfType);
            }
            final long _tmpStartTime;
            _tmpStartTime = _cursor.getLong(_cursorIndexOfStartTime);
            final Long _tmpEndTime;
            if (_cursor.isNull(_cursorIndexOfEndTime)) {
              _tmpEndTime = null;
            } else {
              _tmpEndTime = _cursor.getLong(_cursorIndexOfEndTime);
            }
            final String _tmpUserId;
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _tmpUserId = null;
            } else {
              _tmpUserId = _cursor.getString(_cursorIndexOfUserId);
            }
            final Double _tmpGpsLat;
            if (_cursor.isNull(_cursorIndexOfGpsLat)) {
              _tmpGpsLat = null;
            } else {
              _tmpGpsLat = _cursor.getDouble(_cursorIndexOfGpsLat);
            }
            final Double _tmpGpsLon;
            if (_cursor.isNull(_cursorIndexOfGpsLon)) {
              _tmpGpsLon = null;
            } else {
              _tmpGpsLon = _cursor.getDouble(_cursorIndexOfGpsLon);
            }
            final int _tmpTagCount;
            _tmpTagCount = _cursor.getInt(_cursorIndexOfTagCount);
            final int _tmpTotalReads;
            _tmpTotalReads = _cursor.getInt(_cursorIndexOfTotalReads);
            final boolean _tmpSynced;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfSynced);
            _tmpSynced = _tmp != 0;
            _item = new ScanSessionEntity(_tmpId,_tmpName,_tmpType,_tmpStartTime,_tmpEndTime,_tmpUserId,_tmpGpsLat,_tmpGpsLon,_tmpTagCount,_tmpTotalReads,_tmpSynced);
            _result.add(_item);
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
  public Object getSessionCount(final Continuation<? super Integer> $completion) {
    final String _sql = "SELECT COUNT(*) FROM scan_sessions";
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

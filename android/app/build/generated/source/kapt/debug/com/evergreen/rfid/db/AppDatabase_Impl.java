package com.evergreen.rfid.db;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.evergreen.rfid.db.dao.ItemDao;
import com.evergreen.rfid.db.dao.ItemDao_Impl;
import com.evergreen.rfid.db.dao.ScanDao;
import com.evergreen.rfid.db.dao.ScanDao_Impl;
import com.evergreen.rfid.db.dao.SyncDao;
import com.evergreen.rfid.db.dao.SyncDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class AppDatabase_Impl extends AppDatabase {
  private volatile ItemDao _itemDao;

  private volatile ScanDao _scanDao;

  private volatile SyncDao _syncDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `cached_items` (`number` TEXT NOT NULL, `displayName` TEXT NOT NULL, `type` TEXT NOT NULL, `inventory` REAL NOT NULL, `baseUnitOfMeasure` TEXT NOT NULL, `unitPrice` REAL NOT NULL, `unitCost` REAL NOT NULL, `itemCategoryCode` TEXT NOT NULL, `rfidCode` INTEGER, `cachedAt` INTEGER NOT NULL, PRIMARY KEY(`number`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `scan_sessions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `name` TEXT NOT NULL, `type` TEXT NOT NULL, `startTime` INTEGER NOT NULL, `endTime` INTEGER, `userId` TEXT NOT NULL, `gpsLat` REAL, `gpsLon` REAL, `tagCount` INTEGER NOT NULL, `totalReads` INTEGER NOT NULL, `synced` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `scan_records` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `sessionId` INTEGER NOT NULL, `epc` TEXT NOT NULL, `rssi` TEXT NOT NULL, `itemNumber` TEXT, `itemName` TEXT, `photoPath` TEXT, `readCount` INTEGER NOT NULL, `scannedAt` INTEGER NOT NULL, FOREIGN KEY(`sessionId`) REFERENCES `scan_sessions`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE )");
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_scan_records_sessionId` ON `scan_records` (`sessionId`)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `pending_requests` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `type` TEXT NOT NULL, `jsonPayload` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, `status` TEXT NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '3557658cb8b7c999069bbda13ab691b7')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `cached_items`");
        db.execSQL("DROP TABLE IF EXISTS `scan_sessions`");
        db.execSQL("DROP TABLE IF EXISTS `scan_records`");
        db.execSQL("DROP TABLE IF EXISTS `pending_requests`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        db.execSQL("PRAGMA foreign_keys = ON");
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsCachedItems = new HashMap<String, TableInfo.Column>(10);
        _columnsCachedItems.put("number", new TableInfo.Column("number", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("displayName", new TableInfo.Column("displayName", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("type", new TableInfo.Column("type", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("inventory", new TableInfo.Column("inventory", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("baseUnitOfMeasure", new TableInfo.Column("baseUnitOfMeasure", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("unitPrice", new TableInfo.Column("unitPrice", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("unitCost", new TableInfo.Column("unitCost", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("itemCategoryCode", new TableInfo.Column("itemCategoryCode", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("rfidCode", new TableInfo.Column("rfidCode", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsCachedItems.put("cachedAt", new TableInfo.Column("cachedAt", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysCachedItems = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesCachedItems = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoCachedItems = new TableInfo("cached_items", _columnsCachedItems, _foreignKeysCachedItems, _indicesCachedItems);
        final TableInfo _existingCachedItems = TableInfo.read(db, "cached_items");
        if (!_infoCachedItems.equals(_existingCachedItems)) {
          return new RoomOpenHelper.ValidationResult(false, "cached_items(com.evergreen.rfid.db.entity.CachedItem).\n"
                  + " Expected:\n" + _infoCachedItems + "\n"
                  + " Found:\n" + _existingCachedItems);
        }
        final HashMap<String, TableInfo.Column> _columnsScanSessions = new HashMap<String, TableInfo.Column>(11);
        _columnsScanSessions.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("name", new TableInfo.Column("name", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("type", new TableInfo.Column("type", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("startTime", new TableInfo.Column("startTime", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("endTime", new TableInfo.Column("endTime", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("userId", new TableInfo.Column("userId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("gpsLat", new TableInfo.Column("gpsLat", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("gpsLon", new TableInfo.Column("gpsLon", "REAL", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("tagCount", new TableInfo.Column("tagCount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("totalReads", new TableInfo.Column("totalReads", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanSessions.put("synced", new TableInfo.Column("synced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysScanSessions = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesScanSessions = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoScanSessions = new TableInfo("scan_sessions", _columnsScanSessions, _foreignKeysScanSessions, _indicesScanSessions);
        final TableInfo _existingScanSessions = TableInfo.read(db, "scan_sessions");
        if (!_infoScanSessions.equals(_existingScanSessions)) {
          return new RoomOpenHelper.ValidationResult(false, "scan_sessions(com.evergreen.rfid.db.entity.ScanSessionEntity).\n"
                  + " Expected:\n" + _infoScanSessions + "\n"
                  + " Found:\n" + _existingScanSessions);
        }
        final HashMap<String, TableInfo.Column> _columnsScanRecords = new HashMap<String, TableInfo.Column>(9);
        _columnsScanRecords.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("sessionId", new TableInfo.Column("sessionId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("epc", new TableInfo.Column("epc", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("rssi", new TableInfo.Column("rssi", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("itemNumber", new TableInfo.Column("itemNumber", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("itemName", new TableInfo.Column("itemName", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("photoPath", new TableInfo.Column("photoPath", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("readCount", new TableInfo.Column("readCount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsScanRecords.put("scannedAt", new TableInfo.Column("scannedAt", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysScanRecords = new HashSet<TableInfo.ForeignKey>(1);
        _foreignKeysScanRecords.add(new TableInfo.ForeignKey("scan_sessions", "CASCADE", "NO ACTION", Arrays.asList("sessionId"), Arrays.asList("id")));
        final HashSet<TableInfo.Index> _indicesScanRecords = new HashSet<TableInfo.Index>(1);
        _indicesScanRecords.add(new TableInfo.Index("index_scan_records_sessionId", false, Arrays.asList("sessionId"), Arrays.asList("ASC")));
        final TableInfo _infoScanRecords = new TableInfo("scan_records", _columnsScanRecords, _foreignKeysScanRecords, _indicesScanRecords);
        final TableInfo _existingScanRecords = TableInfo.read(db, "scan_records");
        if (!_infoScanRecords.equals(_existingScanRecords)) {
          return new RoomOpenHelper.ValidationResult(false, "scan_records(com.evergreen.rfid.db.entity.ScanRecordEntity).\n"
                  + " Expected:\n" + _infoScanRecords + "\n"
                  + " Found:\n" + _existingScanRecords);
        }
        final HashMap<String, TableInfo.Column> _columnsPendingRequests = new HashMap<String, TableInfo.Column>(5);
        _columnsPendingRequests.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingRequests.put("type", new TableInfo.Column("type", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingRequests.put("jsonPayload", new TableInfo.Column("jsonPayload", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingRequests.put("createdAt", new TableInfo.Column("createdAt", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingRequests.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPendingRequests = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPendingRequests = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPendingRequests = new TableInfo("pending_requests", _columnsPendingRequests, _foreignKeysPendingRequests, _indicesPendingRequests);
        final TableInfo _existingPendingRequests = TableInfo.read(db, "pending_requests");
        if (!_infoPendingRequests.equals(_existingPendingRequests)) {
          return new RoomOpenHelper.ValidationResult(false, "pending_requests(com.evergreen.rfid.db.entity.PendingRequest).\n"
                  + " Expected:\n" + _infoPendingRequests + "\n"
                  + " Found:\n" + _existingPendingRequests);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "3557658cb8b7c999069bbda13ab691b7", "c8921bd6319f33c5e0524b8e55c5819c");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "cached_items","scan_sessions","scan_records","pending_requests");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    final boolean _supportsDeferForeignKeys = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP;
    try {
      if (!_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA foreign_keys = FALSE");
      }
      super.beginTransaction();
      if (_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA defer_foreign_keys = TRUE");
      }
      _db.execSQL("DELETE FROM `cached_items`");
      _db.execSQL("DELETE FROM `scan_sessions`");
      _db.execSQL("DELETE FROM `scan_records`");
      _db.execSQL("DELETE FROM `pending_requests`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      if (!_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA foreign_keys = TRUE");
      }
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(ItemDao.class, ItemDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ScanDao.class, ScanDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SyncDao.class, SyncDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public ItemDao itemDao() {
    if (_itemDao != null) {
      return _itemDao;
    } else {
      synchronized(this) {
        if(_itemDao == null) {
          _itemDao = new ItemDao_Impl(this);
        }
        return _itemDao;
      }
    }
  }

  @Override
  public ScanDao scanDao() {
    if (_scanDao != null) {
      return _scanDao;
    } else {
      synchronized(this) {
        if(_scanDao == null) {
          _scanDao = new ScanDao_Impl(this);
        }
        return _scanDao;
      }
    }
  }

  @Override
  public SyncDao syncDao() {
    if (_syncDao != null) {
      return _syncDao;
    } else {
      synchronized(this) {
        if(_syncDao == null) {
          _syncDao = new SyncDao_Impl(this);
        }
        return _syncDao;
      }
    }
  }
}

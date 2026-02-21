package com.evergreen.rfid.util;

/**
 * Downloads APK via DownloadManager and triggers install
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u001e\u0010\u0007\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\u00042\u0006\u0010\f\u001a\u00020\u0004J\u0018\u0010\r\u001a\u00020\b2\u0006\u0010\t\u001a\u00020\n2\u0006\u0010\u000e\u001a\u00020\u000fH\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0010"}, d2 = {"Lcom/evergreen/rfid/util/ApkDownloader;", "", "()V", "TAG", "", "downloadId", "", "download", "", "activity", "Landroid/app/Activity;", "url", "versionName", "installApk", "file", "Ljava/io/File;", "app_debug"})
public final class ApkDownloader {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "ApkDownloader";
    private static long downloadId = -1L;
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.util.ApkDownloader INSTANCE = null;
    
    private ApkDownloader() {
        super();
    }
    
    public final void download(@org.jetbrains.annotations.NotNull()
    android.app.Activity activity, @org.jetbrains.annotations.NotNull()
    java.lang.String url, @org.jetbrains.annotations.NotNull()
    java.lang.String versionName) {
    }
    
    private final void installApk(android.app.Activity activity, java.io.File file) {
    }
}
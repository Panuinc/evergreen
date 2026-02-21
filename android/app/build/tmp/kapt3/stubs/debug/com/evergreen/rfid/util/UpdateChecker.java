package com.evergreen.rfid.util;

/**
 * Checks for app updates from /api/warehouse/app-version
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001:\u0001\fB\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\bJ\u0018\u0010\t\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\b2\u0006\u0010\n\u001a\u00020\u000bH\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\r"}, d2 = {"Lcom/evergreen/rfid/util/UpdateChecker;", "", "()V", "TAG", "", "check", "", "activity", "Landroid/app/Activity;", "showUpdateDialog", "version", "Lcom/evergreen/rfid/util/UpdateChecker$AppVersion;", "AppVersion", "app_debug"})
public final class UpdateChecker {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "UpdateChecker";
    @org.jetbrains.annotations.NotNull()
    public static final com.evergreen.rfid.util.UpdateChecker INSTANCE = null;
    
    private UpdateChecker() {
        super();
    }
    
    public final void check(@org.jetbrains.annotations.NotNull()
    android.app.Activity activity) {
    }
    
    private final void showUpdateDialog(android.app.Activity activity, com.evergreen.rfid.util.UpdateChecker.AppVersion version) {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0015\b\u0086\b\u0018\u00002\u00020\u0001BG\u0012\n\b\u0002\u0010\u0002\u001a\u0004\u0018\u00010\u0003\u0012\b\b\u0002\u0010\u0004\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0005\u001a\u00020\u0006\u0012\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u0003\u0012\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\u0003\u0012\b\b\u0002\u0010\t\u001a\u00020\n\u00a2\u0006\u0002\u0010\u000bJ\u000b\u0010\u0014\u001a\u0004\u0018\u00010\u0003H\u00c6\u0003J\t\u0010\u0015\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\u0006H\u00c6\u0003J\u000b\u0010\u0017\u001a\u0004\u0018\u00010\u0003H\u00c6\u0003J\u000b\u0010\u0018\u001a\u0004\u0018\u00010\u0003H\u00c6\u0003J\t\u0010\u0019\u001a\u00020\nH\u00c6\u0003JK\u0010\u001a\u001a\u00020\u00002\n\b\u0002\u0010\u0002\u001a\u0004\u0018\u00010\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00032\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\u00032\b\b\u0002\u0010\t\u001a\u00020\nH\u00c6\u0001J\u0013\u0010\u001b\u001a\u00020\n2\b\u0010\u001c\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001d\u001a\u00020\u0006H\u00d6\u0001J\t\u0010\u001e\u001a\u00020\u0003H\u00d6\u0001R\u0013\u0010\u0007\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u0013\u0010\u0002\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\rR\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\u000fR\u0013\u0010\b\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\rR\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\r\u00a8\u0006\u001f"}, d2 = {"Lcom/evergreen/rfid/util/UpdateChecker$AppVersion;", "", "id", "", "version_name", "version_code", "", "apk_url", "release_notes", "is_mandatory", "", "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/lang/String;Z)V", "getApk_url", "()Ljava/lang/String;", "getId", "()Z", "getRelease_notes", "getVersion_code", "()I", "getVersion_name", "component1", "component2", "component3", "component4", "component5", "component6", "copy", "equals", "other", "hashCode", "toString", "app_debug"})
    public static final class AppVersion {
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String id = null;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String version_name = null;
        private final int version_code = 0;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String apk_url = null;
        @org.jetbrains.annotations.Nullable()
        private final java.lang.String release_notes = null;
        private final boolean is_mandatory = false;
        
        public AppVersion(@org.jetbrains.annotations.Nullable()
        java.lang.String id, @org.jetbrains.annotations.NotNull()
        java.lang.String version_name, int version_code, @org.jetbrains.annotations.Nullable()
        java.lang.String apk_url, @org.jetbrains.annotations.Nullable()
        java.lang.String release_notes, boolean is_mandatory) {
            super();
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getId() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getVersion_name() {
            return null;
        }
        
        public final int getVersion_code() {
            return 0;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getApk_url() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String getRelease_notes() {
            return null;
        }
        
        public final boolean is_mandatory() {
            return false;
        }
        
        public AppVersion() {
            super();
        }
        
        @org.jetbrains.annotations.Nullable()
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
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component4() {
            return null;
        }
        
        @org.jetbrains.annotations.Nullable()
        public final java.lang.String component5() {
            return null;
        }
        
        public final boolean component6() {
            return false;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.evergreen.rfid.util.UpdateChecker.AppVersion copy(@org.jetbrains.annotations.Nullable()
        java.lang.String id, @org.jetbrains.annotations.NotNull()
        java.lang.String version_name, int version_code, @org.jetbrains.annotations.Nullable()
        java.lang.String apk_url, @org.jetbrains.annotations.Nullable()
        java.lang.String release_notes, boolean is_mandatory) {
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
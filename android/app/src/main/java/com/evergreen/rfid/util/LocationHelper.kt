package com.evergreen.rfid.util

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

class LocationHelper(context: Context) {
    companion object {
        private const val TAG = "LocationHelper"
    }

    private val fusedClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)
    private val appContext = context.applicationContext

    fun getLastLocation(callback: (lat: Double?, lon: Double?) -> Unit) {
        if (ActivityCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
            && ActivityCompat.checkSelfPermission(appContext, Manifest.permission.ACCESS_COARSE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Log.w(TAG, "Location permission not granted")
            callback(null, null)
            return
        }

        fusedClient.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
            .addOnSuccessListener { location ->
                if (location != null) {
                    callback(location.latitude, location.longitude)
                } else {
                    // Fallback to last known
                    fusedClient.lastLocation.addOnSuccessListener { last ->
                        callback(last?.latitude, last?.longitude)
                    }.addOnFailureListener {
                        callback(null, null)
                    }
                }
            }
            .addOnFailureListener {
                Log.e(TAG, "Location error: ${it.message}")
                callback(null, null)
            }
    }
}

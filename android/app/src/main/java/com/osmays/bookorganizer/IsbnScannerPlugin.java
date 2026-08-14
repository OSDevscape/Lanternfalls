package com.osmays.bookorganizer;

import android.app.Activity;
import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "IsbnScanner")
public class IsbnScannerPlugin extends Plugin {

    @PluginMethod
    public void scan(PluginCall call) {
        Intent intent = new Intent(getActivity(), IsbnScannerActivity.class);
        startActivityForResult(call, intent, "handleScanResult");
    }

    @ActivityCallback
    private void handleScanResult(PluginCall call, ActivityResult activityResult) {
        if (call == null) {
            return;
        }

        if (activityResult.getResultCode() != Activity.RESULT_OK
                || activityResult.getData() == null) {
            call.reject("SCAN_CANCELLED", "The ISBN scan was cancelled.");
            return;
        }

        String isbn = activityResult
                .getData()
                .getStringExtra(IsbnScannerActivity.EXTRA_ISBN);

        if (isbn == null || isbn.trim().isEmpty()) {
            call.reject("NO_ISBN_FOUND", "No valid ISBN barcode was found.");
            return;
        }

        JSObject result = new JSObject();
        result.put("isbn", isbn);
        call.resolve(result);
    }
}
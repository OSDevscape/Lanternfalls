package com.osdevscape.readquest;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetRefresh")
public class WidgetRefreshPlugin extends Plugin {

    private static final String ACTION_WIDGET_PINNED =
    "com.osdevscape.readquest.widget.PINNED";

    @PluginMethod
    public void refresh(PluginCall call) {
        ReadingWidgetProvider.refresh(getContext());
        call.resolve();
    }

    @PluginMethod
    public void requestPinWidget(PluginCall call) {
        JSObject result = new JSObject();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            result.put("supported", false);
            result.put("requested", false);
            result.put("reason", "Direct widget adding requires Android 8.0 or newer.");
            call.resolve(result);
            return;
        }

        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        if (!manager.isRequestPinAppWidgetSupported()) {
            result.put("supported", false);
            result.put("requested", false);
            result.put("reason", "Your current home-screen launcher does not support adding widgets directly from an app.");
            call.resolve(result);
            return;
        }

        Intent callbackIntent = new Intent(getContext(), ReadingWidgetProvider.class);
        callbackIntent.setAction(ACTION_WIDGET_PINNED);
        PendingIntent callback = PendingIntent.getBroadcast(
            getContext(),
            4107,
            callbackIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        boolean requested = manager.requestPinAppWidget(
            new ComponentName(getContext(), ReadingWidgetProvider.class),
            null,
            callback
        );

        result.put("supported", true);
        result.put("requested", requested);
        if (!requested) {
            result.put("reason", "Android did not open the widget-placement prompt.");
        }
        call.resolve(result);
    }
}
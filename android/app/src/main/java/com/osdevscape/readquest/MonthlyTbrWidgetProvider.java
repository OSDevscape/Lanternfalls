package com.osdevscape.readquest;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.text.DateFormatSymbols;
import java.util.Calendar;

public class MonthlyTbrWidgetProvider extends AppWidgetProvider {
    private static final String TBR_FILE = "monthly-tbr-widget.json";
    private static final String APPEARANCE_FILE =
        "reading-widget-appearance.json";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            render(context, manager, id);
        }
    }

    public static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] ids = manager.getAppWidgetIds(
            new ComponentName(context, MonthlyTbrWidgetProvider.class)
        );

        for (int id : ids) {
            render(context, manager, id);
        }
    }

    private static void render(
        Context context,
        AppWidgetManager manager,
        int widgetId
    ) {
        RemoteViews views = new RemoteViews(
            context.getPackageName(),
            R.layout.monthly_tbr_widget
        );

        int accent = accent(context);

        views.setInt(
            R.id.monthly_tbr_accent_strip,
            "setBackgroundColor",
            accent
        );

        views.setInt(
            R.id.monthly_tbr_title,
            "setTextColor",
            accent
        );

        Calendar now = Calendar.getInstance();

        views.setTextViewText(
            R.id.monthly_tbr_month,
            new DateFormatSymbols()
                .getMonths()[now.get(Calendar.MONTH)]
                .toUpperCase() +
                " " +
                now.get(Calendar.YEAR)
        );

        views.setTextViewText(
            R.id.monthly_tbr_empty,
            "No books in this month's TBR yet"
        );

        Intent intent = new Intent(
            context,
            MonthlyTbrWidgetService.class
        );

        intent.putExtra(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            widgetId
        );

        intent.setData(
            Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME))
        );

        views.setRemoteAdapter(R.id.monthly_tbr_list, intent);
        views.setEmptyView(
            R.id.monthly_tbr_list,
            R.id.monthly_tbr_empty
        );

        PendingIntent open = openAppIntent(context, widgetId);

        views.setPendingIntentTemplate(
            R.id.monthly_tbr_list,
            open
        );

        views.setOnClickPendingIntent(
            R.id.monthly_tbr_root,
            open
        );

        views.setOnClickPendingIntent(
            R.id.monthly_tbr_logo,
            open
        );

        manager.updateAppWidget(widgetId, views);

        manager.notifyAppWidgetViewDataChanged(
            widgetId,
            R.id.monthly_tbr_list
        );
    }

    private static int accent(Context context) {
        try {
            File file = new File(
                context.getFilesDir(),
                APPEARANCE_FILE
            );

            if (file.exists()) {
                return Color.parseColor(
                    new JSONObject(readFile(file))
                        .optString("accent", "#8B3A3A")
                );
            }
        } catch (Exception ignored) {
        }

        return Color.rgb(139, 58, 58);
    }

    private static PendingIntent openAppIntent(
        Context context,
        int widgetId
    ) {
        Intent intent = context.getPackageManager()
            .getLaunchIntentForPackage(context.getPackageName());

        return PendingIntent.getActivity(
            context,
            widgetId + 2000,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT |
                PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static String readFile(File file) throws Exception {
        FileInputStream input = new FileInputStream(file);

        byte[] bytes = new byte[(int) file.length()];
        int offset = 0;

        while (offset < bytes.length) {
            int count = input.read(bytes, offset, bytes.length - offset);

            if (count < 0) {
                break;
            }

            offset += count;
        }

        input.close();

        return new String(bytes, StandardCharsets.UTF_8);
    }
}
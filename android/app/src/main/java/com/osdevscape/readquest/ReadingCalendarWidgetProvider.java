package com.osdevscape.readquest;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.text.DateFormatSymbols;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

public class ReadingCalendarWidgetProvider extends AppWidgetProvider {
    private static final String SESSIONS_FILE =
        "reading-calendar-log.json";
    private static final String APPEARANCE_FILE =
        "reading-widget-appearance.json";

    @Override
    public void onUpdate(
        Context context,
        AppWidgetManager manager,
        int[] ids
    ) {
        for (int id : ids) {
            render(context, manager, id);
        }
    }

    public static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        int[] ids = manager.getAppWidgetIds(
            new ComponentName(
                context,
                ReadingCalendarWidgetProvider.class
            )
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
            R.layout.reading_calendar_widget
        );

        int accent = accent(context);
        Calendar now = Calendar.getInstance();

        views.setInt(
            R.id.calendar_widget_accent_strip,
            "setBackgroundColor",
            accent
        );

        views.setInt(
            R.id.calendar_widget_title,
            "setTextColor",
            accent
        );

        views.setTextViewText(
            R.id.calendar_widget_month,
            new DateFormatSymbols()
                .getMonths()[now.get(Calendar.MONTH)]
                .toUpperCase() +
                " " +
                now.get(Calendar.YEAR)
        );

        MonthStats stats = monthStats(context, now);

        views.setTextViewText(
            R.id.calendar_widget_summary,
            stats.days +
            " reading day" +
            (stats.days == 1 ? "" : "s") +
            " \u00B7 " +
            stats.minutes +
            " minute" +
            (stats.minutes == 1 ? "" : "s")
        );

        views.setViewVisibility(
            R.id.calendar_widget_empty,
            stats.days == 0 ? View.VISIBLE : View.GONE
        );

        if (stats.days == 0) {
            views.setTextViewText(
                R.id.calendar_widget_empty,
                "Start a reading timer to fill your calendar"
            );
        }

        PendingIntent open = openAppIntent(context, widgetId);

        views.setOnClickPendingIntent(
            R.id.calendar_widget_root,
            open
        );

        views.setOnClickPendingIntent(
            R.id.calendar_widget_logo,
            open
        );

        manager.updateAppWidget(widgetId, views);
    }

    private static MonthStats monthStats(
        Context context,
        Calendar now
    ) {
        MonthStats result = new MonthStats();

        try {
            File file = new File(
                context.getFilesDir(),
                SESSIONS_FILE
            );

            if (!file.exists()) {
                return result;
            }

            JSONArray sessions = new JSONArray(readFile(file));

            for (int index = 0; index < sessions.length(); index++) {
                JSONObject session = sessions.optJSONObject(index);

                if (session == null) {
                    continue;
                }

                Calendar date = Calendar.getInstance();
                date.setTimeInMillis(
                    session.optLong("endedAt", 0L)
                );

                if (
                    date.get(Calendar.YEAR) !=
                        now.get(Calendar.YEAR) ||
                    date.get(Calendar.MONTH) !=
                        now.get(Calendar.MONTH)
                ) {
                    continue;
                }

                int minutes = Math.max(
                    0,
                    session.optInt("minutes", 0)
                );

                if (minutes <= 0) {
                    continue;
                }

                String dayKey =
                    date.get(Calendar.YEAR) +
                    "-" +
                    date.get(Calendar.DAY_OF_YEAR);

                result.activeDays.add(dayKey);
                result.minutes += minutes;
            }

            result.days = result.activeDays.size();
        } catch (Exception error) {
            android.util.Log.e(
                "ReadingCalendarWidget",
                "Could not load calendar data",
                error
            );
        }

        return result;
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
            widgetId + 3000,
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
            int count = input.read(
                bytes,
                offset,
                bytes.length - offset
            );

            if (count < 0) {
                break;
            }

            offset += count;
        }

        input.close();

        return new String(bytes, StandardCharsets.UTF_8);
    }

    private static class MonthStats {
        int days;
        int minutes;
        Set<String> activeDays = new HashSet<>();
    }
}
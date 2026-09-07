package com.osdevscape.readquest;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.text.DateFormatSymbols;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

public class ReadingCalendarWidgetProvider extends AppWidgetProvider {
    private static final String SESSIONS_FILE =
        "reading-calendar-log.json";
    private static final String APPEARANCE_FILE =
        "reading-widget-appearance.json";

    private static final int CELLS = 42;

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

        Map<Integer, Integer> minutesByDay = minutesByDay(context, now);

        int totalMinutes = 0;
        for (int minutes : minutesByDay.values()) {
            totalMinutes += minutes;
        }

        int activeDays = minutesByDay.size();

        views.setTextViewText(
            R.id.calendar_widget_summary,
            activeDays +
            " reading day" +
            (activeDays == 1 ? "" : "s") +
            " \u00B7 " +
            totalMinutes +
            " minute" +
            (totalMinutes == 1 ? "" : "s")
        );

        paintGrid(views, now, minutesByDay, accent);

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

    private static void paintGrid(
        RemoteViews views,
        Calendar now,
        Map<Integer, Integer> minutesByDay,
        int accent
    ) {
        Calendar first = Calendar.getInstance();
        first.set(
            now.get(Calendar.YEAR),
            now.get(Calendar.MONTH),
            1
        );

        int firstWeekday = first.get(Calendar.DAY_OF_WEEK);
        int offset = firstWeekday - Calendar.SUNDAY;
        int daysInMonth = now.getActualMaximum(
            Calendar.DAY_OF_MONTH
        );

        int today = now.get(Calendar.DAY_OF_MONTH);

        for (int index = 0; index < CELLS; index++) {
            int day = index - offset + 1;
            int cellId = cellId(index);

            if (day < 1 || day > daysInMonth) {
                views.setTextViewText(cellId, "");
                views.setInt(
                    cellId,
                    "setBackgroundColor",
                    Color.TRANSPARENT
                );
                continue;
            }

            views.setTextViewText(cellId, String.valueOf(day));

            if (minutesByDay.containsKey(day)) {
                views.setInt(
                    cellId,
                    "setBackgroundColor",
                    accent
                );
                views.setTextColor(cellId, Color.WHITE);
            } else if (day == today) {
                views.setInt(
                    cellId,
                    "setBackgroundColor",
                    Color.TRANSPARENT
                );
                views.setTextColor(cellId, accent);
            } else {
                views.setInt(
                    cellId,
                    "setBackgroundColor",
                    Color.TRANSPARENT
                );
                views.setTextColor(cellId, 0xFFC9C1B4);
            }
        }
    }

    private static int cellId(int index) {
        switch (index) {
            case 0: return R.id.calendar_cell_0;
            case 1: return R.id.calendar_cell_1;
            case 2: return R.id.calendar_cell_2;
            case 3: return R.id.calendar_cell_3;
            case 4: return R.id.calendar_cell_4;
            case 5: return R.id.calendar_cell_5;
            case 6: return R.id.calendar_cell_6;
            case 7: return R.id.calendar_cell_7;
            case 8: return R.id.calendar_cell_8;
            case 9: return R.id.calendar_cell_9;
            case 10: return R.id.calendar_cell_10;
            case 11: return R.id.calendar_cell_11;
            case 12: return R.id.calendar_cell_12;
            case 13: return R.id.calendar_cell_13;
            case 14: return R.id.calendar_cell_14;
            case 15: return R.id.calendar_cell_15;
            case 16: return R.id.calendar_cell_16;
            case 17: return R.id.calendar_cell_17;
            case 18: return R.id.calendar_cell_18;
            case 19: return R.id.calendar_cell_19;
            case 20: return R.id.calendar_cell_20;
            case 21: return R.id.calendar_cell_21;
            case 22: return R.id.calendar_cell_22;
            case 23: return R.id.calendar_cell_23;
            case 24: return R.id.calendar_cell_24;
            case 25: return R.id.calendar_cell_25;
            case 26: return R.id.calendar_cell_26;
            case 27: return R.id.calendar_cell_27;
            case 28: return R.id.calendar_cell_28;
            case 29: return R.id.calendar_cell_29;
            case 30: return R.id.calendar_cell_30;
            case 31: return R.id.calendar_cell_31;
            case 32: return R.id.calendar_cell_32;
            case 33: return R.id.calendar_cell_33;
            case 34: return R.id.calendar_cell_34;
            case 35: return R.id.calendar_cell_35;
            case 36: return R.id.calendar_cell_36;
            case 37: return R.id.calendar_cell_37;
            case 38: return R.id.calendar_cell_38;
            case 39: return R.id.calendar_cell_39;
            case 40: return R.id.calendar_cell_40;
            default: return R.id.calendar_cell_41;
        }
    }

    private static Map<Integer, Integer> minutesByDay(
        Context context,
        Calendar now
    ) {
        Map<Integer, Integer> result = new HashMap<>();

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

                Calendar date = sessionDate(session);

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

                int day = date.get(Calendar.DAY_OF_MONTH);

                Integer previous = result.get(day);

                result.put(
                    day,
                    previous == null
                        ? minutes
                        : previous + minutes
                );
            }
        } catch (Exception error) {
            android.util.Log.e(
                "ReadingCalendarWidget",
                "Could not load calendar data",
                error
            );
        }

        return result;
    }

    private static Calendar sessionDate(JSONObject session) {
        long endedAt = session.optLong("endedAt", 0L);

        if (endedAt > 0L) {
            Calendar result = Calendar.getInstance();
            result.setTimeInMillis(endedAt);
            return result;
        }

        String dateText = session.optString("date", "").trim();

        if (dateText.isEmpty()) {
            dateText = session.optString("createdAt", "").trim();
        }

        if (dateText.length() > 10) {
            dateText = dateText.substring(0, 10);
        }

        try {
            String[] parts = dateText.split("-");

            if (parts.length == 3) {
                Calendar result = Calendar.getInstance();

                result.clear();
                result.set(
                    Integer.parseInt(parts[0]),
                    Integer.parseInt(parts[1]) - 1,
                    Integer.parseInt(parts[2]),
                    12,
                    0,
                    0
                );

                return result;
            }
        } catch (Exception ignored) {
        }

        Calendar fallback = Calendar.getInstance();

        fallback.clear();
        fallback.set(
            1970,
            Calendar.JANUARY,
            1,
            12,
            0,
            0
        );

        return fallback;
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
}
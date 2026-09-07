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
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class MonthlyTbrWidgetProvider extends AppWidgetProvider {
    private static final String TBR_FILE = "monthly-tbr.json";
    private static final String BOOKS_FILE = "books.json";
    private static final String APPEARANCE_FILE = "reading-widget-appearance.json";

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

        List<String> titles = tbrTitles(context);

        int[] rowIds = {
            R.id.monthly_tbr_row_1,
            R.id.monthly_tbr_row_2,
            R.id.monthly_tbr_row_3,
            R.id.monthly_tbr_row_4
        };

        for (int index = 0; index < rowIds.length; index++) {
            if (index < titles.size()) {
                views.setViewVisibility(rowIds[index], View.VISIBLE);

                views.setTextViewText(
                    rowIds[index],
                    (index + 1) + ". " + titles.get(index)
                );
            } else {
                views.setViewVisibility(rowIds[index], View.GONE);
            }
        }

        boolean empty = titles.isEmpty();

        views.setViewVisibility(
            R.id.monthly_tbr_empty,
            empty ? View.VISIBLE : View.GONE
        );

        if (empty) {
            views.setTextViewText(
                R.id.monthly_tbr_empty,
                "No books in this month's TBR yet"
            );
        }

        PendingIntent open = openAppIntent(context, widgetId);

        views.setOnClickPendingIntent(
            R.id.monthly_tbr_root,
            open
        );

        views.setOnClickPendingIntent(
            R.id.monthly_tbr_logo,
            open
        );

        manager.updateAppWidget(widgetId, views);
    }

    private static List<String> tbrTitles(Context context) {
    List<String> titles = new ArrayList<>();

    try {
        File file = new File(context.getFilesDir(), TBR_FILE);

        if (!file.exists()) {
            return titles;
        }

        Calendar now = Calendar.getInstance();

        String monthKey = String.format(
            java.util.Locale.US,
            "%04d-%02d",
            now.get(Calendar.YEAR),
            now.get(Calendar.MONTH) + 1
        );

        JSONObject data = new JSONObject(readFile(file));
        JSONArray ids = data.optJSONArray(monthKey);

        if (ids == null || ids.length() == 0) {
            return titles;
        }

        JSONObject titlesById = bookTitles(context);

        for (int index = 0; index < ids.length(); index++) {
            String id = ids.optString(index, "").trim();

            if (id.isEmpty()) {
                continue;
            }

            String title = titlesById.optString(id, "").trim();

            if (!title.isEmpty()) {
                titles.add(title);
            }

            if (titles.size() >= 4) {
                break;
            }
        }
    } catch (Exception error) {
        android.util.Log.e(
            "MonthlyTbrWidget",
            "Could not load Monthly TBR data",
            error
        );
    }

    return titles;
}

    private static JSONObject bookTitles(Context context) {
        JSONObject result = new JSONObject();

        try {
            File file = new File(context.getFilesDir(), BOOKS_FILE);

            if (!file.exists()) {
                return result;
            }

            JSONArray books = new JSONObject(readFile(file))
                .optJSONArray("books");

            if (books == null) {
                return result;
            }

            for (int index = 0; index < books.length(); index++) {
                JSONObject book = books.optJSONObject(index);

                if (book == null) {
                    continue;
                }

                String id = book.optString(
                    "id",
                    book.optString("Id", "")
                );

                String title = book.optString(
                    "title",
                    book.optString("Title", "")
                );

                if (!id.isEmpty() && !title.isEmpty()) {
                    result.put(id, title);
                }
            }
        } catch (Exception ignored) {
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
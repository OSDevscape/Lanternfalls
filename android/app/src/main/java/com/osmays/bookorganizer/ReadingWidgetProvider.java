package com.osmays.bookorganizer;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class ReadingWidgetProvider extends AppWidgetProvider {
    private static final String PREFS = "reading_widget_state";
    private static final String ACTION_START = "com.osmays.bookorganizer.widget.START";
    private static final String ACTION_PAUSE = "com.osmays.bookorganizer.widget.PAUSE";
    private static final String ACTION_RESUME = "com.osmays.bookorganizer.widget.RESUME";
    private static final String ACTION_STOP = "com.osmays.bookorganizer.widget.STOP";
    private static final String BOOKS_FILE = "books.json";
    private static final String SESSIONS_FILE = "reading-widget-sessions.json";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateWidget(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (ACTION_START.equals(action)) start(context);
        else if (ACTION_PAUSE.equals(action)) pause(context);
        else if (ACTION_RESUME.equals(action)) resume(context);
        else if (ACTION_STOP.equals(action)) stop(context);
        super.onReceive(context, intent);
        refresh(context);
    }

    public static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, ReadingWidgetProvider.class);
        for (int id : manager.getAppWidgetIds(component)) updateWidget(context, manager, id);
    }

    private static void start(Context context) {
        Book book = currentReadingBook(context);
        if (book == null) return;
        prefs(context).edit()
            .putBoolean("running", true)
            .putBoolean("paused", false)
            .putLong("startedElapsed", SystemClock.elapsedRealtime())
            .putLong("accumulatedMs", 0L)
            .putString("bookId", book.id)
            .putString("bookTitle", book.title)
            .putString("bookIsbn", book.isbn)
            .apply();
    }

    private static void pause(Context context) {
        SharedPreferences state = prefs(context);
        if (!state.getBoolean("running", false)) return;
        long active = state.getLong("accumulatedMs", 0L)
            + SystemClock.elapsedRealtime() - state.getLong("startedElapsed", 0L);
        state.edit()
            .putBoolean("running", false)
            .putBoolean("paused", true)
            .putLong("accumulatedMs", active)
            .apply();
    }

    private static void resume(Context context) {
        SharedPreferences state = prefs(context);
        if (!state.getBoolean("paused", false)) return;
        state.edit()
            .putBoolean("running", true)
            .putBoolean("paused", false)
            .putLong("startedElapsed", SystemClock.elapsedRealtime())
            .apply();
    }

    private static void stop(Context context) {
        SharedPreferences state = prefs(context);
        long elapsed = elapsedMs(state);
        String bookId = state.getString("bookId", "");
        String bookTitle = state.getString("bookTitle", "Reading session");
        int minutes = (int) (elapsed / 60000L);

        if (minutes > 0 && !bookId.isEmpty()) {
    appendSession(context, bookId, bookTitle, minutes);

    Toast.makeText(
        context,
        "Reading session saved: " + minutes + " minute" + (minutes == 1 ? "" : "s"),
        Toast.LENGTH_SHORT
    ).show();
}
        state.edit().clear().apply();
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences state = prefs(context);
        boolean running = state.getBoolean("running", false);
        boolean paused = state.getBoolean("paused", false);
        boolean active = running || paused;
        Book book = active
            ? new Book(
                state.getString("bookId", ""),
                state.getString("bookTitle", "Your current book"),
                state.getString("bookIsbn", "")
            )
            : currentReadingBook(context);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.reading_widget);

        if (book == null || book.id.isEmpty()) {
            views.setTextViewText(R.id.widget_book_title, "Choose a book marked Reading");
            views.setImageViewResource(R.id.widget_cover, android.R.drawable.ic_menu_report_image);
            views.setChronometer(
                R.id.widget_timer,
                SystemClock.elapsedRealtime(),
                "%s",
                false
            );
            views.setTextViewText(R.id.widget_timer, "START");
            views.setInt(R.id.widget_timer, "setBackgroundResource", R.drawable.widget_timer_idle);
            views.setViewVisibility(R.id.widget_pause, View.GONE);
            views.setViewVisibility(R.id.widget_stop, View.GONE);
        } else {
            views.setTextViewText(R.id.widget_book_title, book.title);
            setCover(context, views, book.isbn);
            long elapsed = elapsedMs(state);

            if (running) {
                views.setInt(R.id.widget_timer, "setBackgroundResource", R.drawable.widget_timer_running);
                views.setChronometer(
                    R.id.widget_timer,
                    SystemClock.elapsedRealtime() - elapsed,
                    "%s",
                    true
                );
                views.setTextViewText(R.id.widget_pause, "Pause");
            } else if (paused) {
                views.setInt(R.id.widget_timer, "setBackgroundResource", R.drawable.widget_timer_paused);
                views.setChronometer(
                    R.id.widget_timer,
                    SystemClock.elapsedRealtime(),
                    "%s",
                    false
                );
                views.setTextViewText(R.id.widget_timer, "PAUSED\n" + formatTime(elapsed));
                views.setTextViewText(R.id.widget_pause, "Resume");
            } else {
                views.setInt(R.id.widget_timer, "setBackgroundResource", R.drawable.widget_timer_idle);
                views.setChronometer(
                    R.id.widget_timer,
                    SystemClock.elapsedRealtime(),
                    "%s",
                    false
                );
                views.setTextViewText(R.id.widget_timer, "START");
            }

            views.setViewVisibility(R.id.widget_pause, active ? View.VISIBLE : View.GONE);
            views.setViewVisibility(R.id.widget_stop, active ? View.VISIBLE : View.GONE);
        }

        views.setOnClickPendingIntent(
            R.id.widget_timer,
            actionIntent(context, running ? ACTION_PAUSE : (paused ? ACTION_RESUME : ACTION_START), widgetId)
        );
        views.setOnClickPendingIntent(
            R.id.widget_pause,
            actionIntent(context, paused ? ACTION_RESUME : ACTION_PAUSE, widgetId)
        );
        views.setOnClickPendingIntent(
            R.id.widget_stop,
            actionIntent(context, ACTION_STOP, widgetId)
        );
        views.setOnClickPendingIntent(R.id.widget_cover, openAppIntent(context, widgetId));
        manager.updateAppWidget(widgetId, views);
    }

    private static PendingIntent actionIntent(Context context, String action, int widgetId) {
        Intent intent = new Intent(context, ReadingWidgetProvider.class);
        intent.setAction(action);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        return PendingIntent.getBroadcast(
            context,
            action.hashCode() + widgetId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent openAppIntent(Context context, int widgetId) {
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        return PendingIntent.getActivity(
            context,
            widgetId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static long elapsedMs(SharedPreferences state) {
        long elapsed = state.getLong("accumulatedMs", 0L);
        if (state.getBoolean("running", false)) {
            elapsed += SystemClock.elapsedRealtime() - state.getLong("startedElapsed", 0L);
        }
        return Math.max(0L, elapsed);
    }

    private static String formatTime(long milliseconds) {
        long seconds = milliseconds / 1000L;
        return String.format("%02d:%02d", seconds / 60L, seconds % 60L);
    }

    private static void setCover(Context context, RemoteViews views, String isbn) {
        String cleanIsbn = isbn == null ? "" : isbn.replaceAll("[^0-9Xx]", "").replace(" ", "");
        if (cleanIsbn.isEmpty()) {
            views.setImageViewResource(R.id.widget_cover, android.R.drawable.ic_menu_report_image);
            return;
        }

        File cover = new File(new File(context.getFilesDir(), "covers"), cleanIsbn + ".jpg");
        Bitmap bitmap = BitmapFactory.decodeFile(cover.getAbsolutePath());
        if (bitmap != null) {
            views.setImageViewBitmap(R.id.widget_cover, bitmap);
        } else {
            views.setImageViewResource(R.id.widget_cover, android.R.drawable.ic_menu_report_image);
        }
    }

    private static Book currentReadingBook(Context context) {
        try {
            File file = new File(context.getFilesDir(), BOOKS_FILE);
            if (!file.exists()) return null;

            JSONArray books = new JSONObject(readFile(file)).optJSONArray("books");
            if (books == null) return null;

            for (int i = 0; i < books.length(); i++) {
                JSONObject item = books.optJSONObject(i);
                if (item == null) continue;

                String status = item.optString("status", item.optString("Status", ""));
                if ("reading".equals(status)) {
                    return new Book(
                        item.optString("id", item.optString("Id", "")),
                        item.optString("title", item.optString("Title", "Your current book")),
                        item.optString("isbn", item.optString("ISBN", item.optString("Isbn", "")))
                    );
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private static void appendSession(Context context, String bookId, String bookTitle, int minutes) {
        try {
            File file = new File(context.getFilesDir(), SESSIONS_FILE);
            JSONArray sessions = file.exists() ? new JSONArray(readFile(file)) : new JSONArray();
            JSONObject session = new JSONObject();
            session.put("id", "widget-" + UUID.randomUUID());
            session.put("minutes", minutes);
            session.put("bookId", bookId);
            session.put("bookTitle", bookTitle);
            session.put("endedAt", System.currentTimeMillis());
            sessions.put(session);
            writeFile(file, sessions.toString());
        } catch (Exception ignored) {
        }
    }

    private static String readFile(File file) throws Exception {
        FileInputStream input = new FileInputStream(file);
        byte[] bytes = new byte[(int) file.length()];
        int offset = 0;
        while (offset < bytes.length) {
            int count = input.read(bytes, offset, bytes.length - offset);
            if (count < 0) break;
            offset += count;
        }
        input.close();
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private static void writeFile(File file, String text) throws Exception {
        FileOutputStream output = new FileOutputStream(file, false);
        output.write(text.getBytes(StandardCharsets.UTF_8));
        output.close();
    }

    private static class Book {
        final String id;
        final String title;
        final String isbn;

        Book(String id, String title, String isbn) {
            this.id = id;
            this.title = title;
            this.isbn = isbn;
        }
    }
}
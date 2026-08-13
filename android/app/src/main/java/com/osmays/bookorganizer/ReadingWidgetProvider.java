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
import android.graphics.Color;
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
    private static final String APPEARANCE_FILE = "reading-widget-appearance.json";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
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
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, ReadingWidgetProvider.class));
        for (int id : ids) render(context, manager, id);
    }

    private static void render(Context context, AppWidgetManager manager, int widgetId) {
        SharedPreferences state = prefs(context);
        boolean running = state.getBoolean("running", false);
        boolean paused = state.getBoolean("paused", false);
        boolean active = running || paused;
        Book book = active
            ? new Book(state.getString("bookId", ""), state.getString("bookTitle", "Your current book"), state.getString("bookIsbn", ""))
            : currentReadingBook(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.reading_widget);
        views.setInt(R.id.widget_accent_strip, "setBackgroundColor", accent(context));
        views.setInt(R.id.widget_logo, "setBackgroundColor", accent(context));

        if (book == null || book.id.isEmpty()) {
            views.setTextViewText(R.id.widget_status, "Mark a book as Reading in ReadQuest");
            views.setTextViewText(R.id.widget_book_title, "No current book");
            views.setImageViewResource(R.id.widget_cover, android.R.drawable.ic_menu_report_image);
            setIdleTimer(views);
            views.setViewVisibility(R.id.widget_start, View.VISIBLE);
            views.setViewVisibility(R.id.widget_pause, View.GONE);
            views.setViewVisibility(R.id.widget_stop, View.GONE);
        } else {
            views.setTextViewText(R.id.widget_status, active ? "Reading session in progress" : "Current reading quest");
            views.setTextViewText(R.id.widget_book_title, book.title);
            setCover(context, views, book.isbn);

            if (running) {
                long elapsed = elapsedMs(state);
                views.setChronometer(R.id.widget_timer, SystemClock.elapsedRealtime() - elapsed, "%s", true);
                views.setTextViewText(R.id.widget_pause, "Pause");
                views.setViewVisibility(R.id.widget_start, View.GONE);
                views.setViewVisibility(R.id.widget_pause, View.VISIBLE);
                views.setViewVisibility(R.id.widget_stop, View.VISIBLE);
            } else if (paused) {
                views.setChronometer(R.id.widget_timer, SystemClock.elapsedRealtime(), "%s", false);
                views.setTextViewText(R.id.widget_timer, "PAUSED\n" + formatTime(elapsedMs(state)));
                views.setTextViewText(R.id.widget_pause, "Resume");
                views.setViewVisibility(R.id.widget_start, View.GONE);
                views.setViewVisibility(R.id.widget_pause, View.VISIBLE);
                views.setViewVisibility(R.id.widget_stop, View.VISIBLE);
            } else {
                setIdleTimer(views);
                views.setViewVisibility(R.id.widget_start, View.VISIBLE);
                views.setViewVisibility(R.id.widget_pause, View.GONE);
                views.setViewVisibility(R.id.widget_stop, View.GONE);
            }
        }

        views.setOnClickPendingIntent(R.id.widget_start, actionIntent(context, ACTION_START, widgetId));
        views.setOnClickPendingIntent(R.id.widget_timer, actionIntent(context, running ? ACTION_PAUSE : (paused ? ACTION_RESUME : ACTION_START), widgetId));
        views.setOnClickPendingIntent(R.id.widget_pause, actionIntent(context, paused ? ACTION_RESUME : ACTION_PAUSE, widgetId));
        views.setOnClickPendingIntent(R.id.widget_stop, actionIntent(context, ACTION_STOP, widgetId));
        PendingIntent open = openAppIntent(context, widgetId);
        views.setOnClickPendingIntent(R.id.widget_cover, open);
        views.setOnClickPendingIntent(R.id.widget_logo, open);
        views.setOnClickPendingIntent(R.id.widget_book_title, open);
        manager.updateAppWidget(widgetId, views);
    }

    private static void start(Context context) {
        Book book = currentReadingBook(context);
        if (book == null) {
            Toast.makeText(context, "Choose a book marked Reading first", Toast.LENGTH_SHORT).show();
            return;
        }
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
        state.edit()
            .putBoolean("running", false)
            .putBoolean("paused", true)
            .putLong("accumulatedMs", elapsedMs(state))
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
        int minutes = (int) (elapsedMs(state) / 60000L);
        String bookId = state.getString("bookId", "");
        if (minutes > 0 && !bookId.isEmpty()) {
            appendSession(context, bookId, state.getString("bookTitle", "Reading session"), minutes);
            Toast.makeText(context, "Reading session saved: " + minutes + " minute" + (minutes == 1 ? "" : "s"), Toast.LENGTH_SHORT).show();
        }
        state.edit().clear().apply();
    }

    private static PendingIntent actionIntent(Context context, String action, int id) {
        Intent intent = new Intent(context, ReadingWidgetProvider.class);
        intent.setAction(action);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        return PendingIntent.getBroadcast(context, action.hashCode() + id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent openAppIntent(Context context, int id) {
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        return PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static long elapsedMs(SharedPreferences state) {
        long elapsed = state.getLong("accumulatedMs", 0L);
        if (state.getBoolean("running", false)) elapsed += SystemClock.elapsedRealtime() - state.getLong("startedElapsed", 0L);
        return Math.max(0L, elapsed);
    }

    private static String formatTime(long milliseconds) {
        long seconds = milliseconds / 1000L;
        return String.format("%02d:%02d", seconds / 60L, seconds % 60L);
    }

    private static void setIdleTimer(RemoteViews views) {
        views.setChronometer(R.id.widget_timer, SystemClock.elapsedRealtime(), "%s", false);
        views.setTextViewText(R.id.widget_timer, "00:00");
    }

    private static int accent(Context context) {
        try {
            File file = new File(context.getFilesDir(), APPEARANCE_FILE);
            if (file.exists()) return Color.parseColor(new JSONObject(readFile(file)).optString("accent", "#8B3A3A"));
        } catch (Exception ignored) { }
        return Color.rgb(139, 58, 58);
    }

    private static void setCover(Context context, RemoteViews views, String isbn) {
        String clean = isbn == null ? "" : isbn.replaceAll("[^0-9Xx]", "");
        Bitmap bitmap = clean.isEmpty() ? null : BitmapFactory.decodeFile(new File(new File(context.getFilesDir(), "covers"), clean + ".jpg").getAbsolutePath());
        if (bitmap == null) views.setImageViewResource(R.id.widget_cover, android.R.drawable.ic_menu_report_image);
        else views.setImageViewBitmap(R.id.widget_cover, bitmap);
    }

    private static Book currentReadingBook(Context context) {
        try {
            File file = new File(context.getFilesDir(), BOOKS_FILE);
            if (!file.exists()) return null;
            JSONArray books = new JSONObject(readFile(file)).optJSONArray("books");
            if (books == null) return null;
            for (int i = 0; i < books.length(); i++) {
                JSONObject item = books.optJSONObject(i);
                if (item != null && "reading".equals(item.optString("status", item.optString("Status", "")))) {
                    return new Book(item.optString("id", item.optString("Id", "")), item.optString("title", item.optString("Title", "Your current book")), item.optString("isbn", item.optString("ISBN", item.optString("Isbn", ""))));
                }
            }
        } catch (Exception ignored) { }
        return null;
    }

    private static void appendSession(Context context, String bookId, String title, int minutes) {
        try {
            File file = new File(context.getFilesDir(), SESSIONS_FILE);
            JSONArray sessions = file.exists() ? new JSONArray(readFile(file)) : new JSONArray();
            JSONObject session = new JSONObject();
            session.put("id", "widget-" + UUID.randomUUID());
            session.put("minutes", minutes);
            session.put("bookId", bookId);
            session.put("bookTitle", title);
            session.put("endedAt", System.currentTimeMillis());
            sessions.put(session);
            writeFile(file, sessions.toString());
        } catch (Exception ignored) { }
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

    private static void writeFile(File file, String value) throws Exception {
        FileOutputStream output = new FileOutputStream(file, false);
        output.write(value.getBytes(StandardCharsets.UTF_8));
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

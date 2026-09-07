package com.osdevscape.readquest;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class MonthlyTbrWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new TbrViewsFactory(getApplicationContext());
    }

    private static class TbrViewsFactory
        implements RemoteViewsFactory {

        private final Context context;
        private final List<String[]> books = new ArrayList<>();

        TbrViewsFactory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            // No-op; data is loaded in onDataSetChanged.
        }

        @Override
        public void onDataSetChanged() {
            books.clear();
            books.addAll(loadBooks());
        }

        @Override
        public int getCount() {
            return books.size();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            String[] book = books.get(position);

            RemoteViews views = new RemoteViews(
                context.getPackageName(),
                R.layout.monthly_tbr_widget_item
            );

            views.setTextViewText(
                R.id.tbr_item_title,
                (position + 1) + ". " + book[0]
            );

            views.setTextViewText(
                R.id.tbr_item_author,
                book[1]
            );

            views.setOnClickFillInIntent(
                R.id.tbr_item_root,
                new Intent()
            );

            return views;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }

        @Override
        public void onDestroy() {
            books.clear();
        }

        private List<String[]> loadBooks() {
            List<String[]> result = new ArrayList<>();

            try {
                File file = new File(
                    context.getFilesDir(),
                    "monthly-tbr-widget.json"
                );

                if (!file.exists()) {
                    return result;
                }

                JSONObject data = new JSONObject(readFile(file));
                JSONArray arr = data.optJSONArray("books");

                if (arr == null) {
                    return result;
                }

                for (int index = 0; index < arr.length(); index++) {
                    JSONObject book = arr.optJSONObject(index);

                    if (book == null) {
                        continue;
                    }

                    String title = book.optString(
                        "title",
                        "Untitled"
                    ).trim();

                    String author = book.optString(
                        "author",
                        "Unknown author"
                    ).trim();

                    result.add(new String[]{title, author});
                }
            } catch (Exception ignored) {
            }

            return result;
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
}
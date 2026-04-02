package com.dailytask.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import com.dailytask.mobileapp.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * TaskWidgetProvider
 *
 * Renders a home-screen widget showing today's pending tasks.
 *
 * Data is read from the SharedPreferences file written by the React Native app
 * via react-native-shared-group-preferences (key: "dailytask_widget_data",
 * prefs file: "group.com.dailytask.mobileapp").
 *
 * Layout: android/app/src/main/res/layout/task_widget.xml
 * Metadata: android/app/src/main/res/xml/task_widget_info.xml
 */
public class TaskWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "group.com.dailytask.mobileapp";
    private static final String DATA_KEY   = "dailytask_widget_data";

    @Override
    public void onUpdate(Context context,
                         AppWidgetManager appWidgetManager,
                         int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId);
        }
    }

    private void updateWidget(Context context,
                              AppWidgetManager manager,
                              int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.task_widget);

        String[] tasks = loadPendingTasks(context);

        // Clear placeholder text
        views.setTextViewText(R.id.widget_task_1, "");
        views.setTextViewText(R.id.widget_task_2, "");
        views.setTextViewText(R.id.widget_task_3, "");
        views.setTextViewText(R.id.widget_task_4, "");

        if (tasks.length == 0) {
            views.setTextViewText(R.id.widget_empty, "No tasks today \uD83C\uDF89");
            views.setViewVisibility(R.id.widget_empty, android.view.View.VISIBLE);
            views.setViewVisibility(R.id.widget_task_list, android.view.View.GONE);
        } else {
            views.setViewVisibility(R.id.widget_empty, android.view.View.GONE);
            views.setViewVisibility(R.id.widget_task_list, android.view.View.VISIBLE);

            int[] taskViews = {
                R.id.widget_task_1,
                R.id.widget_task_2,
                R.id.widget_task_3,
                R.id.widget_task_4
            };

            int limit = Math.min(tasks.length, taskViews.length);
            for (int i = 0; i < limit; i++) {
                views.setTextViewText(taskViews[i], "\u25CB  " + tasks[i]);
                views.setViewVisibility(taskViews[i], android.view.View.VISIBLE);
            }

            // Hide unused rows
            for (int i = limit; i < taskViews.length; i++) {
                views.setViewVisibility(taskViews[i], android.view.View.GONE);
            }

            int overflow = tasks.length - limit;
            if (overflow > 0) {
                views.setTextViewText(R.id.widget_overflow,
                        "+ " + overflow + " more task" + (overflow > 1 ? "s" : ""));
                views.setViewVisibility(R.id.widget_overflow, android.view.View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_overflow, android.view.View.GONE);
            }
        }

        manager.updateAppWidget(widgetId, views);
    }

    /**
     * Read pending tasks from shared SharedPreferences.
     * Returns task titles as a String array (max 10).
     */
    private String[] loadPendingTasks(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(DATA_KEY, null);
        if (raw == null) return new String[0];

        try {
            JSONObject payload = new JSONObject(raw);
            JSONArray arr = payload.getJSONArray("tasks");
            java.util.List<String> pending = new java.util.ArrayList<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject task = arr.getJSONObject(i);
                if (!task.optBoolean("completed", false)) {
                    pending.add(task.optString("title", ""));
                }
            }
            return pending.toArray(new String[0]);
        } catch (JSONException e) {
            return new String[0];
        }
    }
}

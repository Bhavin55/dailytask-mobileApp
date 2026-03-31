/**
 * widgetSync.js
 *
 * Syncs today's tasks to the native widget via shared storage.
 *
 * iOS  : Writes to an App Group UserDefaults suite so the Widget Extension
 *         can read the data without an IPC round-trip.
 * Android: Writes to a SharedPreferences file that the AppWidgetProvider
 *          can read, then broadcasts an update intent.
 *
 * The package `react-native-shared-group-preferences` must be installed and
 * the iOS App Group entitlement `group.com.dailytask.mobileapp` must be
 * configured (see app.json).  On Android no extra setup is needed.
 *
 * If the package is absent (e.g. Expo Go) the sync silently no-ops.
 */

import { Platform } from 'react-native';
import { format } from 'date-fns';

const APP_GROUP = 'group.com.dailytask.mobileapp';
const WIDGET_KEY = 'dailytask_widget_data';

let SharedGroupPreferences = null;
try {
  SharedGroupPreferences = require('react-native-shared-group-preferences').default;
} catch {
  // Package not installed — widget sync disabled (works fine in Expo Go).
}

/**
 * Call this whenever the task list changes.
 * Writes a compact JSON blob of today's tasks to shared storage and
 * requests a widget refresh.
 */
export const syncTasksToWidget = async (allTasks) => {
  if (!SharedGroupPreferences) return;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = allTasks
    .filter((t) => t.date === today)
    .map((t) => ({ id: t.id, title: t.title, completed: t.completed }));

  const payload = JSON.stringify({
    tasks: todayTasks,
    updatedAt: new Date().toISOString(),
  });

  try {
    if (Platform.OS === 'ios') {
      await SharedGroupPreferences.setItem(WIDGET_KEY, payload, APP_GROUP);
    } else if (Platform.OS === 'android') {
      // react-native-shared-group-preferences stores in a named
      // SharedPreferences file on Android.
      await SharedGroupPreferences.setItem(WIDGET_KEY, payload, APP_GROUP);
    }
  } catch (e) {
    // Never crash the app over a widget sync failure.
    console.warn('Widget sync failed:', e);
  }
};

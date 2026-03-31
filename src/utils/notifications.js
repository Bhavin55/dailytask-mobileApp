import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { parseISO, setHours, setMinutes, setSeconds, setMilliseconds, isFuture } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestPermissions = async () => {
  if (!Device.isDevice) {
    console.warn('Notifications only work on physical devices.');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
    await Notifications.setNotificationChannelAsync('morning-summary', {
      name: 'Morning Summary',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#6366f1',
    });
  }

  return true;
};

/**
 * Schedule a one-time notification for a specific task reminder.
 * Returns the notification ID or null if the time is in the past.
 */
export const scheduleTaskReminder = async (task, reminderTime) => {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const date = parseISO(task.date);
  const triggerDate = setMilliseconds(
    setSeconds(setMinutes(setHours(date, hours), minutes), 0),
    0
  );

  if (!isFuture(triggerDate)) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: task.title,
        data: { taskId: task.id },
        ...(Platform.OS === 'android' && { channelId: 'task-reminders' }),
      },
      trigger: { date: triggerDate },
    });
    return id;
  } catch (e) {
    console.warn('Failed to schedule task reminder:', e);
    return null;
  }
};

/**
 * Cancel a scheduled notification by ID.
 */
export const cancelNotification = async (notificationId) => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
};

/**
 * Schedule (or re-schedule) the daily morning notification.
 * Cancels the previous one if an ID is supplied.
 * Returns the new notification ID.
 */
export const scheduleMorningNotification = async (timeStr, existingId = null) => {
  if (existingId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch {}
  }

  const [hour, minute] = timeStr.split(':').map(Number);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Good morning! Let's get things done.",
        body: 'Open the app to see your tasks for today.',
        ...(Platform.OS === 'android' && { channelId: 'morning-summary' }),
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    return id;
  } catch (e) {
    console.warn('Failed to schedule morning notification:', e);
    return null;
  }
};

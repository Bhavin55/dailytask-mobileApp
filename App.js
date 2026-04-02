import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { TaskProvider } from './src/store/TaskContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestPermissions } from './src/utils/notifications';

export default function App() {
  const notifListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Request notification permissions on first launch
    requestPermissions();

    // Foreground notification handler (show a banner while the app is open)
    notifListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Expo's notification handler (set in notifications.js) already handles
        // showing the alert. Add any in-app UI updates here if needed.
        console.log('Notification received:', notification.request.content.title);
      }
    );

    // Tap handler — user tapped on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const taskId = response.notification.request.content.data?.taskId;
        if (taskId) {
          // Navigation to the task could be wired up here via a navigation ref
          console.log('Tapped notification for task:', taskId);
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notifListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <TaskProvider>
      <AppNavigator />
    </TaskProvider>
  );
}

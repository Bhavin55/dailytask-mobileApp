# Widget Setup Guide

## Overview

The DailyTask widget shows your pending tasks for today directly on the home screen — no need to open the app.

Data flows like this:

```
React Native app  →  Shared Storage  →  Widget
  (AsyncStorage)      (App Group /       (reads on
  + widgetSync.js     SharedPrefs)        refresh)
```

---

## iOS Widget Setup

### 1. Install dependencies and prebuild

```bash
npm install
npx expo prebuild
```

### 2. Open in Xcode

```bash
open ios/<YourAppName>.xcworkspace
```

### 3. Add the Widget Extension target

1. **File → New → Target**
2. Choose **Widget Extension**
3. Name it exactly: **DailyTaskWidget**
4. Uncheck "Include Configuration Intent"
5. Click **Finish** — do NOT activate the scheme when prompted

### 4. Replace generated Swift files

Delete the auto-generated `DailyTaskWidget.swift` and replace with the files in `ios/DailyTaskWidget/`:

- `DailyTaskWidget.swift`
- `DailyTaskWidgetBundle.swift`

### 5. Configure App Groups

For **both** targets (main app + DailyTaskWidget):

1. Select the target → **Signing & Capabilities**
2. Click **+ Capability** → **App Groups**
3. Add: `group.com.dailytask.mobileapp`

### 6. Set the widget's Info.plist bundle ID

In the DailyTaskWidget target's `Info.plist`, ensure:

```
CFBundleIdentifier = com.dailytask.mobileapp.widget
```

### 7. Build and run

Build on a physical device or simulator. Long-press the home screen → add widget → search "DailyTask".

---

## Android Widget Setup

Android widget registration is handled automatically by the Expo config plugin (`plugins/withDailyTaskWidget.js`) when you run `expo prebuild`.

After prebuild, verify `AndroidManifest.xml` contains the receiver:

```xml
<receiver
    android:name="com.dailytask.widget.TaskWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/task_widget_info" />
</receiver>
```

Build and install; long-press the launcher to add the widget.

---

## How data syncs

`src/utils/widgetSync.js` calls `react-native-shared-group-preferences` every time the task list changes. The widget reads this data on its next refresh (every 30 min, or when the OS triggers it after the app writes).

To force an immediate widget refresh on Android, you can broadcast `APPWIDGET_UPDATE` from the Java code — see `TaskWidgetProvider.java` for the entry point.

---

## Development notes

- **Expo Go** does not support home-screen widgets. Test on a real device build (`eas build` or `npx expo run:ios / run:android`).
- Notification permissions are requested automatically on first launch.
- The morning summary notification repeats daily at the time configured in **Settings**.

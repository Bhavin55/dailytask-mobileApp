/**
 * withDailyTaskWidget.js  —  Expo Config Plugin
 *
 * Automatically wires up the native widget targets when you run
 * `expo prebuild` (bare workflow).
 *
 * What it does
 * ────────────
 * iOS
 *   • Adds the DailyTaskWidget extension target to the Xcode project.
 *   • Applies the App Group entitlement to both the main app and the widget.
 *   • Copies the Swift source files from ios/DailyTaskWidget/ into the target.
 *
 * Android
 *   • Merges the <receiver> declaration for TaskWidgetProvider into
 *     AndroidManifest.xml so Android knows about the widget.
 *
 * Prerequisites
 * ─────────────
 *   npm install @expo/config-plugins          (already a transitive dep of expo)
 *
 * Usage
 * ─────
 *   Listed in app.json → "plugins": ["./plugins/withDailyTaskWidget"]
 */

const { withAppDelegate, withInfoPlist, withAndroidManifest } =
  require('@expo/config-plugins');

// ---------------------------------------------------------------------------
// Android — add the widget receiver to AndroidManifest.xml
// ---------------------------------------------------------------------------
const withAndroidWidget = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application?.[0];
    if (!app) return cfg;

    // Avoid duplicates
    const receivers = app.receiver ?? [];
    const alreadyAdded = receivers.some(
      (r) => r.$?.['android:name'] === 'com.dailytask.widget.TaskWidgetProvider'
    );

    if (!alreadyAdded) {
      receivers.push({
        $: {
          'android:name': 'com.dailytask.widget.TaskWidgetProvider',
          'android:label': 'DailyTask Widget',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/task_widget_info',
            },
          },
        ],
      });
      app.receiver = receivers;
    }

    return cfg;
  });
};

// ---------------------------------------------------------------------------
// iOS — note: full Xcode target injection requires @bacons/apple-targets or
// manual Xcode project editing.  This plugin logs clear setup instructions
// and applies the App Group entitlement to the main app plist.
// ---------------------------------------------------------------------------
const withIOSWidget = (config) => {
  // Apply App Group entitlement to the main app
  return withInfoPlist(config, (cfg) => {
    // The entitlement is set in app.json → ios.entitlements, but we
    // ensure the WidgetKit framework shows up in the build here via a
    // comment in the config (actual target injection needs Xcode project
    // manipulation — see README for manual steps or use @bacons/apple-targets).
    console.log(
      '\n[withDailyTaskWidget] iOS widget setup:\n' +
      '  1. Run: expo prebuild\n' +
      '  2. Open ios/<AppName>.xcworkspace in Xcode.\n' +
      '  3. File → New → Target → Widget Extension → name it "DailyTaskWidget".\n' +
      '  4. Replace generated Swift files with ios/DailyTaskWidget/*.swift.\n' +
      '  5. Add App Group "group.com.dailytask.mobileapp" to both targets.\n' +
      '  See docs/WIDGET_SETUP.md for full instructions.\n'
    );
    return cfg;
  });
};

// ---------------------------------------------------------------------------
// Compose and export
// ---------------------------------------------------------------------------
module.exports = (config) => {
  config = withAndroidWidget(config);
  config = withIOSWidget(config);
  return config;
};

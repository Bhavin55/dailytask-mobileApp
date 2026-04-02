import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskStore } from '../store/TaskContext';
import { formatTime } from '../utils/dateUtils';
import { clearAllData } from '../utils/storage';

const COLORS = {
  primary: '#6366f1',
  primaryLight: '#ede9fe',
  bg: '#f8fafc',
  card: '#fff',
  border: '#f1f5f9',
  text: '#1e293b',
  muted: '#64748b',
  subtle: '#94a3b8',
};

function SettingRow({ label, subtitle, right, topBorder = true }) {
  return (
    <View style={[styles.row, topBorder && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useTaskStore();

  // Local state for the time picker
  const [showPicker, setShowPicker] = useState(false);

  const timeAsDate = (() => {
    const [h, m] = settings.morningNotificationTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  const onTimeChange = (event, selected) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected || event.type === 'dismissed') return;

    const h = selected.getHours().toString().padStart(2, '0');
    const m = selected.getMinutes().toString().padStart(2, '0');
    updateSettings({ morningNotificationTime: `${h}:${m}` });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all tasks and reset settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Done', 'All data has been cleared. Restart the app to apply changes.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      <View style={styles.header}>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Morning notification section */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingRow
            label="Morning Summary"
            subtitle="Daily reminder to check today's tasks"
            topBorder={false}
            right={
              <Switch
                value={settings.morningNotificationEnabled}
                onValueChange={(v) => updateSettings({ morningNotificationEnabled: v })}
                trackColor={{ false: '#e2e8f0', true: '#818cf8' }}
                thumbColor={settings.morningNotificationEnabled ? COLORS.primary : '#f4f4f5'}
              />
            }
          />

          {settings.morningNotificationEnabled && (
            <SettingRow
              label="Notification Time"
              subtitle={formatTime(settings.morningNotificationTime)}
              right={
                <TouchableOpacity
                  style={styles.editPill}
                  onPress={() => setShowPicker((v) => !v)}
                >
                  <Text style={styles.editPillText}>Change</Text>
                </TouchableOpacity>
              }
            />
          )}

          {showPicker && settings.morningNotificationEnabled && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={timeAsDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.pickerDone}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* About section */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingRow
            label="DailyTask"
            subtitle="Version 1.0.0"
            topBorder={false}
            right={<Text style={styles.versionBadge}>v1.0</Text>}
          />
        </View>

        {/* Danger zone */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
            <Text style={styles.dangerText}>Clear All Data</Text>
            <Text style={styles.dangerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Tasks and reminders are stored locally on your device.{'\n'}
          Widgets sync automatically when tasks change.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.subtle,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  rowSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  editPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editPillText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  pickerWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  pickerDone: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  pickerDoneText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  versionBadge: { fontSize: 13, color: COLORS.subtle },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#ef4444' },
  dangerArrow: { fontSize: 20, color: '#ef4444' },
  footer: {
    fontSize: 12,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
    paddingHorizontal: 20,
  },
});

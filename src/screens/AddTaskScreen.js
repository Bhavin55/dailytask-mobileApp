import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskStore } from '../store/TaskContext';
import { todayStr, formatDate, formatTime, adjustDateByDays } from '../utils/dateUtils';
import { parseISO, format } from 'date-fns';

const COLORS = {
  primary: '#6366f1',
  primaryLight: '#ede9fe',
  bg: '#f8fafc',
  card: '#fff',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#64748b',
  placeholder: '#94a3b8',
};

export default function AddTaskScreen({ navigation, route }) {
  const existingTask = route.params?.task;
  const defaultDate = route.params?.date ?? todayStr();
  const isEditing = !!existingTask;

  const { addTask, updateTask, deleteTask } = useTaskStore();

  const [title, setTitle] = useState(existingTask?.title ?? '');
  const [date, setDate] = useState(existingTask?.date ?? defaultDate);
  const [notes, setNotes] = useState(existingTask?.notes ?? '');
  const [reminderTimes, setReminderTimes] = useState(
    existingTask?.reminders?.map((r) => r.time) ?? []
  );

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }
    try {
      if (isEditing) {
        await updateTask(existingTask.id, {
          title: title.trim(),
          date,
          notes,
          reminderTimes,
        });
      } else {
        await addTask({ title: title.trim(), date, notes, reminderTimes });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save the task. Please try again.');
    }
  };

  const openTimePicker = () => {
    const now = new Date();
    setPickerTime(now);
    setShowTimePicker(true);
  };

  const onTimeSelected = useCallback(
    (event, selected) => {
      // On Android the picker dismisses itself; on iOS keep it open until Done
      if (Platform.OS === 'android') setShowTimePicker(false);
      if (!selected || event.type === 'dismissed') return;

      const h = selected.getHours().toString().padStart(2, '0');
      const m = selected.getMinutes().toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;

      if (reminderTimes.includes(timeStr)) {
        Alert.alert('Duplicate', 'This reminder time already exists.');
        return;
      }
      setReminderTimes((prev) => [...prev, timeStr].sort());
    },
    [reminderTimes]
  );

  const removeReminder = (time) =>
    setReminderTimes((prev) => prev.filter((t) => t !== time));

  const shiftDate = (delta) => setDate((d) => adjustDateByDays(d, delta));

  const datePickerDate = parseISO(date);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Modal header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>TASK TITLE</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={COLORS.placeholder}
            autoFocus={!isEditing}
            returnKeyType="done"
            multiline
          />
        </View>

        {/* Date */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.arrowBtn}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.datePill}>
              <Text style={styles.dateStr}>{formatDate(date)}</Text>
              <Text style={styles.dateRaw}>{date}</Text>
            </View>
            <TouchableOpacity onPress={() => shiftDate(1)} style={styles.arrowBtn}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* iOS inline calendar for date selection */}
          {Platform.OS === 'ios' && (
            <DateTimePicker
              value={datePickerDate}
              mode="date"
              display="inline"
              accentColor={COLORS.primary}
              onChange={(_, d) => d && setDate(format(d, 'yyyy-MM-dd'))}
              style={styles.inlineDatePicker}
            />
          )}
        </View>

        {/* Reminders */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>REMINDERS</Text>
            <TouchableOpacity onPress={openTimePicker} style={styles.addReminderBtn}>
              <Text style={styles.addReminderBtnText}>+ Add Time</Text>
            </TouchableOpacity>
          </View>

          {reminderTimes.length === 0 ? (
            <Text style={styles.noReminders}>
              No reminders set. Tap "+ Add Time" to get notified.
            </Text>
          ) : (
            reminderTimes.map((time) => (
              <View key={time} style={styles.reminderChip}>
                <Text style={styles.reminderChipIcon}>⏰</Text>
                <Text style={styles.reminderChipText}>{formatTime(time)}</Text>
                <TouchableOpacity
                  onPress={() => removeReminder(time)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.reminderRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {showTimePicker && (
            <DateTimePicker
              value={pickerTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeSelected}
            />
          )}
          {showTimePicker && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.pickerDoneBtn}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any extra details..."
            placeholderTextColor={COLORS.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Delete button (edit mode only) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteBlock}
            onPress={() =>
              Alert.alert('Delete Task', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteTask(existingTask.id);
                    navigation.goBack();
                  },
                },
              ])
            }
          >
            <Text style={styles.deleteText}>Delete Task</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelBtn: { fontSize: 16, color: COLORS.muted },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  saveBtn: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleInput: {
    fontSize: 17,
    color: COLORS.text,
    lineHeight: 24,
    minHeight: 56,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowBtn: { padding: 8 },
  arrowText: { fontSize: 32, color: COLORS.primary, lineHeight: 36 },
  datePill: { alignItems: 'center', flex: 1 },
  dateStr: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  dateRaw: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  inlineDatePicker: { marginTop: 8 },
  addReminderBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addReminderBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  noReminders: { fontSize: 14, color: COLORS.placeholder, fontStyle: 'italic' },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  reminderChipIcon: { fontSize: 16 },
  reminderChipText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.primary },
  reminderRemove: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  pickerDoneBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pickerDoneText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  notesInput: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    minHeight: 80,
  },
  deleteBlock: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  deleteText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
});

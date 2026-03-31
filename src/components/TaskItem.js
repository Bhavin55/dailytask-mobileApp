import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatTime } from '../utils/dateUtils';

const COLORS = {
  primary: '#6366f1',
  primaryLight: '#ede9fe',
  textPrimary: '#1e293b',
  textMuted: '#64748b',
  textDisabled: '#94a3b8',
  border: '#e2e8f0',
  danger: '#ef4444',
};

export default function TaskItem({ task, onToggle, onPress, onDelete }) {
  return (
    <TouchableOpacity
      style={[styles.container, task.completed && styles.containerCompleted]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxHit}
        onPress={() => onToggle(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, task.completed && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.reminders.length > 0 && (
          <View style={styles.remindersRow}>
            {task.reminders.map((r) => (
              <View key={r.time} style={styles.reminderBadge}>
                <Text style={styles.reminderBadgeText}>⏰ {formatTime(r.time)}</Text>
              </View>
            ))}
          </View>
        )}

        {!!task.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {task.notes}
          </Text>
        )}
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteHit}
        onPress={() => onDelete(task.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  containerCompleted: {
    opacity: 0.65,
  },
  checkboxHit: { marginRight: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  content: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textDisabled,
  },
  remindersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  reminderBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reminderBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  notes: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  deleteHit: { padding: 4, marginLeft: 8 },
  deleteIcon: { fontSize: 14, color: COLORS.textDisabled, fontWeight: '600' },
});

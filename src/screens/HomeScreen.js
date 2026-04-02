import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useTaskStore } from '../store/TaskContext';
import TaskItem from '../components/TaskItem';
import EmptyState from '../components/EmptyState';
import { formatDateLong, todayStr } from '../utils/dateUtils';

export default function HomeScreen({ navigation }) {
  const { tasks, toggleTask, deleteTask } = useTaskStore();
  const today = todayStr();

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === today).sort((a, b) => {
      // Pending first, then by earliest reminder time
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const aTime = a.reminders[0]?.time ?? '99:99';
      const bTime = b.reminders[0]?.time ?? '99:99';
      return aTime.localeCompare(bTime);
    }),
    [tasks, today]
  );

  const pending = todayTasks.filter((t) => !t.completed).length;
  const done = todayTasks.filter((t) => t.completed).length;

  const confirmDelete = (id) =>
    Alert.alert('Delete Task', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
    ]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.dateText}>{formatDateLong(today)}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRight]}>
            <Text style={[styles.statNum, styles.statNumDone]}>{done}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(done / todayTasks.length) * 100}%` },
            ]}
          />
        </View>
      )}

      {/* Task list */}
      <FlatList
        data={todayTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[
          styles.listContent,
          todayTasks.length === 0 && styles.listEmpty,
        ]}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={toggleTask}
            onPress={() => navigation.navigate('AddTask', { task: item })}
            onDelete={confirmDelete}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="✅"
            title="All clear!"
            message={"No tasks for today.\nTap + to add your first task."}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask', { date: today })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  dateText: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statCardRight: { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#6366f1' },
  statNumDone: { color: '#22c55e' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  progressBar: {
    height: 3,
    backgroundColor: '#e2e8f0',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  listContent: { padding: 16 },
  listEmpty: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: { fontSize: 30, color: '#fff', lineHeight: 36, fontWeight: '300' },
});

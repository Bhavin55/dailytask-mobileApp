import React, { useState, useMemo } from 'react';
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
import { Calendar } from 'react-native-calendars';
import { useTaskStore } from '../store/TaskContext';
import TaskItem from '../components/TaskItem';
import EmptyState from '../components/EmptyState';
import { formatDate, todayStr } from '../utils/dateUtils';

export default function CalendarScreen({ navigation }) {
  const { tasks, toggleTask, deleteTask, getDatesWithTasks } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const datesWithTasks = useMemo(() => getDatesWithTasks(), [getDatesWithTasks]);

  const selectedDayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === selectedDate)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const aTime = a.reminders[0]?.time ?? '99:99';
          const bTime = b.reminders[0]?.time ?? '99:99';
          return aTime.localeCompare(bTime);
        }),
    [tasks, selectedDate]
  );

  const markedDates = useMemo(() => {
    const base = { ...datesWithTasks };
    base[selectedDate] = {
      selected: true,
      selectedColor: '#6366f1',
      marked: !!datesWithTasks[selectedDate],
      dotColor: '#fff',
    };
    return base;
  }, [datesWithTasks, selectedDate]);

  const confirmDelete = (id) =>
    Alert.alert('Delete Task', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
    ]);

  const pending = selectedDayTasks.filter((t) => !t.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.screenTitle}>Calendar</Text>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        enableSwipeMonths
        theme={{
          backgroundColor: '#fff',
          calendarBackground: '#fff',
          todayTextColor: '#6366f1',
          selectedDayBackgroundColor: '#6366f1',
          selectedDayTextColor: '#fff',
          arrowColor: '#6366f1',
          dotColor: '#6366f1',
          monthTextColor: '#1e293b',
          dayTextColor: '#1e293b',
          textDisabledColor: '#cbd5e1',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
        }}
      />

      {/* Day header */}
      <View style={styles.dayBar}>
        <View>
          <Text style={styles.dayTitle}>{formatDate(selectedDate)}</Text>
          {selectedDayTasks.length > 0 && (
            <Text style={styles.daySubtitle}>
              {pending} pending · {selectedDayTasks.length - pending} done
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddTask', { date: selectedDate })}
        >
          <Text style={styles.addBtnText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={selectedDayTasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[
          styles.listContent,
          selectedDayTasks.length === 0 && styles.listEmpty,
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
            emoji="📅"
            title={formatDate(selectedDate)}
            message={"No tasks on this day.\nTap \"+ Add Task\" to create one."}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  dayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  daySubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  listContent: { padding: 16 },
  listEmpty: { flex: 1 },
});

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { loadTasks, saveTasks, loadSettings, saveSettings } from '../utils/storage';
import {
  scheduleTaskReminder,
  cancelNotification,
  scheduleMorningNotification,
} from '../utils/notifications';
import { syncTasksToWidget } from '../utils/widgetSync';
import { generateId } from '../utils/dateUtils';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
const initialState = {
  tasks: [],
  settings: {
    morningNotificationEnabled: true,
    morningNotificationTime: '08:00',
    morningNotificationId: null,
  },
  loading: true,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        tasks: action.tasks,
        settings: action.settings,
        loading: false,
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, completed: !t.completed } : t
        ),
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ---- Bootstrap ----------------------------------------------------------
  useEffect(() => {
    (async () => {
      const [tasks, settings] = await Promise.all([loadTasks(), loadSettings()]);
      dispatch({ type: 'LOAD_DATA', tasks, settings });

      // Ensure the morning notification is scheduled on fresh installs
      if (settings.morningNotificationEnabled && !settings.morningNotificationId) {
        const id = await scheduleMorningNotification(settings.morningNotificationTime);
        if (id) {
          dispatch({ type: 'UPDATE_SETTINGS', settings: { morningNotificationId: id } });
        }
      }
    })();
  }, []);

  // ---- Persist tasks -------------------------------------------------------
  useEffect(() => {
    if (state.loading) return;
    saveTasks(state.tasks);
    syncTasksToWidget(state.tasks);
  }, [state.tasks, state.loading]);

  // ---- Persist settings ----------------------------------------------------
  useEffect(() => {
    if (state.loading) return;
    saveSettings(state.settings);
  }, [state.settings, state.loading]);

  // ---- Actions -------------------------------------------------------------

  const addTask = useCallback(async ({ title, date, notes = '', reminderTimes = [] }) => {
    const task = {
      id: generateId(),
      title,
      date,
      completed: false,
      reminders: [],
      notes,
      createdAt: new Date().toISOString(),
    };

    for (const time of reminderTimes) {
      const notifId = await scheduleTaskReminder(task, time);
      if (notifId) task.reminders.push({ time, notificationId: notifId });
    }

    dispatch({ type: 'ADD_TASK', task });
    return task;
  }, []);

  const updateTask = useCallback(
    async (id, { title, date, notes, reminderTimes }) => {
      const existing = state.tasks.find((t) => t.id === id);
      if (!existing) return;

      // Cancel previous reminders
      for (const r of existing.reminders) {
        await cancelNotification(r.notificationId);
      }

      const updated = {
        ...existing,
        title: title ?? existing.title,
        date: date ?? existing.date,
        notes: notes ?? existing.notes,
        reminders: [],
      };

      const times = reminderTimes ?? existing.reminders.map((r) => r.time);
      for (const time of times) {
        const notifId = await scheduleTaskReminder(updated, time);
        if (notifId) updated.reminders.push({ time, notificationId: notifId });
      }

      dispatch({ type: 'UPDATE_TASK', task: updated });
    },
    [state.tasks]
  );

  const deleteTask = useCallback(
    async (id) => {
      const task = state.tasks.find((t) => t.id === id);
      if (task) {
        for (const r of task.reminders) await cancelNotification(r.notificationId);
      }
      dispatch({ type: 'DELETE_TASK', id });
    },
    [state.tasks]
  );

  const toggleTask = useCallback((id) => dispatch({ type: 'TOGGLE_TASK', id }), []);

  const updateSettings = useCallback(
    async (newSettings) => {
      const merged = { ...state.settings, ...newSettings };

      // Re-schedule morning notification if relevant fields changed
      const morningChanged =
        'morningNotificationEnabled' in newSettings ||
        'morningNotificationTime' in newSettings;

      if (morningChanged) {
        if (merged.morningNotificationEnabled) {
          const id = await scheduleMorningNotification(
            merged.morningNotificationTime,
            merged.morningNotificationId
          );
          newSettings.morningNotificationId = id;
        } else {
          await cancelNotification(merged.morningNotificationId);
          newSettings.morningNotificationId = null;
        }
      }

      dispatch({ type: 'UPDATE_SETTINGS', settings: newSettings });
    },
    [state.settings]
  );

  // ---- Selectors -----------------------------------------------------------

  const getTasksForDate = useCallback(
    (dateStr) => state.tasks.filter((t) => t.date === dateStr),
    [state.tasks]
  );

  const getDatesWithTasks = useCallback(() => {
    const map = {};
    state.tasks.forEach((t) => {
      map[t.date] = { marked: true, dotColor: '#6366f1' };
    });
    return map;
  }, [state.tasks]);

  const value = useMemo(
    () => ({
      tasks: state.tasks,
      settings: state.settings,
      loading: state.loading,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      updateSettings,
      getTasksForDate,
      getDatesWithTasks,
    }),
    [
      state,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      updateSettings,
      getTasksForDate,
      getDatesWithTasks,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export const useTaskStore = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskStore must be used within TaskProvider');
  return ctx;
};

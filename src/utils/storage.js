import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = '@dailytask_tasks';
const SETTINGS_KEY = '@dailytask_settings';

const defaultSettings = () => ({
  morningNotificationEnabled: true,
  morningNotificationTime: '08:00',
  morningNotificationId: null,
});

export const loadTasks = async () => {
  try {
    const json = await AsyncStorage.getItem(TASKS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
};

export const loadSettings = async () => {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    return json ? { ...defaultSettings(), ...JSON.parse(json) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const clearAllData = async () => {
  await AsyncStorage.multiRemove([TASKS_KEY, SETTINGS_KEY]);
};

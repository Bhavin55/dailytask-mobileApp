import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export const formatDate = (dateStr) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
};

export const formatDateLong = (dateStr) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, 'EEEE, MMMM d, yyyy') + ' — Today';
  if (isTomorrow(date)) return format(date, 'EEEE, MMMM d, yyyy') + ' — Tomorrow';
  return format(date, 'EEEE, MMMM d, yyyy');
};

export const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
};

export const adjustDateByDays = (dateStr, delta) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return format(d, 'yyyy-MM-dd');
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

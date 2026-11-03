// 日期都按浏览器本地时区算
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const pad = (n) => String(n).padStart(2, '0');

// 用于按天分组的键，如 2026-11-03
export function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 2026.11.03，和手写便签本上的写法一样
export function dotDate(value) {
  const d = new Date(value);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export const weekday = (value) => WEEKDAYS[new Date(value).getDay()];

// 今天 / 昨天，其他日子返回空字符串
export function relativeDay(value) {
  const today = startOfToday();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const key = dayKey(value);
  if (key === dayKey(today)) return '今天';
  if (key === dayKey(yesterday)) return '昨天';
  return '';
}

export function timeLabel(value) {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

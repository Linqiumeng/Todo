// 日期都按浏览器本地时区算
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function startOfToday() {
  return startOfDay(new Date());
}

export function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(value, days) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

export const sameDay = (a, b) => dayKey(a) === dayKey(b);

// 一天里的第几分钟，和反过来：某天的第 m 分钟
export function minutesOf(value) {
  const d = new Date(value);
  return d.getHours() * 60 + d.getMinutes();
}

export function atMinutes(day, minutes) {
  const d = startOfDay(day);
  d.setMinutes(minutes);
  return d;
}

// 600 → 10:00
export const hm = (minutes) => `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;

// 11.14
export function shortDate(value) {
  const d = new Date(value);
  return `${d.getMonth() + 1}.${pad(d.getDate())}`;
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

// 今天 / 昨天（withTomorrow 时还有明天），其他日子返回空字符串
export function relativeDay(value, { withTomorrow = false } = {}) {
  const today = startOfToday();
  const key = dayKey(value);
  if (key === dayKey(today)) return '今天';
  if (key === dayKey(addDays(today, -1))) return '昨天';
  if (withTomorrow && key === dayKey(addDays(today, 1))) return '明天';
  return '';
}

export function timeLabel(value) {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

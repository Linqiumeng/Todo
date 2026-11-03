import { save } from './storage.js';

// index.html 里有一段内联脚本做同样的事：页面渲染前先读出上次的主题
const THEME_KEY = 'todo-theme';
const BAR_COLORS = { light: '#ebe5db', dark: '#141312' };

export function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLORS[theme]);
  save(THEME_KEY, theme);
}

import { load, save } from './storage.js';

const PASSCODE_KEY = 'todo-passcode';

// 口令不对或还没输入时广播，App 收到后显示口令页
export const PASSCODE_EVENT = 'passcode-required';

let passcode = load(PASSCODE_KEY) ?? '';

export const hasPasscode = () => Boolean(passcode);

export function setPasscode(value) {
  passcode = value;
  save(PASSCODE_KEY, value || null);
}

async function request(path, { method = 'GET', body } = {}) {
  // 请求头不能直接放中文，先编码
  const headers = { 'X-Passcode': encodeURIComponent(passcode) };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event(PASSCODE_EVENT));
    const err = new Error(data.error ?? `请求失败（${res.status}）`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  check: () => request('/check'),

  listCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PATCH', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  listTodos: (since) => request(`/todos?since=${encodeURIComponent(since.toISOString())}`),
  listHistory({ before, category } = {}) {
    const query = new URLSearchParams();
    if (before) query.set('before', before);
    if (category) query.set('category', category);
    return request(`/todos/history?${query}`);
  },
  createTodo: (data) => request('/todos', { method: 'POST', body: data }),
  updateTodo: (id, data) => request(`/todos/${id}`, { method: 'PATCH', body: data }),
  deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
};

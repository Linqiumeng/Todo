// 在页面底部弹一条提示（显示组件是 components/Toast.jsx）
export const TOAST_EVENT = 'toast';

export function toast(message) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

// 接口报错的提示。口令不对时会直接显示口令页，不再弹提示
export function toastError(err) {
  if (err.status !== 401) toast(err.message);
}

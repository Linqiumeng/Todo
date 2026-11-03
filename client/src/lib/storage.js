// localStorage 在隐私模式等情况下可能不可用，读写失败时当作没存过
export function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function save(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // 忽略
  }
}

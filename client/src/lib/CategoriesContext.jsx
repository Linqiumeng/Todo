import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { toastError } from './toast.js';

const CategoriesContext = createContext(null);

// 待办页和历史页都要用分类（tab、颜色），统一在这里加载一次
export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);

  const reload = useCallback(
    () => api.listCategories().then(setCategories).catch(toastError),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => {
    const byId = new Map(categories.map((c) => [c._id, c]));
    return {
      categories,
      reload,
      // 分类被删掉的待办会被服务端移到未分类；这里再兜一层，找不到的也当未分类
      categoryOf: (todo) => byId.get(todo.category) ?? null,
    };
  }, [categories, reload]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export const useCategories = () => useContext(CategoriesContext);

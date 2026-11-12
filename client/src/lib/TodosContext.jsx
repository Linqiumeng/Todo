import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { addDays, sameDay, startOfDay, startOfToday } from './dates.js';
import { toastError } from './toast.js';

const TodosContext = createContext(null);

// 打钩后先在原位把钩画完（动画 0.5s），再滑到下面去
const SETTLE_MS = 650;

// 清单和右边的时间表用同一份数据：在一边打钩、修改，另一边马上跟着变
export function TodosProvider({ children }) {
  // 清单：未完成的 + 今天完成的
  const [todos, setTodos] = useState(null);
  const [error, setError] = useState('');
  // 时间表正在看的那一天，和那天排了时间的待办（包括已经不在清单里的，比如前几天做完的）
  const [viewDay, setViewDayState] = useState(startOfToday);
  const [dayItems, setDayItems] = useState([]);
  // 正在编辑的那条待办的预览：{ id, title, category, start, end }，start 为空表示「不安排」
  const [draft, setDraft] = useState(null);
  const [now, setNow] = useState(() => new Date());
  // 刚勾选/取消的条目暂时按原来的状态排序：id → 排序时当作的 done
  const [held, setHeld] = useState({});
  const timers = useRef({});
  // 清单在重新排序前要先记下位置（滑动动画），由清单页注册
  const beforeReorder = useRef(null);
  const dayRequest = useRef(0);

  const reload = useCallback(
    () =>
      api
        .listTodos(startOfToday())
        .then((list) => {
          setTodos(list);
          setError('');
        })
        .catch((err) => setError(err.status === 401 ? '' : err.message)),
    [],
  );

  // 换日期时可能连着发几次请求，只认最后一次
  const loadDay = useCallback((day) => {
    const id = ++dayRequest.current;
    return api
      .listSchedule(day, addDays(day, 1))
      .then((items) => id === dayRequest.current && setDayItems(items))
      .catch((err) => err.status !== 401 && toastError(err));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    loadDay(viewDay);
  }, [loadDay, viewDay]);

  // 切回这个页面时重新拉取：过了零点，昨天完成的会自动消失；在别的设备上的改动也会同步过来
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      setNow(new Date());
      reload();
      loadDay(viewDay);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload, loadDay, viewDay]);

  // 「现在」那条线和「过时了没做完」的红字靠它更新
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const setViewDay = useCallback((day) => setViewDayState(startOfDay(day)), []);

  // 本地先改，两份数据里有它就都换掉
  const patchLocal = useCallback((id, next) => {
    const swap = (list) => list?.map((t) => (t._id === id ? next : t));
    setTodos(swap);
    setDayItems(swap);
  }, []);

  const hold = (todo) => {
    const id = todo._id;
    clearTimeout(timers.current[id]);
    setHeld((h) => ({ ...h, [id]: h[id] ?? todo.done }));
    timers.current[id] = setTimeout(() => {
      delete timers.current[id];
      beforeReorder.current?.();
      setHeld(({ [id]: _, ...rest }) => rest);
    }, SETTLE_MS);
  };

  const add = async (data) => {
    try {
      const todo = await api.createTodo(data);
      setTodos((ts) => [...(ts ?? []), todo]);
      return todo;
    } catch (err) {
      toastError(err);
      return null;
    }
  };

  // 先在界面上打钩，请求失败再改回来
  const toggle = async (todo) => {
    const done = !todo.done;
    hold(todo);
    patchLocal(todo._id, { ...todo, done, completedAt: done ? new Date().toISOString() : null });
    try {
      patchLocal(todo._id, await api.updateTodo(todo._id, { done }));
      // 在时间表上把前几天做完的取消勾选，它要回到清单里
      if (!todos?.some((t) => t._id === todo._id)) reload();
    } catch (err) {
      patchLocal(todo._id, todo);
      toastError(err);
    }
  };

  // 改标题、分类、时间：同样先改界面，失败再改回来。返回是否成功
  const edit = async (todo, changes) => {
    patchLocal(todo._id, { ...todo, ...changes });
    try {
      patchLocal(todo._id, await api.updateTodo(todo._id, changes));
      return true;
    } catch (err) {
      patchLocal(todo._id, todo);
      toastError(err);
      return false;
    }
  };

  const remove = async (todo) => {
    if (!window.confirm(`删除「${todo.title}」？`)) return;
    const drop = (list) => list?.filter((t) => t._id !== todo._id);
    setTodos(drop);
    setDayItems(drop);
    try {
      await api.deleteTodo(todo._id);
    } catch (err) {
      toastError(err);
      reload();
      loadDay(viewDay);
    }
  };

  // 时间表上这一天的待办：清单里的是最新的，优先用；再补上只在时间表接口里的
  const scheduled = useMemo(() => {
    const byId = new Map();
    for (const t of dayItems) byId.set(t._id, t);
    for (const t of todos ?? []) byId.set(t._id, t);
    return [...byId.values()].filter((t) => t.scheduledStart && sameDay(t.scheduledStart, viewDay));
  }, [dayItems, todos, viewDay]);

  const value = {
    todos,
    error,
    reload,
    add,
    toggle,
    edit,
    remove,
    held,
    beforeReorder,
    viewDay,
    setViewDay,
    scheduled,
    draft,
    setDraft,
    now,
  };

  return <TodosContext.Provider value={value}>{children}</TodosContext.Provider>;
}

export const useTodos = () => useContext(TodosContext);

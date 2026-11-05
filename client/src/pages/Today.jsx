import { useCallback, useEffect, useRef, useState } from 'react';
import AddTodo from '../components/AddTodo.jsx';
import CategoryManager from '../components/CategoryManager.jsx';
import CategoryTabs, { ALL, NONE, buildTabs } from '../components/CategoryTabs.jsx';
import Sheet, { DateLine } from '../components/Sheet.jsx';
import TodoItem from '../components/TodoItem.jsx';
import { api } from '../lib/api.js';
import { useCategories } from '../lib/CategoriesContext.jsx';
import { startOfToday } from '../lib/dates.js';
import { load, save } from '../lib/storage.js';
import { toast, toastError } from '../lib/toast.js';
import useFlip from '../lib/useFlip.js';

// 记住上次停在哪个分类
const TAB_KEY = 'todo-tab';

// 打钩后先在原位把钩画完（动画 0.5s），再滑到下面去
const SETTLE_MS = 650;

const time = (value) => new Date(value).getTime();

export default function Today() {
  const { categories, categoryOf } = useCategories();
  const [todos, setTodos] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(() => load(TAB_KEY) ?? ALL);
  const [addCategory, setAddCategory] = useState(() => {
    const saved = load(TAB_KEY);
    return saved && saved !== ALL && saved !== NONE ? saved : '';
  });
  const [managing, setManaging] = useState(false);
  // 刚勾选/取消的条目暂时按原来的状态排序：id → 排序时当作的 done
  const [held, setHeld] = useState({});
  const timers = useRef({});
  const listRef = useRef(null);
  const primeFlip = useFlip(listRef);

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  // 未完成的 + 今天完成的；昨天及以前完成的只在「记录」页出现
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

  useEffect(() => {
    reload();
  }, [reload]);

  // 切回这个页面时重新拉取：过了零点，昨天完成的会自动消失；在别的设备上的改动也会同步过来
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  const list = todos ?? [];
  const tabOf = (todo) => categoryOf(todo)?._id ?? NONE;
  const tabs = buildTabs(categories, {
    showNone: categories.length > 0 && list.some((t) => !categoryOf(t)),
    count: (id) => list.filter((t) => !t.done && (id === ALL || tabOf(t) === id)).length,
  });
  // 记住的分类被删了，或「未分类」里已经没有东西时，回到「全部」
  const activeTab = tabs.some((t) => t.id === tab) ? tab : ALL;
  const newTodoCategory = categories.some((c) => c._id === addCategory) ? addCategory : '';

  // 按分类分段；段内没做完的在上面（按添加顺序），勾掉的沉到下面（按完成顺序）
  const sortDone = (t) => held[t._id] ?? t.done;
  const visible = list
    .filter((t) => activeTab === ALL || tabOf(t) === activeTab)
    .sort((a, b) => {
      const da = sortDone(a);
      const db = sortDone(b);
      if (da !== db) return da ? 1 : -1;
      return da && a.completedAt && b.completedAt
        ? time(a.completedAt) - time(b.completedAt)
        : time(a.createdAt) - time(b.createdAt);
    });
  const showHeadings = categories.length > 0;
  const groups = (activeTab === ALL ? [...categories.map((c) => c._id), NONE] : [activeTab])
    .map((id) => ({
      id,
      name: tabs.find((t) => t.id === id)?.name ?? '未分类',
      color: tabs.find((t) => t.id === id)?.color,
      items: visible.filter((t) => tabOf(t) === id),
    }))
    .filter((g) => g.items.length > 0);
  const doneCount = visible.filter((t) => t.done).length;

  const selectTab = (id) => {
    setTab(id);
    save(TAB_KEY, id);
    if (id !== ALL) setAddCategory(id === NONE ? '' : id);
  };

  const replace = (id, next) => setTodos((ts) => ts.map((t) => (t._id === id ? next : t)));

  const add = async (title) => {
    try {
      const todo = await api.createTodo({ title, category: newTodoCategory || null });
      setTodos((ts) => [...(ts ?? []), todo]);
      const target = todo.category ?? NONE;
      if (activeTab !== ALL && target !== activeTab) {
        toast(`已加到「${categoryOf(todo)?.name ?? '未分类'}」`);
      }
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  };

  // 勾选后先停在原位，等钩画完再滑到该去的位置。连点两下的话按最早的状态算，最后不动
  const hold = (todo) => {
    const id = todo._id;
    clearTimeout(timers.current[id]);
    setHeld((h) => ({ ...h, [id]: h[id] ?? todo.done }));
    timers.current[id] = setTimeout(() => {
      delete timers.current[id];
      primeFlip();
      setHeld(({ [id]: _, ...rest }) => rest);
    }, SETTLE_MS);
  };

  // 先在界面上打钩，请求失败再改回来
  const toggle = async (todo) => {
    const done = !todo.done;
    hold(todo);
    replace(todo._id, { ...todo, done, completedAt: done ? new Date().toISOString() : null });
    try {
      replace(todo._id, await api.updateTodo(todo._id, { done }));
    } catch (err) {
      replace(todo._id, todo);
      toastError(err);
    }
  };

  // 改标题或换分类：同样先改界面，失败再改回来
  const edit = async (todo, changes) => {
    const next = { ...todo, ...changes };
    replace(todo._id, next);
    try {
      replace(todo._id, await api.updateTodo(todo._id, changes));
      if ('category' in changes && activeTab !== ALL && (changes.category ?? NONE) !== activeTab) {
        toast(`已移到「${categoryOf(next)?.name ?? '未分类'}」`);
      }
    } catch (err) {
      replace(todo._id, todo);
      toastError(err);
    }
  };

  const remove = async (todo) => {
    if (!window.confirm(`删除「${todo.title}」？`)) return;
    setTodos((ts) => ts.filter((t) => t._id !== todo._id));
    try {
      await api.deleteTodo(todo._id);
    } catch (err) {
      toastError(err);
      reload();
    }
  };

  const emptyText =
    activeTab === ALL ? '还没有待办，在下面写一条吧' : `「${tabs.find((t) => t.id === activeTab)?.name}」里还没有待办`;

  return (
    <>
      <CategoryTabs tabs={tabs} active={activeTab} onChange={selectTab}>
        <button type="button" className="filter-edit" onClick={() => setManaging(true)}>
          {categories.length ? '编辑分类' : '+ 分类'}
        </button>
      </CategoryTabs>

      <Sheet>
        <DateLine date={new Date()} meta={visible.length ? `${doneCount} / ${visible.length}` : ''} />

        {error ? (
          <p className="sheet-note error">
            {error}
            <button type="button" className="link-btn" onClick={reload}>重试</button>
          </p>
        ) : todos === null ? (
          <p className="sheet-note">加载中…</p>
        ) : (
          <>
            {groups.length === 0 && <p className="sheet-note">{emptyText}</p>}
            <div ref={listRef}>
              {groups.map((g) => (
                <div key={g.id} className="group">
                  {showHeadings && (
                    <h2 className="group-title">
                      <span className="marker" style={g.color ? { '--c': g.color } : undefined}>{g.name}</span>
                    </h2>
                  )}
                  <ul className="todo-list">
                    {g.items.map((todo) => (
                      <TodoItem
                        key={todo._id}
                        todo={todo}
                        bullet={showHeadings ? '↳' : '·'}
                        categories={categories}
                        onToggle={toggle}
                        onDelete={remove}
                        onSave={edit}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <AddTodo
              categories={categories}
              category={newTodoCategory}
              onCategoryChange={setAddCategory}
              onAdd={add}
            />
          </>
        )}
      </Sheet>

      {managing && <CategoryManager onClose={() => setManaging(false)} />}
    </>
  );
}

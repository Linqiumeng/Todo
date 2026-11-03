import { useEffect, useState } from 'react';
import CategoryTabs, { ALL, buildTabs } from '../components/CategoryTabs.jsx';
import Sheet, { DateLine } from '../components/Sheet.jsx';
import { api } from '../lib/api.js';
import { useCategories } from '../lib/CategoriesContext.jsx';
import { dayKey, relativeDay, timeLabel } from '../lib/dates.js';
import { toast, toastError } from '../lib/toast.js';

// 按完成日期分组，保持接口返回的倒序
function groupByDay(items) {
  const groups = [];
  for (const item of items) {
    const key = dayKey(item.completedAt);
    if (groups.at(-1)?.key !== key) groups.push({ key, date: item.completedAt, items: [] });
    groups.at(-1).items.push(item);
  }
  return groups;
}

export default function History() {
  const { categories, categoryOf } = useCategories();
  const [filter, setFilter] = useState(ALL);
  const [items, setItems] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = buildTabs(categories, { showNone: categories.length > 0 });
  const category = filter === ALL ? undefined : filter;

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setLoading(true);
    setError('');
    api
      .listHistory({ category })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setHasMore(page.hasMore);
      })
      .catch((err) => !cancelled && setError(err.status === 401 ? '' : err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const page = await api.listHistory({ category, before: items.at(-1).completedAt });
      setItems((list) => [...list, ...page.items]);
      setHasMore(page.hasMore);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const drop = (id) => setItems((list) => list.filter((t) => t._id !== id));

  const restore = async (todo) => {
    try {
      await api.updateTodo(todo._id, { done: false });
      drop(todo._id);
      toast(`「${todo.title}」已放回待办`);
    } catch (err) {
      toastError(err);
    }
  };

  const remove = async (todo) => {
    if (!window.confirm(`删除「${todo.title}」这条记录？`)) return;
    try {
      await api.deleteTodo(todo._id);
      drop(todo._id);
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      {categories.length > 0 && <CategoryTabs tabs={tabs} active={filter} onChange={setFilter} />}

      <Sheet>
        <div className="date-line">
          <h1 className="sheet-title">完成记录</h1>
          <span className="date-day">archive</span>
        </div>

        {error ? (
          <p className="sheet-note error">{error}</p>
        ) : items === null ? (
          <p className="sheet-note">加载中…</p>
        ) : items.length === 0 ? (
          <p className="sheet-note">还没有完成记录</p>
        ) : (
          <>
            {groupByDay(items).map((group) => (
              <section key={group.key} className="day-group">
                <DateLine date={group.date} relative={relativeDay(group.date)} meta={`${group.items.length} 件`} />
                <ul className="todo-list">
                  {group.items.map((todo) => {
                    const cat = categoryOf(todo);
                    return (
                      <li key={todo._id} className="history-item">
                        <span className="history-time">{timeLabel(todo.completedAt)}</span>
                        <span className="history-title">{todo.title}</span>
                        {filter === ALL && cat && (
                          <span className="history-cat" style={{ '--c': cat.color }}>
                            <span className="dot" aria-hidden="true" />
                            {cat.name}
                          </span>
                        )}
                        <span className="history-actions">
                          <button type="button" className="link-btn" onClick={() => restore(todo)} aria-label="恢复" title="放回待办">↺</button>
                          <button type="button" className="link-btn danger" onClick={() => remove(todo)} aria-label="删除" title="删除记录">×</button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {hasMore && (
              <button type="button" className="sheet-more" onClick={loadMore} disabled={loading}>
                {loading ? '加载中…' : '翻到更早的 →'}
              </button>
            )}
          </>
        )}
      </Sheet>
    </>
  );
}

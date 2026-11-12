import { useEffect, useRef, useState } from 'react';
import AddTodo from '../components/AddTodo.jsx';
import CategoryManager from '../components/CategoryManager.jsx';
import CategoryTabs, { ALL, NONE, buildTabs } from '../components/CategoryTabs.jsx';
import Sheet, { DateLine } from '../components/Sheet.jsx';
import TodoItem from '../components/TodoItem.jsx';
import { useCategories } from '../lib/CategoriesContext.jsx';
import { load, save } from '../lib/storage.js';
import { useTodos } from '../lib/TodosContext.jsx';
import { toast } from '../lib/toast.js';
import useFlip from '../lib/useFlip.js';

// 记住上次停在哪个分类
const TAB_KEY = 'todo-tab';

const time = (value) => new Date(value).getTime();

export default function Today() {
  const { categories, categoryOf } = useCategories();
  const { todos, error, reload, add, toggle, edit, remove, held, beforeReorder, viewDay, setDraft, now } = useTodos();
  const [tab, setTab] = useState(() => load(TAB_KEY) ?? ALL);
  const [addCategory, setAddCategory] = useState(() => {
    const saved = load(TAB_KEY);
    return saved && saved !== ALL && saved !== NONE ? saved : '';
  });
  const [managing, setManaging] = useState(false);
  const listRef = useRef(null);
  const primeFlip = useFlip(listRef);

  // 打钩后的条目滑下去之前，先让清单记下现在的位置
  useEffect(() => {
    beforeReorder.current = primeFlip;
    return () => {
      beforeReorder.current = null;
    };
  }, [beforeReorder, primeFlip]);

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

  const addTodo = async (title) => {
    const todo = await add({ title, category: newTodoCategory || null });
    if (todo && activeTab !== ALL && (todo.category ?? NONE) !== activeTab) {
      toast(`已加到「${categoryOf(todo)?.name ?? '未分类'}」`);
    }
    return Boolean(todo);
  };

  const saveTodo = async (todo, changes) => {
    const ok = await edit(todo, changes);
    if (ok && 'category' in changes && activeTab !== ALL && (changes.category ?? NONE) !== activeTab) {
      toast(`已移到「${categoryOf({ ...todo, ...changes })?.name ?? '未分类'}」`);
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
                        now={now}
                        viewDay={viewDay}
                        onToggle={toggle}
                        onDelete={remove}
                        onSave={saveTodo}
                        onDraft={setDraft}
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
              onAdd={addTodo}
            />
          </>
        )}
      </Sheet>

      {managing && <CategoryManager onClose={() => setManaging(false)} />}
    </>
  );
}

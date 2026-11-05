import { useEffect, useRef, useState } from 'react';
import { isImeEnter } from '../lib/ime.js';

// 勾选时在字上画一个蓝色圆珠笔的钩，和纸质便签本上的一样
function Tick() {
  return (
    <svg className="tick" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 15 Q12 23 21 31 Q48 13 117 2" pathLength="1" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M10.5 2.5l3 3L5.5 13.5 2 14l.5-3.5z M9 4l3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// 改写这一行：回车或点别处保存，Esc 放弃。
// 标题清空等于放弃修改；没改动就不发请求。
function TodoEditor({ todo, bullet, categories, onSave, onClose }) {
  const [title, setTitle] = useState(todo.title);
  const [category, setCategory] = useState(todo.category ?? '');
  const inputRef = useRef(null);
  const closed = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  const finish = (keep) => {
    // 回车保存后表单卸载，失焦还会再触发一次，只处理第一次
    if (closed.current) return;
    closed.current = true;
    onClose();
    if (!keep) return;
    const changes = {};
    const nextTitle = title.trim();
    if (nextTitle && nextTitle !== todo.title) changes.title = nextTitle;
    if ((category || null) !== (todo.category ?? null)) changes.category = category || null;
    if (Object.keys(changes).length) onSave(todo, changes);
  };

  return (
    <li className="todo is-editing">
      <form
        className="todo-edit"
        onSubmit={(e) => {
          e.preventDefault();
          finish(true);
        }}
        // 焦点离开整行（不是在输入框和分类之间切换）才算改完
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
          }
        }}
      >
        <span className="bullet" aria-hidden="true">{bullet}</span>
        <input
          ref={inputRef}
          className="add-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => isImeEnter(e) && e.preventDefault()}
          aria-label="修改待办"
          maxLength={200}
          enterKeyHint="done"
        />
        {categories.length > 0 && (
          <span className="add-cat">
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="分类">
              <option value="">未分类</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </span>
        )}
        <button className="add-submit">保存</button>
      </form>
    </li>
  );
}

export default function TodoItem({ todo, bullet, categories, onToggle, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TodoEditor
        todo={todo}
        bullet={bullet}
        categories={categories}
        onSave={onSave}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <li className={`todo ${todo.done ? 'is-done' : ''}`}>
      <label className="todo-main">
        <input type="checkbox" className="todo-check" checked={todo.done} onChange={() => onToggle(todo)} />
        <span className="bullet" aria-hidden="true">{bullet}</span>
        <span className="todo-text">
          <span className="ink">
            {todo.title}
            <Tick />
          </span>
        </span>
      </label>
      <span className="todo-actions">
        <button type="button" className="todo-btn" aria-label={`修改「${todo.title}」`} title="修改" onClick={() => setEditing(true)}>
          <PencilIcon />
        </button>
        <button type="button" className="todo-btn danger" aria-label={`删除「${todo.title}」`} title="删除" onClick={() => onDelete(todo)}>
          ×
        </button>
      </span>
    </li>
  );
}

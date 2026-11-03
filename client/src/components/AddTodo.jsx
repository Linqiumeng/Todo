import { useState } from 'react';
import { isImeEnter } from '../lib/ime.js';

// 纸上「下一行」：直接写，回车保存。onAdd(title) 返回是否成功，失败时把内容放回去
export default function AddTodo({ categories, category, onCategoryChange, onAdd }) {
  const [text, setText] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setText('');
    if (!(await onAdd(title))) setText((t) => t || title);
  };

  return (
    <form className="add-line" onSubmit={submit}>
      <span className="bullet" aria-hidden="true">+</span>
      <input
        className="add-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => isImeEnter(e) && e.preventDefault()}
        placeholder="写下一件事…"
        aria-label="新待办"
        maxLength={200}
        enterKeyHint="done"
      />
      {text.trim() && <button className="add-submit">添加</button>}
      {categories.length > 0 && (
        <span className="add-cat">
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)} aria-label="加到哪个分类">
            <option value="">未分类</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </span>
      )}
    </form>
  );
}

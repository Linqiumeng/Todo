import { useEffect, useState } from 'react';
import { CATEGORY_COLORS } from '../config.js';
import { api } from '../lib/api.js';
import { useCategories } from '../lib/CategoriesContext.jsx';
import { isImeEnter } from '../lib/ime.js';
import { toastError } from '../lib/toast.js';

// 从底部升起的分类管理弹窗：改名、换颜色、删除、新建
export default function CategoryManager({ onClose }) {
  const { categories, reload } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const add = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    // 先清空输入框，连续添加时不用等请求返回；失败再把名字放回去
    setName('');
    setColor(CATEGORY_COLORS[(CATEGORY_COLORS.indexOf(color) + 1) % CATEGORY_COLORS.length]);
    try {
      await api.createCategory({ name: trimmed, color });
      await reload();
    } catch (err) {
      setName((n) => n || trimmed);
      toastError(err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="category-manager-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">×</button>
        <h2 id="category-manager-title">编辑分类</h2>
        <p className="hint">点圆点换颜色，点名字直接改。删掉的分类里的待办会移到「未分类」。</p>

        {categories.length > 0 ? (
          <ul className="cat-list">
            {categories.map((c) => (
              <CategoryRow key={c._id} category={c} onChanged={reload} />
            ))}
          </ul>
        ) : (
          <p className="hint">还没有分类，先建一个吧。</p>
        )}

        <form className="cat-new" onSubmit={add}>
          <div className="swatches" role="radiogroup" aria-label="新分类的颜色">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={c}
                className={`swatch ${c === color ? 'is-on' : ''}`}
                style={{ '--c': c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <div className="cat-new-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => isImeEnter(e) && e.preventDefault()}
              placeholder="新分类名，如：学习"
              aria-label="新分类名"
              maxLength={20}
            />
            <button className="btn btn-primary" disabled={!name.trim()}>添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryRow({ category, onChanged }) {
  const [name, setName] = useState(category.name);

  useEffect(() => setName(category.name), [category.name]);

  const save = async (update) => {
    try {
      await api.updateCategory(category._id, update);
    } catch (err) {
      toastError(err);
      setName(category.name);
    }
    await onChanged();
  };

  const rename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== category.name) save({ name: trimmed });
    else setName(category.name);
  };

  const nextColor = () => {
    const i = CATEGORY_COLORS.indexOf(category.color);
    save({ color: CATEGORY_COLORS[(i + 1) % CATEGORY_COLORS.length] });
  };

  const remove = async () => {
    if (!window.confirm(`删除分类「${category.name}」？里面的待办会移到「未分类」。`)) return;
    try {
      await api.deleteCategory(category._id);
      await onChanged();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <li className="cat-row">
      <button
        type="button"
        className="swatch"
        style={{ '--c': category.color }}
        onClick={nextColor}
        aria-label={`换「${category.name}」的颜色`}
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={rename}
        onKeyDown={(e) => e.key === 'Enter' && !isImeEnter(e) && e.currentTarget.blur()}
        aria-label="分类名"
        maxLength={20}
      />
      <button type="button" className="link-btn danger" onClick={remove}>删除</button>
    </li>
  );
}

export const ALL = 'all';
export const NONE = 'none';

// 全部 + 各分类 + 未分类（showNone 为真时）
export function buildTabs(categories, { showNone = false, count } = {}) {
  const tabs = [
    { id: ALL, name: '全部' },
    ...categories.map((c) => ({ id: c._id, name: c.name, color: c.color })),
    ...(showNone ? [{ id: NONE, name: '未分类' }] : []),
  ];
  return count ? tabs.map((t) => ({ ...t, count: count(t.id) })) : tabs;
}

// 纸外面的一排分类筛选；children 放在最右边（如「编辑分类」）
export default function CategoryTabs({ tabs, active, onChange, children }) {
  return (
    <div className="filters">
      <div className="filter-list">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`filter ${t.id === active ? 'is-active' : ''}`}
            aria-pressed={t.id === active}
            style={t.color ? { '--c': t.color } : undefined}
            onClick={() => onChange(t.id)}
          >
            {t.color && <span className="dot" aria-hidden="true" />}
            {t.name}
            {t.count > 0 && <span className="filter-count">{t.count}</span>}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

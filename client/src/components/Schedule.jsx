import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCategories } from '../lib/CategoriesContext.jsx';
import { addDays, dayKey, hm, minutesOf, relativeDay, sameDay, shortDate, startOfDay, weekday } from '../lib/dates.js';
import { useTodos } from '../lib/TodosContext.jsx';
import Tick from './Tick.jsx';

// 纸上一行 = 30 分钟，7:00–24:00。第一条横线（7:00）在网格顶部往下 37px，和清单的横线位置一致
const LINE = 44;
const DAY_START = 7 * 60;
const DAY_END = 24 * 60;
const FIRST_RULE = 37;
const yOf = (minutes) => ((minutes - DAY_START) / 30) * LINE + FIRST_RULE;
const HOURS = Array.from({ length: 18 }, (_, i) => 7 + i);

// 这条待办在 day 这天占的分钟段（截到 7:00–24:00 里），不在范围内返回 null
function span(start, end, day) {
  const base = startOfDay(day).getTime();
  const from = Math.max(DAY_START, Math.round((new Date(start) - base) / 60000));
  const to = Math.min(DAY_END, Math.round((new Date(end) - base) / 60000));
  return to > from ? { from, to } : null;
}

// 时间重叠的放成并排的几列：先把互相重叠的串成一组，组内每条放进第一个空着的列
function layout(events) {
  const sorted = [...events].sort((a, b) => a.from - b.from || b.to - a.to);
  const placed = [];
  let group = [];
  let groupEnd = -1;
  const flush = () => {
    const columnEnds = [];
    for (const ev of group) {
      let col = columnEnds.findIndex((end) => end <= ev.from);
      if (col === -1) col = columnEnds.push(0) - 1;
      columnEnds[col] = ev.to;
      ev.col = col;
    }
    for (const ev of group) placed.push({ ...ev, cols: columnEnds.length });
    group = [];
    groupEnd = -1;
  };
  for (const ev of sorted) {
    if (group.length && ev.from >= groupEnd) flush();
    group.push(ev);
    groupEnd = Math.max(groupEnd, ev.to);
  }
  if (group.length) flush();
  return placed;
}

const hours = (minutes) => `${Number((minutes / 60).toFixed(1))} h`;

// 右边竖着的时间表：一张用纸胶带贴在桌上的长纸条
export default function Schedule() {
  const { viewDay, setViewDay, scheduled, draft, now, toggle } = useTodos();
  const { categoryOf } = useCategories();
  const { pathname } = useLocation();
  const scrollRef = useRef(null);

  const isToday = sameDay(viewDay, now);
  const nowMinutes = minutesOf(now);
  const showNow = isToday && nowMinutes >= DAY_START && nowMinutes < DAY_END;

  const colorOf = (todo) => categoryOf(todo)?.color ?? 'var(--muted)';
  const events = [];
  for (const todo of scheduled) {
    // 正在编辑的那条只显示预览框
    if (draft?.id === todo._id) continue;
    const s = span(todo.scheduledStart, todo.scheduledEnd, viewDay);
    if (s) events.push({ ...s, todo, key: todo._id });
  }
  const planned = events.reduce((sum, ev) => sum + ev.to - ev.from, 0);
  const count = events.length;
  if (draft?.start && sameDay(draft.start, viewDay)) {
    const s = span(draft.start, draft.end, viewDay);
    if (s) events.push({ ...s, todo: draft, key: `draft-${draft.id}`, ghost: true });
  }
  const blocks = layout(events);

  // 打开、换日期、在手机上切到时间表时，滚到现在（今天）或 8:00（别的日子）
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = isToday ? Math.min(Math.max(nowMinutes, DAY_START), DAY_END) : 8 * 60;
    el.scrollTop = yOf(target) - LINE * 3;
  }, [dayKey(viewDay), pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toNow = () => {
    if (!isToday) return setViewDay(now);
    scrollRef.current?.scrollTo({ top: yOf(nowMinutes) - LINE * 3, behavior: 'smooth' });
  };

  const rel = relativeDay(viewDay, { withTomorrow: true });

  return (
    <div className="strip">
      <span className="tape" aria-hidden="true" />
      <div className="strip-head rules">
        <div className="date-line">
          <span className="date-day">Schedule</span>
          <span className="date-meta">{count ? `${count} 件 · ${hours(planned)}` : '还没安排'}</span>
        </div>
        <div className="day-nav">
          <button type="button" className="day-step" aria-label="前一天" onClick={() => setViewDay(addDays(viewDay, -1))}>‹</button>
          <button type="button" className="day-label" onClick={() => setViewDay(now)} title="回到今天">
            {rel || shortDate(viewDay)}
          </button>
          <button type="button" className="day-step" aria-label="后一天" onClick={() => setViewDay(addDays(viewDay, 1))}>›</button>
          <span className="day-sub">{rel ? shortDate(viewDay) : weekday(viewDay).slice(0, 3)}</span>
          <button type="button" className="to-now" onClick={toNow}>{isToday ? '回到现在' : '回到今天'}</button>
        </div>
      </div>

      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-grid rules">
          {HOURS.map((h) => (
            <span key={h} className="tl-hour" style={{ top: yOf(h * 60) }}>{String(h).padStart(2, '0')}</span>
          ))}
          <div className="tl-lane">
            {blocks.map((b) => {
              const style = {
                '--c': colorOf(b.todo),
                top: yOf(b.from) + 1,
                height: yOf(b.to) - yOf(b.from) - 1,
                left: `calc(5px + (100% - 5px) * ${b.col / b.cols})`,
                width: `calc((100% - 5px) / ${b.cols} - 5px)`,
              };
              const range = `${hm(b.from)} – ${hm(b.to)}`;
              const short = b.to - b.from < 30;
              const content = (
                <>
                  <span className="tl-title">
                    <span className="ink">
                      {b.todo.title}
                      <Tick />
                    </span>
                  </span>
                  {b.to - b.from >= 60 && <span className="tl-range">{range}</span>}
                </>
              );
              if (b.ghost) {
                return (
                  <div key={b.key} className={`tl-block is-ghost ${short ? 'is-short' : ''}`} style={style} aria-hidden="true">
                    {content}
                  </div>
                );
              }
              return (
                <button
                  key={b.key}
                  type="button"
                  className={`tl-block ${b.todo.done ? 'is-done' : ''} ${short ? 'is-short' : ''}`}
                  style={style}
                  title={`${b.todo.title}  ${range}`}
                  aria-label={`${b.todo.done ? '取消完成' : '完成'}「${b.todo.title}」，${range}`}
                  onClick={() => toggle(b.todo)}
                >
                  {content}
                </button>
              );
            })}
          </div>
          {showNow && (
            <>
              <div className="tl-now" style={{ top: yOf(nowMinutes) }} />
              <span className="tl-now-label" style={{ top: yOf(nowMinutes) }}>{hm(nowMinutes)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

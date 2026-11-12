import { useEffect, useRef, useState } from 'react';
import { addDays, atMinutes, hm, minutesOf, relativeDay, sameDay, shortDate, startOfDay, startOfToday } from '../lib/dates.js';
import { isImeEnter } from '../lib/ime.js';
import Tick from './Tick.jsx';

// 时间表的范围：7:00–24:00；开始时间每 15 分钟一档
const DAY_START = 7 * 60;
const DAY_END = 24 * 60;
const START_OPTIONS = Array.from({ length: (DAY_END - DAY_START) / 15 }, (_, i) => DAY_START + i * 15);
const DURATIONS = [15, 30, 45, 60, 90, 120, 150, 180, 240];
const DAY_OPTIONS = 7; // 今天往后一周

function durationLabel(minutes) {
  if (minutes < 60) return `${minutes} 分钟`;
  return `${minutes / 60} 小时`;
}

const dayLabel = (day) => relativeDay(day, { withTomorrow: true }) || shortDate(day);

// 清单右边显示的时间：今天的只写时间，以后的带上日期。
// 以前排了但没做完的当作没安排（回到清单里重新安排）
function scheduleLabel(todo, now) {
  if (!todo.scheduledStart) return null;
  const start = new Date(todo.scheduledStart);
  if (start < startOfDay(now)) return null;
  const time = hm(minutesOf(start));
  if (sameDay(start, now)) return { text: time, late: !todo.done && new Date(todo.scheduledEnd) <= now };
  return { text: `${dayLabel(start)} ${time}`, late: false };
}

// 编辑时的初始安排；以前的安排不算
function initialSchedule(todo, viewDay) {
  const start = todo.scheduledStart && new Date(todo.scheduledStart);
  if (start && start >= startOfToday()) {
    return {
      day: startOfDay(start),
      time: minutesOf(start),
      duration: Math.round((new Date(todo.scheduledEnd) - start) / 60000),
    };
  }
  return { day: viewDay, time: null, duration: 60 };
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M10.5 2.5l3 3L5.5 13.5 2 14l.5-3.5z M9 4l3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// 改写这一行：回车或点别处保存，Esc 放弃。
// 标题清空等于不改标题；没改动就不发请求。
// 改时间时，右边时间表上会出现一个虚线框预览（onDraft）。
function TodoEditor({ todo, bullet, categories, viewDay, onSave, onDraft, onClose }) {
  const [title, setTitle] = useState(todo.title);
  const [category, setCategory] = useState(todo.category ?? '');
  const [initial] = useState(() => initialSchedule(todo, viewDay));
  const [day, setDay] = useState(initial.day);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(initial.duration);
  const inputRef = useRef(null);
  const closed = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  const start = time == null ? null : atMinutes(day, time);
  const end = time == null ? null : atMinutes(day, time + duration);

  useEffect(() => {
    onDraft?.({ id: todo._id, title: title.trim() || todo.title, category: category || null, start, end });
  }, [todo, title, category, start?.getTime(), end?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => onDraft?.(null), [onDraft]);

  const pickTime = (value) => {
    if (value === '') return setTime(null);
    const minutes = Number(value);
    // 从「不安排」选时间时，排到时间表正在看的那天（看的是以前的日子就排今天）
    if (time == null) setDay(viewDay < startOfToday() ? startOfToday() : viewDay);
    setTime(minutes);
    // 结束不能超过 24:00
    if (minutes + duration > DAY_END) setDuration(DURATIONS.filter((d) => minutes + d <= DAY_END).at(-1));
  };

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
    if (time == null) {
      // 原来有（今天及以后的）安排，现在改成不安排
      if (initial.time != null) Object.assign(changes, { scheduledStart: null, scheduledEnd: null });
    } else if (
      initial.time == null ||
      start.getTime() !== new Date(todo.scheduledStart).getTime() ||
      end.getTime() !== new Date(todo.scheduledEnd).getTime()
    ) {
      Object.assign(changes, { scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() });
    }
    if (Object.keys(changes).length) onSave(todo, changes);
  };

  const today = startOfToday();
  const days = Array.from({ length: DAY_OPTIONS }, (_, i) => addDays(today, i));
  if (!days.some((d) => sameDay(d, day))) days.unshift(day);
  const durations = DURATIONS.filter((d) => time == null || time + d <= DAY_END);
  if (!durations.includes(duration)) durations.push(duration);
  durations.sort((a, b) => a - b);

  return (
    <li className="todo is-editing" data-flip={todo._id}>
      <form
        className="todo-edit"
        onSubmit={(e) => {
          e.preventDefault();
          finish(true);
        }}
        // 焦点离开整行（不是在输入框和几个下拉之间切换）才算改完
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
        <span className="edit-controls">
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
          {time != null && (
            <span className="add-cat is-time">
              <select value={day.getTime()} onChange={(e) => setDay(new Date(Number(e.target.value)))} aria-label="哪天">
                {days.map((d) => (
                  <option key={d.getTime()} value={d.getTime()}>{dayLabel(d)}</option>
                ))}
              </select>
            </span>
          )}
          <span className={`add-cat ${time != null ? 'is-time' : ''}`}>
            <select value={time ?? ''} onChange={(e) => pickTime(e.target.value)} aria-label="开始时间">
              <option value="">{time == null ? '安排时间' : '不安排'}</option>
              {START_OPTIONS.map((m) => (
                <option key={m} value={m}>{hm(m)}</option>
              ))}
            </select>
          </span>
          {time != null && (
            <span className="add-cat is-time">
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} aria-label="时长">
                {durations.map((d) => (
                  <option key={d} value={d}>{durationLabel(d)}</option>
                ))}
              </select>
            </span>
          )}
          <button className="add-submit">保存</button>
        </span>
      </form>
    </li>
  );
}

export default function TodoItem({ todo, bullet, categories, now, viewDay, onToggle, onDelete, onSave, onDraft }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <TodoEditor
        todo={todo}
        bullet={bullet}
        categories={categories}
        viewDay={viewDay}
        onSave={onSave}
        onDraft={onDraft}
        onClose={() => setEditing(false)}
      />
    );
  }

  const schedule = scheduleLabel(todo, now);

  return (
    <li className={`todo ${todo.done ? 'is-done' : ''}`} data-flip={todo._id}>
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
      <span className="todo-side">
        {schedule && (
          <span className={`todo-time ${schedule.late ? 'is-late' : ''}`} title={schedule.late ? '时间已经过了' : undefined}>
            {schedule.text}
          </span>
        )}
        <span className="todo-actions">
          <button type="button" className="todo-btn" aria-label={`修改「${todo.title}」`} title="修改" onClick={() => setEditing(true)}>
            <PencilIcon />
          </button>
          <button type="button" className="todo-btn danger" aria-label={`删除「${todo.title}」`} title="删除" onClick={() => onDelete(todo)}>
            ×
          </button>
        </span>
      </span>
    </li>
  );
}

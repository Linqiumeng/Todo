// 勾选时在字上画一个蓝色圆珠笔的钩，和纸质便签本上的一样
function Tick() {
  return (
    <svg className="tick" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 15 Q12 23 21 31 Q48 13 117 2" pathLength="1" />
    </svg>
  );
}

export default function TodoItem({ todo, bullet, onToggle, onDelete }) {
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
      <button type="button" className="todo-delete" aria-label={`删除「${todo.title}」`} onClick={() => onDelete(todo)}>
        ×
      </button>
    </li>
  );
}

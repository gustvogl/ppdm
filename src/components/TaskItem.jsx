import Icon from "./Icon.jsx";
import {
  dateKey,
  dateLabel,
  priorityNames,
  statusNames,
} from "../lib/dates.js";
export default function TaskItem({
  task,
  project,
  busy,
  onEdit,
  onDelete,
  onUpdate,
  board = false,
}) {
  const overdue =
    task.due_date && task.due_date < dateKey() && task.status !== "done";
  const steps = task.checklist || [];
  return (
    <article
      className={`n-task ${board ? "board-card" : ""} ${task.status === "done" ? "is-done" : ""}`}
      draggable={board && !busy}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/nexo-task", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <button
        className="n-task-check"
        aria-label={`${task.status === "done" ? "Reabrir" : "Concluir"} ${task.title}`}
        disabled={busy}
        onClick={() =>
          onUpdate(task, {
            status: task.status === "done" ? "pending" : "done",
          })
        }
      >
        {task.status === "done" && <Icon name="check" size={15} />}
        {task.status === "in_progress" && <span />}
      </button>
      <div className="n-task-body">
        <button className="n-task-title" onClick={() => onEdit(task)}>
          <h3>{task.title}</h3>
        </button>
        {task.description && (
          <p className="n-task-description">{task.description}</p>
        )}
        <div className="n-task-meta">
          {project && (
            <span className="project-label">
              <i style={{ background: project.color }} />
              {project.name}
            </span>
          )}
          <span className={`due-label ${overdue ? "overdue" : ""}`}>
            <Icon name="calendar" size={12} />
            {dateLabel(task.due_date)}
            {overdue ? " · atrasada" : ""}
          </span>
          {steps.length > 0 && (
            <span>
              <Icon name="list" size={12} />
              {steps.filter((s) => s.done).length}/{steps.length}
            </span>
          )}
          {(task.tags || []).slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <span className={`n-priority ${task.priority}`}>
        <i />
        {priorityNames[task.priority]}
      </span>
      <div className="n-task-actions">
        <button
          className={`icon-button ${task.pinned ? "is-pinned" : ""}`}
          aria-label={`${task.pinned ? "Desfavoritar" : "Favoritar"} ${task.title}`}
          aria-pressed={task.pinned}
          disabled={busy}
          onClick={() => onUpdate(task, { pinned: !task.pinned })}
        >
          <Icon name="star" size={17} />
        </button>
        <button
          className="icon-button"
          aria-label={`Editar ${task.title}`}
          disabled={busy}
          onClick={() => onEdit(task)}
        >
          <Icon name="edit" size={17} />
        </button>
        <button
          className="icon-button"
          aria-label={`Excluir ${task.title}`}
          disabled={busy}
          onClick={() => onDelete(task)}
        >
          <Icon name="trash" size={17} />
        </button>
      </div>
      {board && (
        <label className="board-status">
          <span className="sr-only">Mover {task.title}</span>
          <select
            aria-label={`Mover ${task.title}`}
            value={task.status}
            disabled={busy}
            onChange={(e) => onUpdate(task, { status: e.target.value })}
          >
            {Object.entries(statusNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Icon name="down" size={13} />
        </label>
      )}
    </article>
  );
}

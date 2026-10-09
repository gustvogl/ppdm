import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import {
  dateKey,
  dateLabel,
  monthDays,
  parseDate,
  priorityNames,
} from "../lib/dates.js";

export default function CalendarView({ tasks, onEdit, onAdd, disabled }) {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(dateKey());
  const byDate = useMemo(() => {
    const map = new Map();
    for (const task of tasks)
      if (task.due_date)
        map.set(task.due_date, [...(map.get(task.due_date) || []), task]);
    return map;
  }, [tasks]);
  const dayTasks = byDate.get(selected) || [];
  function moveMonth(delta) {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1, 12),
    );
  }
  return (
    <div className="calendar-layout">
      <section className="n-panel calendar-panel">
        <div className="n-panel-heading">
          <h2>
            {month.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="calendar-controls">
            <button
              className="button subtle"
              onClick={() => {
                setMonth(new Date());
                setSelected(dateKey());
              }}
            >
              Hoje
            </button>
            <button
              className="icon-button"
              aria-label="Mês anterior"
              onClick={() => moveMonth(-1)}
            >
              <Icon name="left" />
            </button>
            <button
              className="icon-button"
              aria-label="Próximo mês"
              onClick={() => moveMonth(1)}
            >
              <Icon name="right" />
            </button>
          </div>
        </div>
        <div
          className="calendar-grid"
          role="group"
          aria-label="Escolher dia do calendário"
        >
          {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => (
            <span className="calendar-weekday" key={d}>
              {d}
            </span>
          ))}
          {monthDays(month).map((day) => {
            const key = dateKey(day);
            const list = byDate.get(key) || [];
            return (
              <button
                key={key}
                className={`calendar-day ${day.getMonth() !== month.getMonth() ? "other-month" : ""} ${key === dateKey() ? "today" : ""} ${key === selected ? "selected" : ""}`}
                aria-pressed={key === selected}
                aria-label={`${day.toLocaleDateString("pt-BR")}, ${list.length} tarefas`}
                onClick={() => setSelected(key)}
              >
                <span>{day.getDate()}</span>
                <div className="calendar-dots">
                  {list.slice(0, 3).map((t) => (
                    <i
                      key={t.id}
                      className={t.status === "done" ? "done" : t.priority}
                    />
                  ))}
                  {list.length > 3 && <small>+{list.length - 3}</small>}
                </div>
                <div className="calendar-preview">
                  {list.slice(0, 2).map((t) => (
                    <span
                      key={t.id}
                      className={t.status === "done" ? "line-done" : ""}
                    >
                      {t.title}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <div className="calendar-legend">
          <span>
            <i />
            Com tarefas
          </span>
          <span>
            <i className="done" />
            Concluída
          </span>
          <span>
            <i className="high" />
            Alta prioridade
          </span>
        </div>
      </section>
      <section className="n-panel day-agenda">
        <span className="eyebrow">SUA AGENDA</span>
        <h2>
          {parseDate(selected).toLocaleDateString("pt-BR", { weekday: "long" })}
        </h2>
        <p>
          {dateLabel(selected)} · {dayTasks.length} tarefas
        </p>
        <button
          className="button secondary"
          onClick={() => onAdd({ due_date: selected })}
          disabled={disabled}
        >
          <Icon name="plus" size={17} />
          Tarefa neste dia
        </button>
        {dayTasks.length ? (
          <div className="agenda-items">
            {dayTasks.map((t) => (
              <button
                key={t.id}
                className={`agenda-item ${t.status === "done" ? "is-done" : ""}`}
                onClick={() => onEdit(t)}
              >
                <i className={`priority-dot ${t.priority}`} />
                <strong>{t.title}</strong>
                <small>
                  {t.status === "done"
                    ? "Concluída"
                    : `${priorityNames[t.priority]} prioridade`}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <div className="small-empty">
            <Icon name="sun" size={30} />
            <p>
              Um pouco de espaço na agenda.
              <br />
              Adicione um próximo passo.
            </p>
          </div>
        )}
        <small className="agenda-note">
          Tarefas sem prazo aparecem na lista de tarefas.
        </small>
      </section>
    </div>
  );
}

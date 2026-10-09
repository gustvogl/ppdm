import { dateKey, priorityNames } from "../lib/dates.js";
import Icon from "./Icon.jsx";

export default function AnalyticsView({ tasks, projects, brief = false }) {
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - 6 + i);
    const key = dateKey(day);
    return {
      key,
      label: day
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", ""),
      count: tasks.filter(
        (t) =>
          t.status === "done" &&
          t.completed_at &&
          dateKey(new Date(t.completed_at)) === key,
      ).length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="analytics-grid">
      <section className="n-panel">
        <div className="n-panel-heading">
          <div>
            <h2>Pequenas conquistas</h2>
            <p>Tarefas concluídas nos últimos 7 dias</p>
          </div>
          <span className="metric-badge">
            <Icon name="check" size={14} />
            {days.reduce((sum, d) => sum + d.count, 0)}
          </span>
        </div>
        <div
          className="weekly-chart"
          role="img"
          aria-label={`Conclusões nos últimos 7 dias: ${days.map((d) => `${d.label}: ${d.count}`).join(", ")}`}
        >
          {days.map((d) => (
            <div className="chart-column" key={d.key}>
              <span>{d.count}</span>
              <div className="chart-track">
                <i
                  style={{
                    height: `${d.count ? Math.max(5, (d.count / max) * 100) : 0}%`,
                  }}
                />
              </div>
              <small>{d.label}</small>
            </div>
          ))}
        </div>
      </section>
      {!brief && (
        <>
          <section className="n-panel completion-panel">
            <div className="n-panel-heading">
              <div>
                <h2>Seu progresso</h2>
                <p>Distribuição das tarefas atuais</p>
              </div>
            </div>
            <div className="completion-content">
              <div
                className="progress-donut"
                style={{ "--progress": `${progress}%` }}
                role="img"
                aria-label={`${progress}% das tarefas concluídas`}
              >
                <span>
                  <strong>{progress}%</strong>
                  <small>concluído</small>
                </span>
              </div>
              <dl className="status-breakdown">
                {[
                  ["pending", "A fazer"],
                  ["in_progress", "Em andamento"],
                  ["done", "Concluídas"],
                ].map(([status, label]) => (
                  <div key={status}>
                    <dt>
                      <i className={status} />
                      {label}
                    </dt>
                    <dd>{tasks.filter((t) => t.status === status).length}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
          <section className="n-panel">
            <div className="n-panel-heading">
              <div>
                <h2>Por projeto</h2>
                <p>Passos concluídos em cada objetivo</p>
              </div>
            </div>
            <div className="project-progress-list">
              {[
                ...projects,
                { id: null, name: "Sem projeto", color: "#8e9b90" },
              ].map((p) => {
                const list = tasks.filter(
                  (t) => (t.project_id || null) === p.id,
                );
                const count = list.filter((t) => t.status === "done").length;
                return (
                  <div key={p.id || "none"}>
                    <div>
                      <span>
                        <i style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <strong>
                        {count}/{list.length}
                      </strong>
                    </div>
                    <div className="n-progress-track">
                      <i
                        style={{
                          width: `${list.length ? (count / list.length) * 100 : 0}%`,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="n-panel">
            <div className="n-panel-heading">
              <div>
                <h2>Onde concentrar energia</h2>
                <p>Prioridades das tarefas ainda abertas</p>
              </div>
            </div>
            <div className="priority-summary">
              {["high", "medium", "low"].map((p) => (
                <div key={p}>
                  <span className={`n-priority ${p}`}>
                    <i />
                    {priorityNames[p]}
                  </span>
                  <strong>
                    {
                      tasks.filter(
                        (t) => t.priority === p && t.status !== "done",
                      ).length
                    }
                  </strong>
                </div>
              ))}
            </div>
            <p className="panel-footnote">
              Os indicadores consideram seus registros atuais. Tarefas excluídas
              deixam de entrar nos cálculos.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

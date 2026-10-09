import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

export default function FocusView({ tasks, preferences, onFinish, hidden }) {
  const [mode, setMode] = useState("focus");
  const duration =
    (mode === "focus" ? preferences.focusMinutes : preferences.breakMinutes) *
    60;
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [sessions, setSessions] = useState(0);
  const deadline = useRef(0);
  useEffect(() => {
    setRemaining(duration);
    setRunning(false);
  }, [duration, mode]);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const seconds = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(seconds);
      if (!seconds) {
        setRunning(false);
        if (mode === "focus") setSessions((s) => s + 1);
        onFinish(
          mode === "focus"
            ? "Seu bloco de foco terminou. Hora de respirar um pouco."
            : "Pausa concluída. Pronto para o próximo passo?",
        );
      }
    };
    const interval = setInterval(tick, 500);
    tick();
    return () => clearInterval(interval);
  }, [running, mode, onFinish]);
  function toggle() {
    if (running) setRunning(false);
    else {
      deadline.current = Date.now() + (remaining || duration) * 1000;
      setRunning(true);
    }
  }
  const selected = tasks.find((t) => t.id === selectedId);
  return (
    <section className="focus-layout" hidden={hidden}>
      <div className="n-panel focus-card">
        <div className="segmented-control">
          <button
            className={mode === "focus" ? "active" : ""}
            aria-pressed={mode === "focus"}
            onClick={() => setMode("focus")}
          >
            Foco
          </button>
          <button
            className={mode === "break" ? "active" : ""}
            aria-pressed={mode === "break"}
            onClick={() => setMode("break")}
          >
            Pausa
          </button>
        </div>
        <div
          className="focus-ring"
          style={{ "--progress": `${100 - (remaining / duration) * 100}%` }}
        >
          <div>
            <span className="eyebrow">
              {running ? "UM PASSO DE CADA VEZ" : "NO SEU RITMO"}
            </span>
            <span
              className="focus-time"
              role="timer"
              aria-label="Tempo restante"
            >
              {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
            <small>
              {mode === "focus"
                ? "Hora de se concentrar"
                : "Hora de recarregar"}
            </small>
          </div>
        </div>
        <div className="focus-actions">
          <button className="button primary" onClick={toggle}>
            <Icon name={running ? "pause" : "play"} size={18} />
            {running
              ? "Pausar"
              : remaining === duration || remaining === 0
                ? "Começar"
                : "Continuar"}
          </button>
          <button
            className="icon-button"
            aria-label="Reiniciar timer"
            onClick={() => {
              setRunning(false);
              setRemaining(duration);
            }}
          >
            <Icon name="refresh" />
          </button>
        </div>
        <label className="field">
          <span>Qual tarefa merece sua atenção?</span>
          <select
            aria-label="Qual tarefa merece sua atenção?"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Um bloco de foco livre</option>
            {tasks
              .filter((t) => t.status !== "done")
              .map((t) => (
                <option value={t.id} key={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </label>
        {selected && <p className="focus-selected">{selected.title}</p>}
      </div>
      <aside className="n-panel focus-guide">
        <span className="round-icon">
          <Icon name="leaf" size={27} />
        </span>
        <h2>
          Mais presença.
          <br />
          Menos pressa.
        </h2>
        <p>
          Escolha uma tarefa, comece o timer e reserve este tempo para um passo
          de verdade.
        </p>
        <ol>
          <li>Feche o que pode esperar.</li>
          <li>Trabalhe no próximo passo.</li>
          <li>Faça uma pausa ao terminar.</li>
        </ol>
        <div className="focus-session-count">
          <strong>{sessions}</strong>
          <span>
            blocos concluídos
            <br />
            nesta sessão
          </span>
        </div>
        <small>
          Um aviso aparece no app ao terminar. Mantenha o aplicativo aberto.
          Ajuste a duração em Configurações.
        </small>
      </aside>
    </section>
  );
}

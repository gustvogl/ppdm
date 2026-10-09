import { useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { normalizeTask } from "../lib/tasks.js";
import { taskErrorMessage } from "../lib/errors.js";

export default function TaskForm({
  task,
  projects = [],
  initial = {},
  onSave,
  onClose,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    project_id: "",
    tags: [],
    checklist: [],
    pinned: false,
    ...initial,
    ...task,
  });
  const [tags, setTags] = useState((form.tags || []).join(", "));
  const [step, setStep] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  function addStep() {
    if (!step.trim() || form.checklist.length >= 30) return;
    setForm((f) => ({
      ...f,
      checklist: [...f.checklist, { text: step.trim(), done: false }],
    }));
    setStep("");
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    let fields;
    try {
      fields = normalizeTask({ ...form, tags: tags.split(",") });
    } catch (err) {
      setError(err.message);
      return;
    }
    setBusy(true);
    try {
      await onSave(fields, task?.id);
    } catch (err) {
      setError(taskErrorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal
      title={task ? "Editar tarefa" : "O que vamos organizar?"}
      subtitle="Dê forma ao seu próximo passo."
      onClose={onClose}
      busy={busy}
    >
      <form className="task-form" onSubmit={submit}>
        <fieldset className="form-fieldset" disabled={busy}>
          {error && (
            <div role="alert" className="notice error-notice">
              {error}
            </div>
          )}
          <label className="field">
            <span>Título</span>
            <input
              autoFocus
              name="title"
              required
              minLength={2}
              maxLength={120}
              value={form.title}
              onChange={change}
              placeholder="Ex.: revisar o projeto de PPDM2"
            />
          </label>
          <label className="field">
            <span>
              Descrição <small>opcional</small>
            </span>
            <textarea
              name="description"
              maxLength={2000}
              value={form.description}
              onChange={change}
              rows={3}
              placeholder="Anote os detalhes que ajudam você."
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Projeto</span>
              <select
                aria-label="Projeto"
                name="project_id"
                value={form.project_id || ""}
                onChange={change}
              >
                <option value="">Sem projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>
                Data <small>opcional</small>
              </span>
              <input
                type="date"
                name="due_date"
                value={form.due_date || ""}
                onChange={change}
              />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Prioridade</span>
              <select
                aria-label="Prioridade"
                name="priority"
                value={form.priority}
                onChange={change}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select
                aria-label="Status"
                name="status"
                value={form.status}
                onChange={change}
              >
                <option value="pending">A fazer</option>
                <option value="in_progress">Em andamento</option>
                <option value="done">Concluída</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>
              Etiquetas <small>separe por vírgulas</small>
            </span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              maxLength={210}
              placeholder="faculdade, pessoal, revisão"
            />
          </label>
          <div className="checklist-editor">
            <span className="field-title">
              Checklist{" "}
              <small>
                {form.checklist.filter((s) => s.done).length}/
                {form.checklist.length} passos
              </small>
            </span>
            {form.checklist.map((item, i) => (
              <div className="checklist-line" key={i}>
                <input
                  type="checkbox"
                  aria-label={`Concluir passo ${item.text}`}
                  checked={item.done}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      checklist: f.checklist.map((s, n) =>
                        n === i ? { ...s, done: e.target.checked } : s,
                      ),
                    }))
                  }
                />
                <span className={item.done ? "line-done" : ""}>
                  {item.text}
                </span>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remover passo ${item.text}`}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      checklist: f.checklist.filter((_, n) => n !== i),
                    }))
                  }
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}
            <div className="step-input">
              <input
                aria-label="Novo passo do checklist"
                maxLength={160}
                placeholder="Adicionar um pequeno passo…"
                value={step}
                onChange={(e) => setStep(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addStep();
                  }
                }}
              />
              <button
                type="button"
                className="icon-button"
                aria-label="Adicionar passo"
                onClick={addStep}
                disabled={!step.trim() || form.checklist.length >= 30}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) =>
                setForm((f) => ({ ...f, pinned: e.target.checked }))
              }
            />
            <Icon name="star" size={16} /> Marcar como favorita
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="button primary" type="submit">
              {busy ? "Salvando…" : "Salvar tarefa"}
              <Icon name="check" size={17} />
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

import { useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { normalizeTask } from "../lib/tasks.js";
import { taskErrorMessage } from "../lib/errors.js";

export default function TaskForm({ task, onSave, onClose }) {
  const [form, setForm] = useState(
    task || {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    try {
      normalizeTask(form);
    } catch (err) {
      setError(err.message);
      return;
    }
    setBusy(true);
    try {
      await onSave(form, task?.id);
    } catch (err) {
      setError(taskErrorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal
      title={task ? "Editar tarefa" : "O que vamos organizar?"}
      subtitle="Pequenos passos também contam."
      onClose={onClose}
      busy={busy}
    >
      <form className="task-form" onSubmit={submit}>
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
            disabled={busy}
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
            disabled={busy}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Prioridade</span>
            <select
              name="priority"
              value={form.priority}
              onChange={change}
              disabled={busy}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
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
              disabled={busy}
            />
          </label>
        </div>
        <label className="field">
          <span>Status</span>
          <select
            name="status"
            value={form.status}
            onChange={change}
            disabled={busy}
          >
            <option value="pending">Pendente</option>
            <option value="done">Concluída</option>
          </select>
        </label>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? "Salvando…" : "Salvar tarefa"}
            <Icon name="check" size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

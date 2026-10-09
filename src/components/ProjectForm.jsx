import { useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { PROJECT_COLORS, normalizeProject } from "../lib/projects.js";
import { taskErrorMessage } from "../lib/errors.js";
export default function ProjectForm({ project, onSave, onClose }) {
  const [form, setForm] = useState(
    project || { name: "", description: "", color: PROJECT_COLORS[0] },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    try {
      normalizeProject(form);
    } catch (err) {
      setError(err.message);
      return;
    }
    setBusy(true);
    try {
      await onSave(form, project?.id);
    } catch (err) {
      setError(taskErrorMessage(err));
      setBusy(false);
    }
  }
  return (
    <Modal
      title={project ? "Editar projeto" : "Um novo projeto."}
      subtitle="Reúna os passos de uma mesma ideia."
      onClose={onClose}
      busy={busy}
    >
      <form className="task-form" onSubmit={submit}>
        <fieldset className="form-fieldset" disabled={busy}>
          {error && (
            <div className="notice error-notice" role="alert">
              {error}
            </div>
          )}
          <label className="field">
            <span>Nome do projeto</span>
            <input
              autoFocus
              minLength={2}
              maxLength={80}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Faculdade"
            />
          </label>
          <label className="field">
            <span>Descrição do projeto</span>
            <textarea
              maxLength={500}
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Qual é o objetivo deste projeto?"
            />
          </label>
          <span className="field-title">Cor do projeto</span>
          <div className="color-picker">
            {PROJECT_COLORS.map((color, i) => (
              <button
                key={color}
                type="button"
                style={{ background: color }}
                className={form.color === color ? "selected" : ""}
                aria-label={`Cor ${i + 1}`}
                aria-pressed={form.color === color}
                onClick={() => setForm((f) => ({ ...f, color }))}
              >
                {form.color === color && <Icon name="check" />}
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button className="button primary">
              {busy ? "Salvando…" : "Salvar projeto"}
              <Icon name="check" size={17} />
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

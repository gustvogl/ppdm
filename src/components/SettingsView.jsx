import { useRef, useState } from "react";
import Icon from "./Icon.jsx";
import Modal from "./Modal.jsx";
import {
  backupData,
  downloadFile,
  readBackup,
  tasksCsv,
} from "../lib/backup.js";
import { dateKey } from "../lib/dates.js";

export default function SettingsView({
  preferences,
  setPreference,
  storageError,
  tasks,
  projects,
  loading,
  onImport,
  install,
}) {
  const input = useRef(null);
  const [backup, setBackup] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function selectFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Escolha um arquivo JSON de até 5 MB.");
      setBackup(readBackup(await file.text()));
    } catch (err) {
      setError(err.message || "Não foi possível ler o arquivo.");
    }
  }
  async function importData() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onImport(backup, setProgress);
      setMessage(
        "Importação concluída. Seus novos projetos e tarefas já estão disponíveis.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setBackup(null);
      setProgress("");
    }
  }
  async function installApp() {
    try {
      await install.install();
    } catch {
      setError(
        "Não foi possível abrir a instalação. Use a opção de instalar no menu do navegador.",
      );
    }
  }
  return (
    <div className="settings-grid">
      {error && (
        <div className="notice error-notice full-width" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice success-notice full-width" role="status">
          {message}
        </div>
      )}
      <section className="n-panel settings-panel">
        <span className="round-icon">
          <Icon name="sun" />
        </span>
        <h2>Do seu jeito</h2>
        <p>Preferências salvas neste navegador, separadas por conta.</p>
        {storageError && (
          <div className="notice error-notice" role="alert">
            O navegador bloqueou o armazenamento. As preferências duram apenas
            nesta sessão.
          </div>
        )}
        <label className="field">
          <span>Aparência</span>
          <select
            aria-label="Aparência"
            value={preferences.theme}
            onChange={(e) => setPreference("theme", e.target.value)}
          >
            <option value="system">Seguir o sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
        <label className="switch-row">
          <span>
            <strong>Lista compacta</strong>
            <small>Mais tarefas no mesmo espaço.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Lista compacta"
            checked={preferences.compact}
            onChange={(e) => setPreference("compact", e.target.checked)}
          />
        </label>
        <label className="field">
          <span>Prioridade de novas tarefas</span>
          <select
            aria-label="Prioridade de novas tarefas"
            value={preferences.priority}
            onChange={(e) => setPreference("priority", e.target.value)}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>
      </section>
      <section className="n-panel settings-panel">
        <span className="round-icon">
          <Icon name="clock" />
        </span>
        <h2>Seu ritmo de foco</h2>
        <p>
          A mudança reinicia o timer. Escolha um ritmo confortável para você.
        </p>
        <label className="field">
          <span>Duração do foco</span>
          <select
            aria-label="Duração do foco"
            value={preferences.focusMinutes}
            onChange={(e) =>
              setPreference("focusMinutes", Number(e.target.value))
            }
          >
            {[15, 25, 45, 60].map((n) => (
              <option key={n} value={n}>
                {n} minutos
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Duração da pausa</span>
          <select
            aria-label="Duração da pausa"
            value={preferences.breakMinutes}
            onChange={(e) =>
              setPreference("breakMinutes", Number(e.target.value))
            }
          >
            {[5, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n} minutos
              </option>
            ))}
          </select>
        </label>
        <div className="keyboard-help">
          <span>Atalhos no computador</span>
          <div>
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
            <small>Buscar tarefas</small>
          </div>
          <div>
            <kbd>N</kbd>
            <small>Nova tarefa</small>
          </div>
          <div>
            <kbd>Esc</kbd>
            <small>Fechar janela</small>
          </div>
        </div>
      </section>
      <section className="n-panel settings-panel">
        <span className="round-icon">
          <Icon name="download" />
        </span>
        <h2>Seus dados com você</h2>
        <p>
          Baixe uma cópia das tarefas e dos projetos. Os arquivos podem conter
          suas anotações pessoais.
        </p>
        <div className="settings-actions">
          <button
            className="button secondary"
            disabled={loading}
            onClick={() =>
              downloadFile(
                `nexo-backup-${dateKey()}.json`,
                JSON.stringify(backupData(tasks, projects), null, 2),
                "application/json",
              )
            }
          >
            <Icon name="download" size={17} />
            Exportar backup JSON
          </button>
          <button
            className="button secondary"
            disabled={loading}
            onClick={() =>
              downloadFile(
                `nexo-tarefas-${dateKey()}.csv`,
                tasksCsv(tasks, projects),
                "text/csv;charset=utf-8",
              )
            }
          >
            <Icon name="chart" size={17} />
            Exportar planilha CSV
          </button>
          <button
            className="button secondary"
            disabled={loading || busy}
            onClick={() => input.current.click()}
          >
            <Icon name="upload" size={17} />
            Importar backup JSON
          </button>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Selecionar backup JSON"
            onChange={selectFile}
          />
        </div>
        <small>
          Importar adiciona registros à conta atual. Importar o mesmo arquivo
          novamente cria cópias.
        </small>
      </section>
      <section className="n-panel settings-panel">
        <span className="round-icon">
          <Icon name="leaf" />
        </span>
        <h2>O Nexo no seu celular</h2>
        <p>
          Instale o aplicativo pela opção do seu navegador e abra pela tela
          inicial.
        </p>
        {install.installed ? (
          <div className="install-status">
            <Icon name="check" size={18} />
            Você está usando o aplicativo instalado.
          </div>
        ) : install.canInstall ? (
          <button className="button primary" onClick={installApp}>
            <Icon name="download" size={17} />
            Instalar Nexo
          </button>
        ) : (
          <div className="install-help">
            <strong>Android / computador</strong>
            <p>Abra o menu do navegador e procure “Instalar aplicativo”.</p>
            <strong>iPhone / iPad</strong>
            <p>
              No Safari, toque em Compartilhar → Adicionar à Tela de Início.
            </p>
          </div>
        )}
        <small>
          A instalação depende do navegador e de uma hospedagem HTTPS. É
          necessário estar conectado para entrar e salvar dados.
        </small>
        <div className="version-label">
          <strong>Nexo 2.0</strong>
          <span>Seu próximo passo.</span>
        </div>
      </section>
      {backup && (
        <Modal
          title="Adicionar seu backup?"
          subtitle="Confira os dados antes de importar."
          busy={busy}
          onClose={() => setBackup(null)}
        >
          <div className="import-summary">
            <strong>{backup.projects.length} projetos</strong>
            <strong>{backup.tasks.length} tarefas</strong>
          </div>
          <p className="modal-description">
            Os registros serão adicionados à sua conta, mantendo o que já
            existe. Uma interrupção pode deixar parte dos registros importada.
          </p>
          {progress && (
            <p role="status" className="import-progress">
              {progress}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setBackup(null)}
            >
              Cancelar
            </button>
            <button
              className="button primary"
              disabled={
                busy || (!backup.tasks.length && !backup.projects.length)
              }
              onClick={importData}
            >
              {busy ? "Importando…" : "Importar para minha conta"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTasks } from "../hooks/useTasks.js";
import { authErrorMessage, taskErrorMessage } from "../lib/errors.js";
import Brand from "../components/Brand.jsx";
import Icon from "../components/Icon.jsx";
import TaskForm from "../components/TaskForm.jsx";
import Modal from "../components/Modal.jsx";

const priorityNames = { low: "Baixa", medium: "Média", high: "Alta" };
function dateLabel(value) {
  if (!value) return "Sem data";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
function Avatar({ user, large = false }) {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Usuário";
  const url = user.user_metadata?.avatar_url;
  const [failed, setFailed] = useState(false);
  const safe = typeof url === "string" && /^https?:\/\//i.test(url);
  return (
    <span className={`avatar ${large ? "avatar-large" : ""}`}>
      {safe && !failed ? (
        <img
          src={url}
          alt={`Foto de ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={`Perfil de ${name}`}>
          {name.charAt(0).toLocaleUpperCase("pt-BR")}
        </span>
      )}
    </span>
  );
}

export default function Workspace() {
  const { user, signOut } = useAuth();
  const {
    tasks,
    loading,
    error: loadError,
    refresh,
    save,
    remove,
  } = useTasks(user.id);
  const [view, setView] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [formTask, setFormTask] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const name =
    user.user_metadata?.full_name || user.user_metadata?.name || "Seu espaço";
  const firstName = name.split(" ")[0];
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filter === "all" || t.status === filter) &&
          `${t.title} ${t.description}`
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [tasks, filter, search],
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function logout() {
    if (logoutPending) return;
    setLogoutPending(true);
    setError("");
    try {
      await signOut();
    } catch (err) {
      setError(authErrorMessage(err));
      setLogoutPending(false);
    }
  }
  async function saveForm(form, id) {
    await save(form, id);
    setFormTask(undefined);
    setToast(id ? "Tarefa atualizada." : "Seu próximo passo foi criado.");
  }
  async function toggleTask(task) {
    if (busyId || loading) return;
    setBusyId(task.id);
    setError("");
    try {
      await save(
        { ...task, status: task.status === "done" ? "pending" : "done" },
        task.id,
      );
      setToast(
        task.status === "done"
          ? "Tarefa reaberta."
          : "Mais uma conquista. Tarefa concluída!",
      );
    } catch (err) {
      setError(taskErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }
  async function confirmDelete() {
    if (busyId) return;
    setBusyId(deleting.id);
    setDeleteError("");
    try {
      await remove(deleting.id);
      setDeleting(null);
      setToast("Tarefa excluída.");
    } catch (err) {
      setDeleteError(taskErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  const navItems = [
    { id: "overview", icon: "grid", label: "Visão geral" },
    { id: "tasks", icon: "list", label: "Minhas tarefas" },
    { id: "profile", icon: "leaf", label: "Meu perfil" },
  ];

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <span className="nav-caption">MEU ESPAÇO</span>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "tasks" && (
                <span className="nav-count">{tasks.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-star">✳</span>
          <strong>Você está no caminho.</strong>
          <p>Um passo pequeno ainda é um passo à frente.</p>
        </div>
        <div className="sidebar-account">
          <Avatar user={user} />
          <div>
            <strong>{name}</strong>
            <span>Conta pessoal</span>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            disabled={logoutPending}
            aria-label="Sair da conta"
          >
            <Icon name="logout" size={19} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-top">
          <span className="mobile-work-brand">
            <Brand />
          </span>
          <span className="breadcrumb">
            Meu espaço <span>/</span>{" "}
            {navItems.find((i) => i.id === view).label}
          </span>
          <div className="top-account">
            <span className="private-pill">
              <Icon name="lock" size={13} />
              Só você
            </span>
            <button
              className="avatar-button"
              onClick={() => setView("profile")}
              aria-label="Abrir meu perfil"
            >
              <Avatar user={user} />
            </button>
            <button
              className="icon-button mobile-logout"
              aria-label="Sair da conta"
              onClick={logout}
              disabled={logoutPending}
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="dashboard">
          {error && (
            <div className="notice error-notice" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Fechar aviso"
                onClick={() => setError("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {view === "profile" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">UMA CONTA SÓ SUA</span>
                  <h1>Seu perfil.</h1>
                  <p>Bom ter você fazendo parte.</p>
                </div>
              </div>
              <section className="profile-card">
                <Avatar user={user} large />
                <h2>{name}</h2>
                <p className="profile-email">
                  {user.email || "E-mail não informado"}
                </p>
                <span className="profile-badge">
                  <Icon name="check" size={15} />
                  Sessão ativa
                </span>
                <dl>
                  <div>
                    <dt>Nome</dt>
                    <dd>{name}</dd>
                  </div>
                  <div>
                    <dt>E-mail</dt>
                    <dd>{user.email || "Não informado"}</dd>
                  </div>
                  <div>
                    <dt>Forma de acesso</dt>
                    <dd>
                      {user.app_metadata?.provider === "google"
                        ? "Google"
                        : "E-mail e senha"}
                    </dd>
                  </div>
                </dl>
                <button
                  className="button secondary"
                  onClick={logout}
                  disabled={logoutPending}
                >
                  <Icon name="logout" size={18} />
                  {logoutPending ? "Saindo…" : "Sair da conta"}
                </button>
              </section>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {view === "overview"
                      ? "CADA PASSO CONTA"
                      : "DO PLANO À CONQUISTA"}
                  </span>
                  <h1>
                    {view === "overview"
                      ? `Olá, ${firstName}.`
                      : "Suas tarefas."}
                  </h1>
                  <p>
                    {view === "overview"
                      ? "Vamos dar espaço ao que importa hoje?"
                      : "Organize, acompanhe e celebre seus próximos passos."}
                  </p>
                </div>
                <button
                  className="button primary new-task"
                  onClick={() => setFormTask(null)}
                  disabled={loading || Boolean(busyId) || Boolean(loadError)}
                >
                  <Icon name="plus" size={18} />
                  Nova tarefa
                </button>
              </div>
              {view === "overview" && (
                <>
                  <section className="welcome-card">
                    <div>
                      <span className="eyebrow">UM POUCO MAIS PERTO</span>
                      <h2>
                        Grandes planos.
                        <br />
                        <em>Pequenos passos.</em>
                      </h2>
                      <p>
                        {tasks.length
                          ? `${done} de ${tasks.length} tarefas concluídas. Continue no seu ritmo.`
                          : "Seu espaço está pronto. Comece com uma tarefa."}
                      </p>
                      <div className="progress-caption">
                        <span>Seu progresso</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div
                        className="progress-track"
                        role="progressbar"
                        aria-label="Tarefas concluídas"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="welcome-art" aria-hidden="true">
                      <span className="welcome-star">✳</span>
                      <div className="step step-one" />
                      <div className="step step-two" />
                      <div className="step step-three" />
                      <span className="step-leaf" />
                    </div>
                  </section>
                  <section className="stats" aria-label="Resumo das tarefas">
                    <div className="stat-card">
                      <span className="stat-icon">
                        <Icon name="list" />
                      </span>
                      <div>
                        <span>Total de tarefas</span>
                        <strong>{loading ? "—" : tasks.length}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon pending-icon">
                        <Icon name="clock" />
                      </span>
                      <div>
                        <span>Em andamento</span>
                        <strong>{loading ? "—" : tasks.length - done}</strong>
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon done-icon">
                        <Icon name="check" />
                      </span>
                      <div>
                        <span>Concluídas</span>
                        <strong>{loading ? "—" : done}</strong>
                      </div>
                    </div>
                  </section>
                </>
              )}
              <section className="tasks-section" aria-label="Lista de tarefas">
                <div className="section-heading">
                  <div>
                    <h2>
                      Seus próximos passos<span>{tasks.length}</span>
                    </h2>
                    <p>Tudo o que você precisa, em um só lugar.</p>
                  </div>
                  <button
                    className="icon-button refresh-button"
                    aria-label="Atualizar tarefas"
                    onClick={refresh}
                    disabled={loading || Boolean(busyId)}
                  >
                    <Icon name="refresh" size={18} />
                  </button>
                </div>
                <div className="task-toolbar">
                  <div className="filter-tabs" aria-label="Filtrar por status">
                    {[
                      { id: "all", label: "Todas" },
                      { id: "pending", label: "Pendentes" },
                      { id: "done", label: "Concluídas" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        aria-pressed={filter === tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={filter === tab.id ? "selected" : ""}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <label className="search-field">
                    <Icon name="search" size={18} />
                    <input
                      aria-label="Buscar tarefas"
                      placeholder="Buscar uma tarefa…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                {loadError && (
                  <div className="notice error-notice" role="alert">
                    {loadError}
                    <button
                      className="text-button"
                      onClick={refresh}
                      disabled={loading}
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
                {loading ? (
                  <div className="task-loading" role="status">
                    <span className="spinner small" aria-hidden="true" />
                    Carregando suas tarefas…
                  </div>
                ) : !loadError && filtered.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <Icon name="leaf" size={30} />
                    </span>
                    <h3>
                      {tasks.length
                        ? "Nada por aqui nesta busca."
                        : "Um espaço cheio de possibilidades."}
                    </h3>
                    <p>
                      {tasks.length
                        ? "Tente outro termo ou mude o filtro."
                        : "Adicione sua primeira tarefa e dê o próximo passo."}
                    </p>
                    {!tasks.length && (
                      <button
                        className="button secondary"
                        onClick={() => setFormTask(null)}
                      >
                        <Icon name="plus" size={17} />
                        Criar primeira tarefa
                      </button>
                    )}
                  </div>
                ) : (
                  <ul className="task-list">
                    {filtered.map((task) => (
                      <li
                        key={task.id}
                        className={`task-row ${task.status === "done" ? "task-done" : ""}`}
                      >
                        <button
                          className="task-check"
                          aria-label={`${task.status === "done" ? "Reabrir" : "Concluir"} ${task.title}`}
                          aria-pressed={task.status === "done"}
                          onClick={() => toggleTask(task)}
                          disabled={Boolean(busyId) || loading}
                        >
                          {task.status === "done" && (
                            <Icon name="check" size={15} />
                          )}
                        </button>
                        <div className="task-info">
                          <h3>{task.title}</h3>
                          {task.description && <p>{task.description}</p>}
                          <span className="task-mobile-date">
                            <Icon name="clock" size={12} />
                            {dateLabel(task.due_date)}
                          </span>
                        </div>
                        <span className={`priority priority-${task.priority}`}>
                          {priorityNames[task.priority]}
                        </span>
                        <span className="task-date">
                          <Icon name="clock" size={13} />
                          {dateLabel(task.due_date)}
                        </span>
                        <div className="task-actions">
                          <button
                            className="icon-button"
                            aria-label={`Editar ${task.title}`}
                            onClick={() => setFormTask(task)}
                            disabled={Boolean(busyId) || loading}
                          >
                            <Icon name="edit" size={17} />
                          </button>
                          <button
                            className="icon-button delete-button"
                            aria-label={`Excluir ${task.title}`}
                            onClick={() => {
                              setDeleteError("");
                              setDeleting(task);
                            }}
                            disabled={Boolean(busyId) || loading}
                          >
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
          <footer className="dashboard-footer">
            <Brand />
            <span>Um passo de cada vez.</span>
          </footer>
        </main>
      </div>
      {formTask !== undefined && (
        <TaskForm
          task={formTask}
          onSave={saveForm}
          onClose={() => setFormTask(undefined)}
        />
      )}
      {deleting && (
        <Modal
          title="Excluir esta tarefa?"
          subtitle="Esta ação remove o registro da sua conta."
          onClose={() => setDeleting(null)}
          busy={Boolean(busyId)}
        >
          <p className="delete-title">{deleting.title}</p>
          {deleteError && (
            <div className="notice error-notice" role="alert">
              {deleteError}
            </div>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
              disabled={Boolean(busyId)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              onClick={confirmDelete}
              disabled={Boolean(busyId)}
            >
              {busyId ? "Excluindo…" : "Excluir tarefa"}
              <Icon name="trash" size={17} />
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

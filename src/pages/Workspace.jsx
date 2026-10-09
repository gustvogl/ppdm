import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspaceData } from "../hooks/useWorkspaceData.js";
import { usePreferences } from "../hooks/usePreferences.js";
import { useInstall } from "../hooks/useInstall.js";
import { authErrorMessage, taskErrorMessage } from "../lib/errors.js";
import {
  dateKey,
  dateLabel,
  statusNames,
  priorityNames,
} from "../lib/dates.js";
import { displayName } from "../lib/profile.js";
import Brand from "../components/Brand.jsx";
import Icon from "../components/Icon.jsx";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import TaskForm from "../components/TaskForm.jsx";
import ProjectForm from "../components/ProjectForm.jsx";
import TaskItem from "../components/TaskItem.jsx";
import CalendarView from "../components/CalendarView.jsx";
import AnalyticsView from "../components/AnalyticsView.jsx";
import FocusView from "../components/FocusView.jsx";
import SettingsView from "../components/SettingsView.jsx";

const navItems = [
  { id: "overview", path: "/app", label: "Visão geral", icon: "grid" },
  { id: "tasks", path: "/app/tasks", label: "Minhas tarefas", icon: "list" },
  { id: "projects", path: "/app/projects", label: "Projetos", icon: "folder" },
  {
    id: "calendar",
    path: "/app/calendar",
    label: "Calendário",
    icon: "calendar",
  },
  {
    id: "reports",
    path: "/app/reports",
    label: "Meu progresso",
    icon: "chart",
  },
  { id: "focus", path: "/app/focus", label: "Modo foco", icon: "clock" },
  {
    id: "settings",
    path: "/app/settings",
    label: "Configurações",
    icon: "settings",
  },
  { id: "profile", path: "/app/profile", label: "Meu perfil", icon: "user" },
];
const emptyFilters = {
  search: "",
  status: "all",
  priority: "all",
  project: "all",
  date: "all",
  pinned: false,
  sort: "due",
};
function Empty({
  title = "Um espaço cheio de possibilidades.",
  text = "Adicione o próximo passo e comece a organizar o que importa.",
  onAdd,
  label = "Criar primeira tarefa",
  icon = "leaf",
  disabled,
}) {
  return (
    <div className="n-empty">
      <span className="round-icon">
        <Icon name={icon} size={27} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {onAdd && (
        <button
          className="button secondary"
          onClick={onAdd}
          disabled={disabled}
        >
          <Icon name="plus" size={17} />
          {label}
        </button>
      )}
    </div>
  );
}

export default function Workspace() {
  const { user, signOut, updateProfile } = useAuth();
  const data = useWorkspaceData(user.id);
  const {
    tasks,
    projects,
    loading,
    error: loadError,
    refresh,
    syncedAt,
    saveTask,
    removeTask,
    saveProject,
    removeProject,
  } = data;
  const { preferences, setPreference, storageError } = usePreferences(user.id);
  const install = useInstall();
  const location = useLocation();
  const navigate = useNavigate();
  const view =
    navItems.find((item) => item.path === location.pathname)?.id || "overview";
  const [online, setOnline] = useState(navigator.onLine);
  const [filters, setFilters] = useState(emptyFilters);
  const [layout, setLayout] = useState("list");
  const [page, setPage] = useState(1);
  const [formTask, setFormTask] = useState(undefined);
  const [initialTask, setInitialTask] = useState({});
  const [formProject, setFormProject] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [overlay, setOverlay] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [profileName, setProfileName] = useState(() => displayName(user));
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const name = displayName(user);
  const firstName = name.split(" ")[0];
  const today = dateKey();
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );
  const done = tasks.filter((t) => t.status === "done").length;
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const overdue = activeTasks.filter((t) => t.due_date && t.due_date < today);
  const todayTasks = activeTasks.filter((t) => t.due_date === today);
  const reminders = [...overdue, ...todayTasks].sort((a, b) =>
    a.due_date.localeCompare(b.due_date),
  );
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const canWrite = online && !loading && Boolean(syncedAt) && !loadError;
  const notify = useCallback((message) => setToast(message), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => setPage(1), [filters, layout]);
  const newTask = useCallback(
    (initial = {}) => {
      setInitialTask({ priority: preferences.priority, ...initial });
      setFormTask(null);
    },
    [preferences.priority],
  );
  useEffect(() => {
    function shortcut(e) {
      if (document.querySelector("dialog[open]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearch("");
        setOverlay("search");
        return;
      }
      if (
        e.target.closest?.("input,textarea,select,[contenteditable='true']") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key.toLowerCase() === "n" && canWrite) {
        e.preventDefault();
        newTask();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [canWrite, newTask]);
  const filtered = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("pt-BR");
    const result = tasks.filter(
      (t) =>
        (filters.status === "all" ||
          (filters.status === "open"
            ? t.status !== "done"
            : t.status === filters.status)) &&
        (filters.priority === "all" || t.priority === filters.priority) &&
        (filters.project === "all" ||
          (filters.project === "none"
            ? !t.project_id
            : t.project_id === filters.project)) &&
        (filters.date === "all" ||
          (filters.date === "overdue"
            ? t.status !== "done" && t.due_date && t.due_date < today
            : filters.date === "today"
              ? t.due_date === today
              : !t.due_date)) &&
        (!filters.pinned || t.pinned) &&
        `${t.title} ${t.description} ${(t.tags || []).join(" ")} ${projectMap.get(t.project_id)?.name || ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(search),
    );
    const priorities = { high: 0, medium: 1, low: 2 };
    return result.sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (filters.sort === "title"
          ? a.title.localeCompare(b.title, "pt-BR")
          : filters.sort === "priority"
            ? priorities[a.priority] - priorities[b.priority]
            : filters.sort === "newest"
              ? b.created_at.localeCompare(a.created_at)
              : (a.due_date || "9999").localeCompare(b.due_date || "9999")) ||
        b.created_at.localeCompare(a.created_at),
    );
  }, [tasks, filters, today, projectMap]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const actualPage = Math.min(page, totalPages);
  const upcoming = [...activeTasks]
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (a.due_date || "9999").localeCompare(b.due_date || "9999"),
    )
    .slice(0, 5);
  function showTasks(patch = {}) {
    setFilters({ ...emptyFilters, ...patch });
    navigate("/app/tasks");
  }
  function editTask(task) {
    setOverlay("");
    setFormTask(task);
  }
  function askDelete(item, kind) {
    setDeleteError("");
    setDeleting({ item, kind });
  }
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
  async function saveTaskForm(form, id) {
    await saveTask(form, id);
    setFormTask(undefined);
    notify(id ? "Tarefa atualizada." : "Seu próximo passo foi criado.");
  }
  async function saveProjectForm(form, id) {
    await saveProject(form, id);
    setFormProject(undefined);
    notify(
      id
        ? "Projeto atualizado."
        : "Projeto criado. Agora, dê os próximos passos.",
    );
  }
  async function updateTask(task, patch) {
    if (busyId || !canWrite) return;
    setBusyId(task.id);
    setError("");
    try {
      await saveTask({ ...task, ...patch }, task.id);
      notify(
        patch.status === "done"
          ? "Mais uma conquista. Tarefa concluída!"
          : "Tarefa atualizada.",
      );
    } catch (err) {
      setError(taskErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }
  async function confirmDelete() {
    if (busyId) return;
    setBusyId(deleting.item.id);
    setDeleteError("");
    try {
      if (deleting.kind === "project") await removeProject(deleting.item.id);
      else await removeTask(deleting.item.id);
      setDeleting(null);
      notify("Registro excluído.");
    } catch (err) {
      setDeleteError(taskErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }
  async function saveProfile(e) {
    e.preventDefault();
    if (profileBusy) return;
    setProfileBusy(true);
    setProfileError("");
    try {
      await updateProfile(profileName);
      notify("Seu perfil foi atualizado.");
    } catch (err) {
      setProfileError(authErrorMessage(err));
    } finally {
      setProfileBusy(false);
    }
  }
  async function importBackup(backup, onProgress) {
    let projectCount = 0,
      taskCount = 0;
    const mapping = new Map();
    try {
      for (const project of backup.projects) {
        onProgress(
          `Projetos: ${projectCount}/${backup.projects.length} · Tarefas: ${taskCount}/${backup.tasks.length}`,
        );
        const saved = await saveProject(project);
        mapping.set(project.key, saved.id);
        projectCount++;
      }
      for (const task of backup.tasks) {
        onProgress(
          `Projetos: ${projectCount}/${backup.projects.length} · Tarefas: ${taskCount}/${backup.tasks.length}`,
        );
        await saveTask({
          ...task,
          project_id: task.project_id ? mapping.get(task.project_id) : null,
        });
        taskCount++;
      }
      notify("Backup importado.");
    } catch (err) {
      throw new Error(
        `Importação interrompida: ${projectCount} projetos e ${taskCount} tarefas foram adicionados. Importar o arquivo novamente cria cópias. ${taskErrorMessage(err)}`,
      );
    }
  }
  const taskProps = {
    onEdit: editTask,
    onDelete: (t) => askDelete(t, "task"),
    onUpdate: updateTask,
    busy: Boolean(busyId) || !canWrite,
  };
  const changeFilter = (e) =>
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const pageTitle = {
    overview: `Olá, ${firstName}.`,
    tasks: "Um passo de cada vez.",
    projects: "Suas ideias, em movimento.",
    calendar: "Um tempo para o que importa.",
    reports: "Veja o caminho percorrido.",
    focus: "Faça espaço para o foco.",
    settings: "Um espaço do seu jeito.",
    profile: "Seu perfil.",
  }[view];
  const subtitles = {
    overview: "Organize o dia e abra espaço para o que importa.",
    tasks: "Reúna, organize e conclua seus próximos passos.",
    projects: "Conecte tarefas a objetivos maiores.",
    calendar: "Prazos e próximos passos, em um só lugar.",
    reports: "Cada pequena conquista faz diferença.",
    focus: "Escolha uma tarefa e dedique um bloco de atenção.",
    settings: "Aparência, ritmo, instalação e seus dados.",
    profile: "Bom ter você fazendo parte.",
  };

  return (
    <div className={`n-shell ${preferences.compact ? "is-compact" : ""}`}>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <aside className="n-sidebar">
        <Link
          to="/app"
          className="sidebar-brand"
          aria-label="Nexo, visão geral"
        >
          <Brand />
          <span className="version-chip">2.0</span>
        </Link>
        <span className="n-nav-caption">SEU ESPAÇO</span>
        <nav aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              aria-label={item.label}
              end
              className={({ isActive }) =>
                `n-nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "tasks" && <small>{activeTasks.length}</small>}
            </NavLink>
          ))}
        </nav>
        <div className="n-sidebar-note">
          <span>✳</span>
          <strong>Devagar também é ir.</strong>
          <p>O importante é dar o próximo passo.</p>
          <Link to="/app/focus">
            Encontrar meu foco <Icon name="arrow" size={15} />
          </Link>
        </div>
        <div className="n-sidebar-account">
          <Avatar user={user} />
          <Link to="/app/profile">
            <strong>{name}</strong>
            <small>Meu espaço pessoal</small>
          </Link>
          <button
            className="icon-button"
            aria-label="Sair da conta"
            onClick={logout}
            disabled={logoutPending}
          >
            <Icon name="logout" size={19} />
          </button>
        </div>
      </aside>
      <div className="n-main">
        <header className="n-topbar">
          <Link to="/app" className="n-mobile-brand" aria-label="Nexo">
            <Brand />
          </Link>
          <span className="n-breadcrumb">
            Meu espaço <span>/</span>
            {navItems.find((i) => i.id === view).label}
          </span>
          <div className="n-top-actions">
            <button
              className="n-search-trigger"
              aria-label="Buscar tarefas"
              onClick={() => {
                setGlobalSearch("");
                setOverlay("search");
              }}
            >
              <Icon name="search" size={17} />
              <span>Buscar tarefas</span>
              <kbd>⌘ K</kbd>
            </button>
            <span
              className={`sync-dot ${!online ? "offline" : ""}`}
              title={online ? "Conectado" : "Sem conexão"}
            >
              <i />
              <span>{online ? "Conectado" : "Offline"}</span>
            </span>
            <button
              className="icon-button n-bell"
              aria-label={`Lembretes: ${reminders.length} tarefas`}
              onClick={() => setOverlay("reminders")}
            >
              <Icon name="bell" />
              {reminders.length > 0 && <i />}
            </button>
            <Link
              className="avatar-button"
              to="/app/profile"
              aria-label="Abrir meu perfil"
            >
              <Avatar user={user} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="n-content">
          {!online && (
            <div className="notice offline-notice" role="status">
              <Icon name="wifi" />
              Você está sem conexão. Conecte-se para atualizar e salvar seus
              dados.
            </div>
          )}
          {(error || loadError) && (
            <div className="notice error-notice n-error-banner" role="alert">
              <span>{error || loadError}</span>
              <button
                className="button subtle"
                disabled={loading || !online}
                onClick={() => {
                  setError("");
                  refresh();
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}
          <div className="n-page-heading">
            <div>
              <span className="eyebrow">
                {new Date()
                  .toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                  .toLocaleUpperCase("pt-BR")}
              </span>
              <h1>{pageTitle}</h1>
              <p>{subtitles[view]}</p>
            </div>
            {["overview", "tasks", "calendar"].includes(view) && (
              <button
                className="button primary new-task"
                disabled={!canWrite}
                onClick={() => newTask()}
              >
                <Icon name="plus" size={18} />
                Nova tarefa
              </button>
            )}
            {view === "projects" && (
              <button
                className="button primary"
                disabled={!canWrite}
                onClick={() => setFormProject(null)}
              >
                <Icon name="plus" size={18} />
                Novo projeto
              </button>
            )}
          </div>
          {loading && (
            <div className="n-loading-line" role="status">
              <span className="spinner small" />
              Atualizando seu espaço…
            </div>
          )}
          {view === "overview" && (
            <>
              <section className="n-welcome">
                <div>
                  <span className="eyebrow">O PRÓXIMO PASSO É SEU</span>
                  <h2>
                    Grandes planos.
                    <br />
                    <em>Pequenas conquistas.</em>
                  </h2>
                  <p>
                    {tasks.length
                      ? `${done} de ${tasks.length} tarefas concluídas. Continue no seu ritmo.`
                      : "Um lugar para transformar ideias em ações, sem perder seu ritmo."}
                  </p>
                  <Link to="/app/tasks">
                    Organizar meus próximos passos{" "}
                    <Icon name="arrow" size={17} />
                  </Link>
                </div>
                <div className="welcome-visual" aria-hidden="true">
                  <span className="visual-star">✳</span>
                  <div className="visual-step step-a" />
                  <div className="visual-step step-b" />
                  <div className="visual-step step-c" />
                  <div className="visual-leaf" />
                  <div className="visual-progress">
                    <Icon name="check" size={14} />
                    <strong>{progress}%</strong>
                    <span>do caminho</span>
                  </div>
                </div>
              </section>
              <div className="n-stats">
                {[
                  {
                    icon: "list",
                    title: "Em aberto",
                    value: activeTasks.length,
                    patch: { status: "open" },
                  },
                  {
                    icon: "calendar",
                    title: "Para hoje",
                    value: todayTasks.length,
                    patch: { date: "today", status: "open" },
                  },
                  {
                    icon: "clock",
                    title: "Atrasadas",
                    value: overdue.length,
                    patch: { date: "overdue" },
                    warning: true,
                  },
                  {
                    icon: "check",
                    title: "Concluídas",
                    value: done,
                    patch: { status: "done" },
                  },
                ].map((stat) => (
                  <button
                    className={`n-stat ${stat.warning && stat.value ? "warning" : ""}`}
                    key={stat.title}
                    onClick={() => showTasks(stat.patch)}
                  >
                    <span className="stat-square">
                      <Icon name={stat.icon} />
                    </span>
                    <span>
                      <small>{stat.title}</small>
                      <strong>{stat.value}</strong>
                    </span>
                    <Icon name="arrow" size={16} />
                  </button>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="n-panel next-steps">
                  <div className="n-panel-heading">
                    <div>
                      <h2>Seus próximos passos</h2>
                      <p>Favoritos e prazos mais próximos</p>
                    </div>
                    <Link className="text-link" to="/app/tasks">
                      Ver todos <Icon name="arrow" size={15} />
                    </Link>
                  </div>
                  {upcoming.length ? (
                    <div className="n-task-list">
                      {upcoming.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          project={projectMap.get(task.project_id)}
                          {...taskProps}
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={
                        tasks.length ? "Tudo em dia. Bom trabalho!" : undefined
                      }
                      text={
                        tasks.length
                          ? "Seus passos atuais estão concluídos. Abra espaço para uma nova ideia."
                          : undefined
                      }
                      onAdd={() => newTask()}
                      disabled={!canWrite}
                    />
                  )}
                </section>
                <aside className="dashboard-aside">
                  <AnalyticsView tasks={tasks} projects={projects} brief />
                  <section className="n-panel quick-projects">
                    <div className="n-panel-heading">
                      <h2>Seus projetos</h2>
                      <Link
                        className="icon-button"
                        to="/app/projects"
                        aria-label="Ver projetos"
                      >
                        <Icon name="arrow" size={18} />
                      </Link>
                    </div>
                    {projects.length ? (
                      projects.slice(0, 4).map((p) => (
                        <button
                          className="quick-project"
                          key={p.id}
                          onClick={() => showTasks({ project: p.id })}
                        >
                          <i style={{ background: p.color }} />
                          <strong>{p.name}</strong>
                          <small>
                            {
                              tasks.filter(
                                (t) =>
                                  t.project_id === p.id && t.status !== "done",
                              ).length
                            }
                          </small>
                        </button>
                      ))
                    ) : (
                      <div className="small-empty">
                        <p>Conecte suas tarefas a um objetivo.</p>
                        <button
                          className="text-link"
                          disabled={!canWrite}
                          onClick={() => setFormProject(null)}
                        >
                          Criar um projeto <Icon name="plus" size={15} />
                        </button>
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </>
          )}
          {view === "tasks" && (
            <section className="task-screen">
              <div className="n-panel task-controls">
                <div className="task-controls-top">
                  <label className="n-search-field">
                    <Icon name="search" size={18} />
                    <span className="sr-only">Pesquisar tarefas</span>
                    <input
                      name="search"
                      value={filters.search}
                      onChange={changeFilter}
                      placeholder="Buscar título, etiqueta ou projeto…"
                    />
                  </label>
                  <div className="segmented-control">
                    <button
                      className={layout === "list" ? "active" : ""}
                      aria-pressed={layout === "list"}
                      onClick={() => setLayout("list")}
                    >
                      <Icon name="list" size={16} />
                      Lista
                    </button>
                    <button
                      className={layout === "board" ? "active" : ""}
                      aria-pressed={layout === "board"}
                      onClick={() => setLayout("board")}
                    >
                      <Icon name="board" size={16} />
                      Quadro
                    </button>
                  </div>
                </div>
                <div className="task-filters">
                  <label>
                    <span className="sr-only">Filtrar status</span>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={changeFilter}
                    >
                      <option value="all">Todos os status</option>
                      <option value="open">Em aberto</option>
                      {Object.entries(statusNames).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filtrar projeto</span>
                    <select
                      name="project"
                      value={filters.project}
                      onChange={changeFilter}
                    >
                      <option value="all">Todos os projetos</option>
                      <option value="none">Sem projeto</option>
                      {projects.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filtrar prioridade</span>
                    <select
                      name="priority"
                      value={filters.priority}
                      onChange={changeFilter}
                    >
                      <option value="all">Todas as prioridades</option>
                      {Object.entries(priorityNames).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filtrar prazo</span>
                    <select
                      name="date"
                      value={filters.date}
                      onChange={changeFilter}
                    >
                      <option value="all">Qualquer prazo</option>
                      <option value="today">Para hoje</option>
                      <option value="overdue">Atrasadas</option>
                      <option value="none">Sem prazo</option>
                    </select>
                  </label>
                  <button
                    className={`favorite-filter ${filters.pinned ? "active" : ""}`}
                    aria-pressed={filters.pinned}
                    onClick={() =>
                      setFilters((f) => ({ ...f, pinned: !f.pinned }))
                    }
                  >
                    <Icon name="star" size={15} />
                    Favoritas
                  </button>
                  <button
                    className="text-link reset-filters"
                    onClick={() => setFilters(emptyFilters)}
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
              <div className="list-summary">
                <span>
                  {filtered.length}{" "}
                  {filtered.length === 1
                    ? "tarefa encontrada"
                    : "tarefas encontradas"}
                </span>
                <label>
                  <span>Ordenar por</span>
                  <select
                    name="sort"
                    aria-label="Ordenar tarefas"
                    value={filters.sort}
                    onChange={changeFilter}
                  >
                    <option value="due">Prazo</option>
                    <option value="newest">Mais recentes</option>
                    <option value="priority">Prioridade</option>
                    <option value="title">Título</option>
                  </select>
                </label>
              </div>
              {layout === "list" ? (
                <section className="n-panel n-task-list">
                  {filtered
                    .slice((actualPage - 1) * 12, actualPage * 12)
                    .map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        project={projectMap.get(task.project_id)}
                        {...taskProps}
                      />
                    ))}
                  {!filtered.length && !loading && (
                    <Empty
                      title={
                        tasks.length ? "Nenhuma tarefa por aqui." : undefined
                      }
                      text={
                        tasks.length
                          ? "Tente outra busca ou ajuste os filtros."
                          : undefined
                      }
                      onAdd={!tasks.length ? () => newTask() : undefined}
                      disabled={!canWrite}
                    />
                  )}
                  {filtered.length > 12 && (
                    <div className="pagination">
                      <span>
                        Página {actualPage} de {totalPages}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Página anterior"
                        disabled={actualPage === 1}
                        onClick={() => setPage(actualPage - 1)}
                      >
                        <Icon name="left" />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Próxima página"
                        disabled={actualPage === totalPages}
                        onClick={() => setPage(actualPage + 1)}
                      >
                        <Icon name="right" />
                      </button>
                    </div>
                  )}
                </section>
              ) : (
                <div className="kanban-board">
                  {Object.entries(statusNames).map(([status, label]) => (
                    <section
                      className={`kanban-column ${status}`}
                      key={status}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const task = tasks.find(
                          (t) =>
                            t.id === e.dataTransfer.getData("text/nexo-task"),
                        );
                        if (task && task.status !== status)
                          updateTask(task, { status });
                      }}
                    >
                      <header>
                        <span>
                          <i />
                          {label}
                        </span>
                        <small>
                          {filtered.filter((t) => t.status === status).length}
                        </small>
                      </header>
                      {filtered
                        .filter((t) => t.status === status)
                        .map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            board
                            project={projectMap.get(task.project_id)}
                            {...taskProps}
                          />
                        ))}
                      <button
                        className="kanban-add"
                        disabled={!canWrite}
                        onClick={() =>
                          newTask({
                            status,
                            project_id: projects.some(
                              (p) => p.id === filters.project,
                            )
                              ? filters.project
                              : null,
                          })
                        }
                      >
                        <Icon name="plus" size={16} />
                        Adicionar tarefa
                      </button>
                    </section>
                  ))}
                </div>
              )}
            </section>
          )}
          {view === "projects" && (
            <div className="projects-grid">
              {projects.map((project) => {
                const projectTasks = tasks.filter(
                  (t) => t.project_id === project.id,
                );
                const projectDone = projectTasks.filter(
                  (t) => t.status === "done",
                ).length;
                const pct = projectTasks.length
                  ? Math.round((projectDone / projectTasks.length) * 100)
                  : 0;
                return (
                  <article className="n-panel project-card" key={project.id}>
                    <div className="project-card-top">
                      <span
                        className="project-icon"
                        style={{
                          background: `${project.color}18`,
                          color: project.color,
                        }}
                      >
                        <Icon name="folder" size={24} />
                      </span>
                      <div>
                        <button
                          className="icon-button"
                          aria-label={`Editar projeto ${project.name}`}
                          disabled={!canWrite}
                          onClick={() => setFormProject(project)}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Excluir projeto ${project.name}`}
                          disabled={!canWrite}
                          onClick={() => askDelete(project, "project")}
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </div>
                    <h2>{project.name}</h2>
                    <p>
                      {project.description ||
                        "Um objetivo, vários próximos passos."}
                    </p>
                    <div className="project-card-progress">
                      <span>
                        {projectDone}/{projectTasks.length} concluídas
                      </span>
                      <strong>{pct}%</strong>
                    </div>
                    <div className="n-progress-track">
                      <i
                        style={{ width: `${pct}%`, background: project.color }}
                      />
                    </div>
                    <div className="project-card-footer">
                      <button
                        className="text-link"
                        onClick={() => showTasks({ project: project.id })}
                      >
                        Ver tarefas <Icon name="arrow" size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Adicionar tarefa ao projeto ${project.name}`}
                        disabled={!canWrite}
                        onClick={() => newTask({ project_id: project.id })}
                      >
                        <Icon name="plus" size={18} />
                      </button>
                    </div>
                  </article>
                );
              })}
              {!projects.length && !loading && (
                <section className="n-panel full-width">
                  <Empty
                    title="Uma ideia merece um projeto."
                    text="Crie um projeto e reúna os passos para chegar lá."
                    label="Criar primeiro projeto"
                    icon="folder"
                    onAdd={() => setFormProject(null)}
                    disabled={!canWrite}
                  />
                </section>
              )}
            </div>
          )}
          {view === "calendar" && (
            <CalendarView
              tasks={tasks}
              onEdit={editTask}
              onAdd={newTask}
              disabled={!canWrite}
            />
          )}
          {view === "reports" && (
            <AnalyticsView tasks={tasks} projects={projects} />
          )}
          <FocusView
            tasks={tasks}
            preferences={preferences}
            onFinish={notify}
            hidden={view !== "focus"}
          />
          {view === "settings" && (
            <SettingsView
              preferences={preferences}
              setPreference={setPreference}
              storageError={storageError}
              tasks={tasks}
              projects={projects}
              loading={!canWrite}
              onImport={importBackup}
              install={install}
            />
          )}
          {view === "profile" && (
            <div className="profile-layout">
              <section className="n-panel n-profile-card">
                <Avatar user={user} large />
                <h2>{name}</h2>
                <p>{user.email || "E-mail não informado"}</p>
                <span className="profile-badge">
                  <Icon name="check" size={15} />
                  Sessão ativa
                </span>
                <form className="profile-form" onSubmit={saveProfile}>
                  {profileError && (
                    <div className="notice error-notice" role="alert">
                      {profileError}
                    </div>
                  )}
                  <label className="field">
                    <span>Seu nome</span>
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      autoComplete="name"
                      minLength={2}
                      maxLength={80}
                      required
                      disabled={profileBusy}
                    />
                  </label>
                  <label className="field">
                    <span>E-mail da conta</span>
                    <input value={user.email || ""} readOnly type="email" />
                  </label>
                  <button
                    className="button primary"
                    disabled={profileBusy || !online}
                  >
                    {profileBusy ? "Salvando…" : "Salvar perfil"}
                  </button>
                </form>
                <dl className="profile-details">
                  <div>
                    <dt>Forma de acesso</dt>
                    <dd>
                      {user.app_metadata?.provider === "google"
                        ? "Google"
                        : "E-mail e senha"}
                    </dd>
                  </div>
                  <div>
                    <dt>Conta criada</dt>
                    <dd>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </section>
              <aside className="profile-aside">
                <section className="n-panel settings-panel">
                  <span className="round-icon">
                    <Icon name="lock" />
                  </span>
                  <h2>Sua conta, protegida</h2>
                  <p>
                    Suas tarefas e projetos são privados. Saia da conta ao usar
                    um computador compartilhado.
                  </p>
                  <Link className="button secondary" to="/redefinir-senha">
                    <Icon name="lock" size={17} />
                    Alterar senha
                  </Link>
                  <button
                    className="button logout-button"
                    onClick={logout}
                    disabled={logoutPending}
                  >
                    <Icon name="logout" size={17} />
                    {logoutPending ? "Saindo…" : "Sair da conta"}
                  </button>
                </section>
                <section className="n-panel settings-panel">
                  <span className="round-icon">
                    <Icon name="settings" />
                  </span>
                  <h2>Faça o espaço ser seu</h2>
                  <p>
                    Ajuste o tema, baixe seus dados e instale o Nexo na tela
                    inicial.
                  </p>
                  <Link className="text-link" to="/app/settings">
                    Abrir configurações <Icon name="arrow" size={16} />
                  </Link>
                </section>
              </aside>
            </div>
          )}
          <footer className="n-footer">
            <span>Nexo · Seu próximo passo.</span>
            <div>
              <span>
                {syncedAt
                  ? `Atualizado às ${syncedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Aguardando seus dados"}
              </span>
              <button
                className="icon-button"
                aria-label="Atualizar dados"
                onClick={refresh}
                disabled={loading || Boolean(busyId) || !online}
              >
                <Icon name="refresh" size={15} />
              </button>
            </div>
          </footer>
        </main>
      </div>
      <nav className="n-mobile-nav" aria-label="Navegação móvel">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon name={item.icon} size={20} />
            <span>
              {item.id === "overview"
                ? "Início"
                : item.id === "tasks"
                  ? "Tarefas"
                  : item.label}
            </span>
          </NavLink>
        ))}
        <button
          className={
            navItems.slice(4).some((i) => i.id === view) ? "active" : ""
          }
          onClick={() => setOverlay("more")}
        >
          <Icon name="more" size={21} />
          <span>Mais</span>
        </button>
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {toast}
          <button
            className="icon-button"
            aria-label="Fechar mensagem"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      {formTask !== undefined && (
        <TaskForm
          key={formTask?.id || "new"}
          task={formTask}
          initial={initialTask}
          projects={projects}
          onSave={saveTaskForm}
          onClose={() => setFormTask(undefined)}
        />
      )}
      {formProject !== undefined && (
        <ProjectForm
          key={formProject?.id || "new"}
          project={formProject}
          onSave={saveProjectForm}
          onClose={() => setFormProject(undefined)}
        />
      )}
      {deleting && (
        <Modal
          title={
            deleting.kind === "project"
              ? "Excluir este projeto?"
              : "Excluir esta tarefa?"
          }
          subtitle={deleting.item.name || deleting.item.title}
          busy={Boolean(busyId)}
          onClose={() => setDeleting(null)}
        >
          <p className="modal-description">
            {deleting.kind === "project"
              ? "As tarefas serão mantidas e ficarão sem projeto. A exclusão do projeto não pode ser desfeita."
              : "A tarefa e seu checklist serão excluídos. Esta ação não pode ser desfeita."}
          </p>
          {deleteError && (
            <div className="notice error-notice" role="alert">
              {deleteError}
            </div>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={Boolean(busyId)}
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              disabled={Boolean(busyId) || !online}
              onClick={confirmDelete}
            >
              {busyId
                ? "Excluindo…"
                : deleting.kind === "project"
                  ? "Excluir projeto"
                  : "Excluir tarefa"}
            </button>
          </div>
        </Modal>
      )}
      {overlay === "search" && (
        <Modal
          title="Encontre seu próximo passo."
          onClose={() => setOverlay("")}
        >
          <label className="n-search-field">
            <Icon name="search" />
            <span className="sr-only">Busca em todas as tarefas</span>
            <input
              autoFocus
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar tarefa, etiqueta ou projeto…"
            />
          </label>
          <div className="search-results">
            {tasks
              .filter((t) =>
                `${t.title} ${t.description} ${(t.tags || []).join(" ")} ${projectMap.get(t.project_id)?.name || ""}`
                  .toLocaleLowerCase("pt-BR")
                  .includes(globalSearch.toLocaleLowerCase("pt-BR")),
              )
              .slice(0, 20)
              .map((t) => (
                <button key={t.id} onClick={() => editTask(t)}>
                  <Icon
                    name={t.status === "done" ? "check" : "list"}
                    size={17}
                  />
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {projectMap.get(t.project_id)?.name || "Sem projeto"} ·{" "}
                      {dateLabel(t.due_date)}
                    </small>
                  </span>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            {!tasks.length && (
              <p>Suas tarefas aparecerão aqui quando forem criadas.</p>
            )}
            {tasks.length > 0 &&
              !tasks.some((t) =>
                `${t.title} ${t.description} ${(t.tags || []).join(" ")} ${projectMap.get(t.project_id)?.name || ""}`
                  .toLocaleLowerCase("pt-BR")
                  .includes(globalSearch.toLocaleLowerCase("pt-BR")),
              ) && <p>Nenhuma tarefa encontrada. Tente outra busca.</p>}
          </div>
        </Modal>
      )}
      {overlay === "reminders" && (
        <Modal
          title="O que pede sua atenção."
          subtitle="Tarefas atrasadas e previstas para hoje."
          onClose={() => setOverlay("")}
        >
          <div className="reminder-list">
            {reminders.slice(0, 30).map((t) => (
              <button key={t.id} onClick={() => editTask(t)}>
                <span className="round-icon">
                  <Icon name="calendar" size={17} />
                </span>
                <span>
                  <strong>{t.title}</strong>
                  <small className={t.due_date < today ? "overdue" : ""}>
                    {t.due_date < today ? "Atrasada" : "Para hoje"} ·{" "}
                    {dateLabel(t.due_date)}
                  </small>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
            {!reminders.length && (
              <Empty
                title="Tudo tranquilo por aqui."
                text="Nenhuma tarefa atrasada ou pendente para hoje."
                icon="sun"
              />
            )}
          </div>
          {reminders.length > 30 && (
            <button
              className="text-link"
              onClick={() => {
                setOverlay("");
                showTasks({ date: "overdue" });
              }}
            >
              Ver todas as tarefas atrasadas
            </button>
          )}
          <p className="panel-footnote">
            Os lembretes aparecem dentro do app ao abrir esta tela.
          </p>
        </Modal>
      )}
      {overlay === "more" && (
        <Modal title="Seu espaço." onClose={() => setOverlay("")}>
          <nav className="more-menu" aria-label="Mais opções">
            {navItems.slice(4).map((item) => (
              <Link key={item.id} to={item.path} onClick={() => setOverlay("")}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                <Icon name="arrow" size={17} />
              </Link>
            ))}
            <button
              onClick={() => {
                setOverlay("");
                logout();
              }}
              disabled={logoutPending}
            >
              <Icon name="logout" />
              <span>Sair da conta</span>
            </button>
          </nav>
        </Modal>
      )}
    </div>
  );
}

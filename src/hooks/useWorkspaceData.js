import { useCallback, useEffect, useRef, useState } from "react";
import { createTask, updateTask, deleteTask, listTasks } from "../lib/tasks.js";
import { listProjects, saveProject, deleteProject } from "../lib/projects.js";
import { taskErrorMessage } from "../lib/errors.js";

export function useWorkspaceData(userId) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncedAt, setSyncedAt] = useState(null);
  const active = useRef(false);
  const revision = useRef(0);
  const writing = useRef(0);
  const refresh = useCallback(async () => {
    if (writing.current) return;
    const request = ++revision.current;
    setLoading(true);
    setError("");
    try {
      const [nextTasks, nextProjects] = await Promise.all([
        listTasks(userId),
        listProjects(userId),
      ]);
      if (active.current && request === revision.current) {
        setTasks(nextTasks);
        setProjects(nextProjects);
        setSyncedAt(new Date());
      }
    } catch (err) {
      if (active.current && request === revision.current)
        setError(taskErrorMessage(err));
    } finally {
      if (active.current && request === revision.current) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    active.current = true;
    refresh();
    const onFocus = () => {
      if (navigator.onLine) refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      active.current = false;
      revision.current++;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [refresh]);
  async function mutate(work, apply) {
    writing.current++;
    revision.current++;
    try {
      const saved = await work();
      if (active.current) {
        apply(saved);
        setError("");
        setLoading(false);
        setSyncedAt(new Date());
      }
      return saved;
    } finally {
      writing.current--;
      if (active.current) setLoading(false);
    }
  }
  const saveTask = (form, id) =>
    mutate(
      () => (id ? updateTask(userId, id, form) : createTask(userId, form)),
      (saved) =>
        setTasks((current) =>
          id
            ? current.map((t) => (t.id === id ? saved : t))
            : [saved, ...current],
        ),
    );
  const removeTask = (id) =>
    mutate(
      () => deleteTask(userId, id),
      () => setTasks((current) => current.filter((t) => t.id !== id)),
    );
  const saveProjectForm = (form, id) =>
    mutate(
      () => saveProject(userId, form, id),
      (saved) =>
        setProjects((current) =>
          id
            ? current.map((p) => (p.id === id ? saved : p))
            : [...current, saved],
        ),
    );
  const removeProject = (id) =>
    mutate(
      () => deleteProject(userId, id),
      () => {
        setProjects((current) => current.filter((p) => p.id !== id));
        setTasks((current) =>
          current.map((t) =>
            t.project_id === id ? { ...t, project_id: null } : t,
          ),
        );
      },
    );
  return {
    tasks,
    projects,
    loading,
    error,
    refresh,
    syncedAt,
    saveTask,
    removeTask,
    saveProject: saveProjectForm,
    removeProject,
  };
}

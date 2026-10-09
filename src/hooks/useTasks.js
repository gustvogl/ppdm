import { useCallback, useEffect, useRef, useState } from "react";
import { createTask, deleteTask, listTasks, updateTask } from "../lib/tasks.js";
import { taskErrorMessage } from "../lib/errors.js";

export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const active = useRef(true);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true);
    setError("");
    try {
      const data = await listTasks(userId);
      if (active.current && request === revision.current) setTasks(data);
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
    return () => {
      active.current = false;
      revision.current += 1;
    };
  }, [refresh]);

  async function save(form, id = null) {
    revision.current += 1; // Não aceitar uma leitura anterior à escrita.
    const saved = id
      ? await updateTask(userId, id, form)
      : await createTask(userId, form);
    if (active.current) {
      setTasks((current) =>
        id
          ? current.map((t) => (t.id === id ? saved : t))
          : [saved, ...current],
      );
      setError("");
      setLoading(false);
    }
    return saved;
  }
  async function remove(id) {
    revision.current += 1;
    await deleteTask(userId, id);
    if (active.current) {
      setTasks((current) => current.filter((t) => t.id !== id));
      setError("");
      setLoading(false);
    }
  }
  return { tasks, loading, error, refresh, save, remove };
}

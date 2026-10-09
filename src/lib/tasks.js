import { supabase } from "./supabaseClient.js";
import { readRows } from "./readRows.js";

const TABLE = "ppdm2_tasks";
const COLUMNS =
  "id,user_id,title,description,status,priority,due_date,project_id,tags,checklist,pinned,created_at,updated_at,completed_at";

export function normalizeTask(form) {
  if (!form || typeof form !== "object" || Array.isArray(form))
    throw new Error("Tarefa inválida no arquivo.");
  const title = typeof form.title === "string" ? form.title.trim() : "";
  if (form.description != null && typeof form.description !== "string")
    throw new Error("A descrição deve ser um texto.");
  const description = (form.description || "").trim();
  if (title.length < 2 || title.length > 120)
    throw new Error("O título deve ter de 2 a 120 caracteres.");
  if (description.length > 2000)
    throw new Error("A descrição pode ter até 2.000 caracteres.");
  if (!["low", "medium", "high"].includes(form.priority))
    throw new Error("Escolha uma prioridade válida.");
  if (!["pending", "in_progress", "done"].includes(form.status))
    throw new Error("Escolha um status válido.");
  const due_date = form.due_date || null;
  if (due_date) {
    if (typeof due_date !== "string")
      throw new Error("Escolha uma data válida.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date))
      throw new Error("Escolha uma data válida.");
    const date = new Date(`${due_date}T12:00:00Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== due_date
    )
      throw new Error("Escolha uma data válida.");
  }
  const project_id = form.project_id || null;
  if (form.pinned != null && typeof form.pinned !== "boolean")
    throw new Error("O campo favorita deve ser verdadeiro ou falso.");
  if (
    project_id &&
    !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(project_id)
  )
    throw new Error("Escolha um projeto válido.");
  if (form.tags && !Array.isArray(form.tags))
    throw new Error("Etiquetas inválidas.");
  const tags = [
    ...new Set(
      (form.tags || []).map((tag) =>
        typeof tag === "string" ? tag.trim() : "",
      ),
    ),
  ].filter(Boolean);
  if (tags.length > 8 || tags.some((tag) => tag.length > 24))
    throw new Error("Use até 8 etiquetas com até 24 caracteres cada.");
  const checklist = form.checklist || [];
  if (
    !Array.isArray(checklist) ||
    checklist.length > 30 ||
    checklist.some(
      (item) =>
        typeof item?.text !== "string" ||
        !item.text.trim() ||
        item.text.trim().length > 160 ||
        typeof item.done !== "boolean",
    )
  )
    throw new Error("Use até 30 passos com texto de até 160 caracteres.");
  return {
    title,
    description,
    status: form.status,
    priority: form.priority,
    due_date,
    project_id,
    tags,
    checklist: checklist.map(({ text, done }) => ({ text: text.trim(), done })),
    pinned: Boolean(form.pinned),
  };
}

function requireOwner(userId) {
  if (!supabase || !userId)
    throw new Error("Entre na sua conta para acessar as tarefas.");
}

export async function listTasks(userId) {
  requireOwner(userId);
  return readRows(() =>
    supabase
      .from(TABLE)
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true }),
  );
}
export async function createTask(userId, form) {
  requireOwner(userId);
  const fields = normalizeTask(form);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...fields, user_id: userId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
export async function updateTask(userId, id, form) {
  requireOwner(userId);
  const fields = normalizeTask(form);
  const { data, error } = await supabase
    .from(TABLE)
    .update(fields)
    .eq("id", id)
    .eq("user_id", userId)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
export async function deleteTask(userId, id) {
  requireOwner(userId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error) throw error;
}

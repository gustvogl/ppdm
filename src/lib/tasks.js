import { supabase } from "./supabaseClient.js";

const TABLE = "ppdm2_tasks";
const COLUMNS =
  "id,user_id,title,description,status,priority,due_date,created_at";

export function normalizeTask(form) {
  const title = form.title.trim();
  const description = (form.description || "").trim();
  if (title.length < 2 || title.length > 120)
    throw new Error("O título deve ter de 2 a 120 caracteres.");
  if (description.length > 2000)
    throw new Error("A descrição pode ter até 2.000 caracteres.");
  if (!["low", "medium", "high"].includes(form.priority))
    throw new Error("Escolha uma prioridade válida.");
  if (!["pending", "done"].includes(form.status))
    throw new Error("Escolha um status válido.");
  const due_date = form.due_date || null;
  if (due_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date))
      throw new Error("Escolha uma data válida.");
    const date = new Date(`${due_date}T12:00:00Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== due_date
    )
      throw new Error("Escolha uma data válida.");
  }
  return {
    title,
    description,
    status: form.status,
    priority: form.priority,
    due_date,
  };
}

function requireOwner(userId) {
  if (!supabase || !userId)
    throw new Error("Entre na sua conta para acessar as tarefas.");
}

export async function listTasks(userId) {
  requireOwner(userId);
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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

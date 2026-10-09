import { supabase } from "./supabaseClient.js";
import { readRows } from "./readRows.js";

export const PROJECT_COLORS = [
  "#487763",
  "#6286ad",
  "#9b739e",
  "#c08c4e",
  "#c27070",
  "#6a8e86",
];
const TABLE = "ppdm2_projects";
export function normalizeProject(form) {
  if (!form || typeof form !== "object" || Array.isArray(form))
    throw new Error("Projeto inválido no arquivo.");
  const name = typeof form.name === "string" ? form.name.trim() : "";
  const description =
    typeof form.description === "string" ? form.description.trim() : "";
  if (name.length < 2 || name.length > 80)
    throw new Error("O nome deve ter de 2 a 80 caracteres.");
  if (description.length > 500)
    throw new Error("A descrição pode ter até 500 caracteres.");
  if (!PROJECT_COLORS.includes(form.color))
    throw new Error("Escolha uma das cores disponíveis.");
  return { name, description, color: form.color };
}
function client(userId) {
  if (!supabase || !userId)
    throw new Error("Entre na sua conta para acessar os projetos.");
  return supabase.from(TABLE);
}
export async function listProjects(userId) {
  return readRows(() =>
    client(userId)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  );
}
export async function saveProject(userId, form, id) {
  const fields = normalizeProject(form);
  const query = id
    ? client(userId).update(fields).eq("id", id).eq("user_id", userId)
    : client(userId).insert({ ...fields, user_id: userId });
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data;
}
export async function deleteProject(userId, id) {
  const { error } = await client(userId)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();
  if (error) throw error;
}

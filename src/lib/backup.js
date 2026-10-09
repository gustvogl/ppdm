import { normalizeTask } from "./tasks.js";
import { normalizeProject } from "./projects.js";
import { priorityNames, statusNames } from "./dates.js";

export function backupData(tasks, projects) {
  return {
    app: "Nexo",
    version: 2,
    exported_at: new Date().toISOString(),
    projects: projects.map((p) => ({ key: p.id, ...normalizeProject(p) })),
    tasks: tasks.map((t) => normalizeTask(t)),
  };
}
export function readBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("O arquivo não contém um JSON válido.");
  }
  if (
    data?.app !== "Nexo" ||
    data.version !== 2 ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.projects)
  )
    throw new Error("Escolha um backup JSON exportado pelo Nexo 2.");
  if (data.tasks.length > 1000 || data.projects.length > 100)
    throw new Error(
      "Importe no máximo 1.000 tarefas e 100 projetos por arquivo.",
    );
  const keys = new Set();
  const projects = data.projects.map((p) => {
    if (!p || typeof p.key !== "string" || keys.has(p.key))
      throw new Error("O arquivo contém projetos inválidos ou repetidos.");
    keys.add(p.key);
    return { key: p.key, ...normalizeProject(p) };
  });
  const tasks = data.tasks.map((t) => {
    const fields = normalizeTask(t);
    if (fields.project_id && !keys.has(fields.project_id))
      throw new Error("Há tarefas vinculadas a um projeto ausente do backup.");
    return fields;
  });
  return { projects, tasks };
}
// Neutraliza fórmulas ao abrir campos de texto em planilhas.
function csvField(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function tasksCsv(tasks, projects) {
  const names = new Map(projects.map((p) => [p.id, p.name]));
  return (
    "\uFEFF" +
    [
      [
        "Título",
        "Descrição",
        "Status",
        "Prioridade",
        "Prazo",
        "Projeto",
        "Etiquetas",
      ],
      ...tasks.map((t) => [
        t.title,
        t.description,
        statusNames[t.status],
        priorityNames[t.priority],
        t.due_date,
        names.get(t.project_id) || "",
        (t.tags || []).join(", "),
      ]),
    ]
      .map((row) => row.map(csvField).join(";"))
      .join("\r\n")
  );
}
export function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

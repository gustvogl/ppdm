import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/supabaseClient.js", () => ({ supabase: null }));
import { normalizeTask } from "../src/lib/tasks.js";
import { normalizeProject, PROJECT_COLORS } from "../src/lib/projects.js";
import { backupData, readBackup, tasksCsv } from "../src/lib/backup.js";
import { dateKey, monthDays } from "../src/lib/dates.js";
import { displayName } from "../src/lib/profile.js";
import { readRows } from "../src/lib/readRows.js";

const id = "10000000-0000-4000-8000-000000000001";
const task = {
  title: "Estudar",
  description: "Revisar",
  status: "in_progress",
  priority: "high",
  due_date: "2026-10-09",
  project_id: id,
  tags: ["aula", "aula"],
  checklist: [{ text: "Revisar RLS", done: false }],
  pinned: true,
};
const project = {
  id,
  user_id: "secreto",
  name: "Faculdade",
  description: "Aulas",
  color: PROJECT_COLORS[0],
};
describe("projetos, backup e novos campos", () => {
  it("preserva passos válidos e rejeita itens e vínculos inválidos", () => {
    expect(normalizeTask(task).tags).toEqual(["aula"]);
    expect(() => normalizeTask({ ...task, project_id: "outro" })).toThrow(
      "projeto",
    );
    expect(() =>
      normalizeTask({ ...task, checklist: [{ text: "Passo", done: "sim" }] }),
    ).toThrow("passos");
    expect(() =>
      normalizeTask({
        ...task,
        tags: Array.from({ length: 9 }, (_, i) => `tag${i}`),
      }),
    ).toThrow("8 etiquetas");
    expect(() => normalizeProject({ ...project, color: "red" })).toThrow(
      "cores",
    );
  });
  it("faz ida e volta do backup sem identidades, tokens ou propriedades injetadas", () => {
    const data = backupData(
      [{ ...task, user_id: "outro", access_token: "segredo" }],
      [project],
    );
    const text = JSON.stringify(data);
    expect(text).not.toContain("user_id");
    expect(text).not.toContain("segredo");
    const restored = readBackup(text);
    expect(restored.tasks[0].project_id).toBe(id);
    expect(restored.projects[0].name).toBe("Faculdade");
    expect(() => readBackup(JSON.stringify({ ...data, projects: [] }))).toThrow(
      "ausente",
    );
    expect(() =>
      readBackup(
        JSON.stringify({
          ...data,
          projects: [data.projects[0], data.projects[0]],
        }),
      ),
    ).toThrow("repetidos");
    expect(() =>
      readBackup('{"app":"Outro","version":2,"tasks":[],"projects":[]}'),
    ).toThrow("Nexo");
  });
  it("escapa CSV e neutraliza fórmulas em planilhas", () => {
    const csv = tasksCsv(
      [
        {
          ...task,
          title: '=HYPERLINK("https://example.com")',
          description: "duas;partes\ntexto",
        },
      ],
      [project],
    );
    expect(csv).toContain("'=");
    expect(csv).toContain('""https://example.com""');
    expect(csv).toContain('"duas;partes\ntexto"');
  });
  it("não quebra o perfil com metadados inesperados", () => {
    expect(
      displayName({
        user_metadata: { full_name: {} },
        email: "conta@example.com",
      }),
    ).toBe("conta@example.com");
    expect(displayName({})).toBe("Seu espaço");
  });
  it("monta o calendário a partir de segunda e considera o dia local", () => {
    const days = monthDays(new Date(2026, 9, 9, 12));
    expect(days).toHaveLength(42);
    expect(days[0].getDay()).toBe(1);
    expect(dateKey(days[0])).toBe("2026-09-28");
    expect(days.filter((d) => d.getMonth() === 9)).toHaveLength(31);
  });
  it("lê além de um limite de página e propaga falhas sem retorno parcial", async () => {
    const range = vi
      .fn()
      .mockResolvedValueOnce({
        data: Array.from({ length: 500 }, (_, id) => ({ id })),
      })
      .mockResolvedValueOnce({ data: [{ id: 500 }] });
    const rows = await readRows(() => ({ range }));
    expect(rows).toHaveLength(501);
    expect(range).toHaveBeenLastCalledWith(500, 999);
    await expect(
      readRows(() => ({
        range: () => Promise.resolve({ error: { code: "42501" } }),
      })),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

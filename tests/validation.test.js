import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/supabaseClient.js", () => ({ supabase: null }));
import { validatePublicConfig } from "../src/lib/config.js";
import { normalizeTask } from "../src/lib/tasks.js";

describe("chaves permitidas no navegador", () => {
  const url = "https://exemplo.supabase.co";
  const jwt = (role) => `header.${btoa(JSON.stringify({ role }))}.signature`;
  it("aceita publishable e anon legada", () => {
    expect(validatePublicConfig(url, "sb_publishable_exemplo")).toBeNull();
    expect(validatePublicConfig(url, jwt("anon"))).toBeNull();
  });
  it("rejeita segredos, service_role e valores de exemplo", () => {
    expect(validatePublicConfig(url, "sb_secret_exemplo")).toMatch(/secreta/);
    expect(validatePublicConfig(url, jwt("service_role"))).toMatch(
      /service_role/,
    );
    expect(
      validatePublicConfig(
        "https://SEU_PROJECT_REF.supabase.co",
        "sb_publishable_COLE_SUA_CHAVE_PUBLICA",
      ),
    ).toBeTruthy();
  });
  it("não permite transporte sem HTTPS fora do desenvolvimento local", () => {
    expect(
      validatePublicConfig("http://exemplo.com", "sb_publishable_exemplo"),
    ).toMatch(/HTTPS/);
    expect(
      validatePublicConfig("http://localhost:54321", "sb_publishable_exemplo"),
    ).toBeNull();
  });
});

describe("validação das tarefas", () => {
  const task = {
    title: "  Estudar  ",
    description: " Revisar aula ",
    status: "pending",
    priority: "medium",
    due_date: "",
  };
  it("normaliza texto e data opcional sem aceitar dono passado pelo formulário", () => {
    expect(normalizeTask({ ...task, user_id: "outro", id: "forjado" })).toEqual(
      {
        title: "Estudar",
        description: "Revisar aula",
        status: "pending",
        priority: "medium",
        due_date: null,
        project_id: null,
        tags: [],
        checklist: [],
        pinned: false,
      },
    );
  });
  it("rejeita datas impossíveis em vez de corrigir silenciosamente", () => {
    expect(() => normalizeTask({ ...task, due_date: "2026-02-30" })).toThrow(
      "data válida",
    );
    expect(normalizeTask({ ...task, due_date: "2028-02-29" }).due_date).toBe(
      "2028-02-29",
    );
  });
  it("rejeita títulos vazios e status não permitido", () => {
    expect(() => normalizeTask({ ...task, title: "   " })).toThrow("título");
    expect(() => normalizeTask({ ...task, status: "admin" })).toThrow("status");
  });
});

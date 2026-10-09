// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";

let db;
const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const ta = "10000000-0000-4000-8000-000000000001";
const tb = "10000000-0000-4000-8000-000000000002";
const setup = await readFile(
  new URL("../supabase/setup.sql", import.meta.url),
  "utf8",
);

async function asUser(id) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
beforeAll(async () => {
  // PostgreSQL local em WASM. Usuários/JWT fictícios, sem conexão com Supabase.
  db = new PGlite();
  await db.exec(`create schema auth;
    create role anon; create role authenticated;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    insert into auth.users(id) values ('${a}'), ('${b}');`);
  await db.exec(setup);
}, 30000);
beforeEach(async () => {
  await db.exec(
    "reset role; truncate public.ppdm2_tasks, public.ppdm2_projects",
  );
  await db.query(
    "insert into public.ppdm2_tasks(id,user_id,title) values ($1,$2,'Tarefa de A'),($3,$4,'Tarefa de B')",
    [ta, a, tb, b],
  );
});
afterAll(async () => {
  await db?.close();
});

describe("RLS e permissões executadas em PostgreSQL local", () => {
  it("protege projetos e impede associar tarefa a projeto de outra conta", async () => {
    await db.query(
      "insert into public.ppdm2_projects(id,user_id,name) values ($1,$2,'Projeto de B')",
      [tb, b],
    );
    await asUser(a);
    expect(
      (await db.query("select * from public.ppdm2_projects")).rows,
    ).toEqual([]);
    await expect(
      db.query(
        "insert into public.ppdm2_projects(user_id,name) values ($1,'Invasão')",
        [b],
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      db.query("update public.ppdm2_tasks set project_id=$1 where id=$2", [
        tb,
        ta,
      ]),
    ).rejects.toMatchObject({ code: "23503" });
    expect(
      (
        await db.query(
          "delete from public.ppdm2_projects where id=$1 returning id",
          [tb],
        )
      ).rows,
    ).toEqual([]);
  });
  it("excluir um projeto próprio mantém as tarefas sem vínculo", async () => {
    await asUser(a);
    await db.query(
      "insert into public.ppdm2_projects(id,user_id,name) values ($1,$2,'Projeto de A')",
      [ta, a],
    );
    await db.query("update public.ppdm2_tasks set project_id=$1 where id=$2", [
      ta,
      ta,
    ]);
    await db.query("delete from public.ppdm2_projects where id=$1", [ta]);
    expect(
      (
        await db.query(
          "select project_id from public.ppdm2_tasks where id=$1",
          [ta],
        )
      ).rows,
    ).toEqual([{ project_id: null }]);
  });
  it("protege timestamps de conclusão e valida checklist no banco", async () => {
    await asUser(a);
    const result = await db.query(
      "update public.ppdm2_tasks set status='done',completed_at='2000-01-01' where id=$1 returning completed_at",
      [ta],
    );
    expect(new Date(result.rows[0].completed_at).getFullYear()).toBeGreaterThan(
      2000,
    );
    await db.query(
      "update public.ppdm2_tasks set status='pending' where id=$1",
      [ta],
    );
    expect(
      (
        await db.query(
          "select completed_at from public.ppdm2_tasks where id=$1",
          [ta],
        )
      ).rows[0].completed_at,
    ).toBeNull();
    await expect(
      db.query(
        'update public.ppdm2_tasks set checklist=\'[{"text":"Passo","done":"sim"}]\' where id=$1',
        [ta],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("bloqueia consultas sem autenticação", async () => {
    await db.exec("set role anon");
    await expect(
      db.query("select * from public.ppdm2_tasks"),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("cada conta só lê as próprias tarefas", async () => {
    await asUser(a);
    expect((await db.query("select id from public.ppdm2_tasks")).rows).toEqual([
      { id: ta },
    ]);
    await asUser(b);
    expect((await db.query("select id from public.ppdm2_tasks")).rows).toEqual([
      { id: tb },
    ]);
  });
  it("permite o CRUD completo do dono", async () => {
    await asUser(a);
    const created = await db.query(
      "insert into public.ppdm2_tasks(user_id,title) values ($1,'Nova tarefa') returning id",
      [a],
    );
    const id = created.rows[0].id;
    expect(
      (
        await db.query(
          "update public.ppdm2_tasks set status='done' where id=$1 returning status",
          [id],
        )
      ).rows,
    ).toEqual([{ status: "done" }]);
    expect(
      (
        await db.query(
          "delete from public.ppdm2_tasks where id=$1 returning id",
          [id],
        )
      ).rows,
    ).toEqual([{ id }]);
  });
  it("não permite inserir uma tarefa em nome de outra pessoa", async () => {
    await asUser(a);
    await expect(
      db.query(
        "insert into public.ppdm2_tasks(user_id,title) values ($1,'Invasão')",
        [b],
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("não permite transferir a propriedade por UPDATE", async () => {
    await asUser(a);
    await expect(
      db.query("update public.ppdm2_tasks set user_id=$1 where id=$2", [b, ta]),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("não atualiza nem exclui registros de outra conta", async () => {
    await asUser(a);
    expect(
      (
        await db.query(
          "update public.ppdm2_tasks set title='Invasão' where id=$1 returning id",
          [tb],
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await db.query(
          "delete from public.ppdm2_tasks where id=$1 returning id",
          [tb],
        )
      ).rows,
    ).toEqual([]);
    await asUser(b);
    expect(
      (await db.query("select title from public.ppdm2_tasks where id=$1", [tb]))
        .rows,
    ).toEqual([{ title: "Tarefa de B" }]);
  });
  it("o arquivo de configuração pode ser reaplicado sem duplicar políticas", async () => {
    await db.exec("reset role");
    await db.exec(setup);
    expect(
      (
        await db.query(
          "select count(*)::int as total from pg_policies where tablename='ppdm2_tasks'",
        )
      ).rows,
    ).toEqual([{ total: 4 }]);
  });
});

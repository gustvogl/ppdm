-- Execute este arquivo uma vez no SQL Editor do seu projeto Supabase.
-- Tabela própria da base da atividade; não altera o CRUD de outro projeto.
begin;

create table if not exists public.ppdm2_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists ppdm2_tasks_owner_created_idx
  on public.ppdm2_tasks (user_id, created_at desc);

alter table public.ppdm2_tasks enable row level security;

-- GRANT controla acesso à tabela; RLS controla quais linhas podem ser acessadas.
revoke all on public.ppdm2_tasks from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ppdm2_tasks to authenticated;

drop policy if exists "ppdm2_select_own" on public.ppdm2_tasks;
drop policy if exists "ppdm2_insert_own" on public.ppdm2_tasks;
drop policy if exists "ppdm2_update_own" on public.ppdm2_tasks;
drop policy if exists "ppdm2_delete_own" on public.ppdm2_tasks;

create policy "ppdm2_select_own" on public.ppdm2_tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "ppdm2_insert_own" on public.ppdm2_tasks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "ppdm2_update_own" on public.ppdm2_tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "ppdm2_delete_own" on public.ppdm2_tasks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;

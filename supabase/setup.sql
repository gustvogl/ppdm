-- Execute este arquivo uma vez no SQL Editor do seu projeto Supabase.
-- Tabela própria da base da atividade; não altera o CRUD de outro projeto.
begin;

create table if not exists public.ppdm2_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  description text not null default '' check (char_length(description) <= 500),
  color text not null default '#487763' check (color in ('#487763','#6286ad','#9b739e','#c08c4e','#c27070','#6a8e86')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.ppdm2_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz not null default now()
);

-- Atualização compatível com a versão 1, preservando tarefas já cadastradas.
alter table public.ppdm2_tasks drop constraint if exists ppdm2_tasks_status_check;
alter table public.ppdm2_tasks add constraint ppdm2_tasks_status_check check (status in ('pending', 'in_progress', 'done'));
alter table public.ppdm2_tasks add column if not exists project_id uuid;
alter table public.ppdm2_tasks add column if not exists tags text[] not null default '{}';
alter table public.ppdm2_tasks add column if not exists checklist jsonb not null default '[]';
alter table public.ppdm2_tasks add column if not exists pinned boolean not null default false;
alter table public.ppdm2_tasks add column if not exists updated_at timestamptz not null default now();
alter table public.ppdm2_tasks add column if not exists completed_at timestamptz;
-- O vínculo só pode apontar para um projeto do mesmo proprietário.
alter table public.ppdm2_tasks drop constraint if exists ppdm2_tasks_project_owner_fk;
alter table public.ppdm2_tasks add constraint ppdm2_tasks_project_owner_fk
  foreign key (user_id, project_id) references public.ppdm2_projects(user_id, id)
  on delete set null (project_id);

create or replace function public.ppdm2_valid_checklist(value jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(value) = 'array' then
    jsonb_array_length(value) <= 30 and not exists (
      select 1 from jsonb_array_elements(value) item
      where jsonb_typeof(item) is distinct from 'object'
         or jsonb_typeof(item->'text') is distinct from 'string'
         or char_length(btrim(item->>'text')) not between 1 and 160
         or jsonb_typeof(item->'done') is distinct from 'boolean'
    ) else false end
$$;
alter table public.ppdm2_tasks drop constraint if exists ppdm2_tasks_checklist_valid;
alter table public.ppdm2_tasks add constraint ppdm2_tasks_checklist_valid check (public.ppdm2_valid_checklist(checklist));
alter table public.ppdm2_tasks drop constraint if exists ppdm2_tasks_tags_valid;
create or replace function public.ppdm2_valid_tags(value text[])
returns boolean language sql immutable set search_path = '' as $$
  select cardinality(value) <= 8 and coalesce(array_ndims(value),1) = 1
    and not exists (select 1 from unnest(value) tag where tag is null or char_length(btrim(tag)) not between 1 and 24)
$$;
alter table public.ppdm2_tasks add constraint ppdm2_tasks_tags_valid
  check (public.ppdm2_valid_tags(tags));

create or replace function public.ppdm2_stamp_task()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.status <> 'done' then new.completed_at = null;
  elsif tg_op = 'INSERT' then new.completed_at = now();
  elsif old.status <> 'done' then new.completed_at = now();
  else new.completed_at = old.completed_at;
  end if;
  return new;
end;
$$;
drop trigger if exists ppdm2_tasks_stamp on public.ppdm2_tasks;
create trigger ppdm2_tasks_stamp before insert or update on public.ppdm2_tasks
  for each row execute function public.ppdm2_stamp_task();

create or replace function public.ppdm2_stamp_project()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists ppdm2_projects_stamp on public.ppdm2_projects;
create trigger ppdm2_projects_stamp before update on public.ppdm2_projects
  for each row execute function public.ppdm2_stamp_project();

create index if not exists ppdm2_projects_owner_idx on public.ppdm2_projects(user_id);
create index if not exists ppdm2_tasks_owner_project_idx on public.ppdm2_tasks(user_id, project_id);
create index if not exists ppdm2_tasks_owner_due_idx on public.ppdm2_tasks(user_id, due_date) where status <> 'done';
create index if not exists ppdm2_tasks_owner_created_idx
  on public.ppdm2_tasks (user_id, created_at desc);

alter table public.ppdm2_tasks enable row level security;
alter table public.ppdm2_projects enable row level security;

-- GRANT controla acesso à tabela; RLS controla quais linhas podem ser acessadas.
revoke all on public.ppdm2_tasks, public.ppdm2_projects from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ppdm2_tasks, public.ppdm2_projects to authenticated;

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

drop policy if exists "ppdm2_project_select_own" on public.ppdm2_projects;
drop policy if exists "ppdm2_project_insert_own" on public.ppdm2_projects;
drop policy if exists "ppdm2_project_update_own" on public.ppdm2_projects;
drop policy if exists "ppdm2_project_delete_own" on public.ppdm2_projects;
create policy "ppdm2_project_select_own" on public.ppdm2_projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "ppdm2_project_insert_own" on public.ppdm2_projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ppdm2_project_update_own" on public.ppdm2_projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ppdm2_project_delete_own" on public.ppdm2_projects for delete to authenticated using ((select auth.uid()) = user_id);

commit;

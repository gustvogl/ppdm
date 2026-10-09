-- Diagnóstico somente leitura. Execute no SQL Editor após setup.sql.
select c.relname as tabela, c.relrowsecurity as rls_ativa
from pg_class c join pg_namespace n on c.relnamespace = n.oid
where n.nspname = 'public' and c.relname in ('ppdm2_tasks','ppdm2_projects');

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' and tablename in ('ppdm2_tasks','ppdm2_projects')
order by tablename, policyname;

select has_table_privilege('anon', 'public.ppdm2_tasks', 'select') as anon_pode_ler,
       has_table_privilege('authenticated', 'public.ppdm2_tasks', 'select') as autenticado_pode_ler,
       has_table_privilege('anon', 'public.ppdm2_projects', 'select') as anon_pode_ler_projetos,
       has_table_privilege('authenticated', 'public.ppdm2_projects', 'select') as autenticado_pode_ler_projetos;

-- Esperado: rls_ativa=true nas duas tabelas, quatro políticas por tabela, anon_pode_ler=false,
-- autenticado_pode_ler=true. Esta consulta estrutural NÃO substitui o teste
-- funcional com duas contas autenticadas, descrito em docs/ENTREGA.md.

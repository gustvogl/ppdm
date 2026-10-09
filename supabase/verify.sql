-- Diagnóstico somente leitura. Execute no SQL Editor após setup.sql.
select c.relname as tabela, c.relrowsecurity as rls_ativa
from pg_class c join pg_namespace n on c.relnamespace = n.oid
where n.nspname = 'public' and c.relname = 'ppdm2_tasks';

select policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'ppdm2_tasks'
order by policyname;

select has_table_privilege('anon', 'public.ppdm2_tasks', 'select') as anon_pode_ler,
       has_table_privilege('authenticated', 'public.ppdm2_tasks', 'select') as autenticado_pode_ler;

-- Esperado: rls_ativa=true, quatro políticas, anon_pode_ler=false,
-- autenticado_pode_ler=true. Esta consulta estrutural NÃO substitui o teste
-- funcional com duas contas autenticadas, descrito em docs/ENTREGA.md.

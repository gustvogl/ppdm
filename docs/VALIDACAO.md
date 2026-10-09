# Validação do Nexo 2

## Verificações realizadas

- `npm test`: **39 testes passaram**, em quatro arquivos.
- `npm run build`: build de produção concluído, incluindo manifest, ícones e service worker.
- PostgreSQL local: `supabase/setup.sql` executado em PGlite, com duas contas fictícias e papéis `anon` e `authenticated`.
- Chromium: fluxos da interface testados em **1440 × 960**, **390 × 844** e **360 × 800**, com autenticação e REST simulados. Sem rolagem horizontal nos cenários conferidos e sem erros JavaScript não tratados.
- Preview do build: service worker ativado, dez arquivos estáticos no cache, ícones 192/512 válidos, interface disponível sem rede e rota protegida ainda levando visitante ao login.

## O que os testes cobrem

| Área | Cobertura |
| --- | --- |
| Sessão | Aguardar inicialização, restaurar sessão, não sobrescrever login com leitura antiga, limpar ao sair e remover assinatura |
| Rotas | Visitantes bloqueados, usuários restaurados, retorno inicial aguardando PKCE, erro de consentimento preservado |
| E-mail/Google | Chamadas do SDK, erros, confirmação de senha, cadastro sem sessão e resposta genérica de recuperação |
| Recuperação | `PASSWORD_RECOVERY` abre troca de senha antes do CRUD; visitante não atualiza senha sem sessão |
| SQL | GRANTs, RLS em tarefas/projetos, CRUD do dono, isolamento entre contas e reaplicação do script |
| Vínculos | Tarefa não pode apontar para projeto alheio; exclusão do projeto próprio preserva tarefas sem vínculo |
| Integridade | Validação de checklist no banco e timestamps de conclusão definidos pelo trigger |
| Validações | Datas reais, campos permitidos, limites de etiquetas/checklist, cor de projeto e metadados inesperados |
| Exportação | JSON sem dados de autenticação, vínculos consistentes, projetos repetidos/ausentes rejeitados, CSV com escape e neutralização de fórmulas |
| Leitura | Mais de uma página da API e propagação de falhas sem apresentar resultado parcial como leitura completa |

A revisão no navegador também exercitou criação/edição/exclusão de tarefas e projetos, checklist, favorito, seleção de status do Kanban, filtro/busca, calendário, gráficos, timer, edição de nome, tema escuro, CSV, download JSON, importação, logout e troca de conta. A importação criou novos vínculos corretamente. O cancelamento da exclusão manteve o projeto; a confirmação removeu o projeto e conservou as tarefas.

As contas e respostas de backend desses testes são fictícias. As prévias de interface não são evidências de login Google real e não foram incluídas como comprovação escolar.

## Limites e validação no projeto real

Ainda é necessário verificar com o seu ambiente:

1. Client ID/Secret e consentimento no Google Cloud.
2. Callback e redirects do provedor Google no Supabase.
3. Login Google real, nome/e-mail/foto e registro em **Authentication → Users**.
4. Confirmação/recuperação por e-mail, templates, SMTP e limites.
5. Políticas aplicadas ao Supabase escolhido, testadas com duas contas reais.
6. Hospedagem HTTPS, recuperação de senha no domínio publicado e instalação PWA no seu Android/iPhone.
7. Link GitHub e capturas/gravação para o professor.

Não há APK, publicação em lojas, push em segundo plano ou escrita offline. Preferências e contagem do timer são locais. A importação adiciona cópias e informa o progresso; não é uma restauração transacional nem um histórico de auditoria. Consulte o README para detalhes.

Para reproduzir os testes incluídos, use `npm ci`, `npm test` e `npm run build`. Para a verificação real da atividade, siga `docs/ENTREGA.md`.

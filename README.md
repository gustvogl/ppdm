# Nexo 2 — seu próximo passo

Aplicativo pessoal de tarefas e projetos em **React + Supabase**, com interface em português para computador e celular. Preparado para a **Atividade 10 de PPDM2**, professor **Adriano Rosa Mazetto**. Esta é a evolução da base independente Nexo; o código do app anterior da disciplina não foi fornecido.

## O que funciona

| Área         | Recursos                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Conta        | Google OAuth com PKCE, cadastro e login por e-mail, confirmação de conta, recuperação/troca de senha, edição do nome e logout          |
| Sessão       | Context API, restauração ao abrir, escuta de eventos, rotas protegidas, tratamento de `PASSWORD_RECOVERY` e limpeza ao trocar de conta |
| Tarefas      | Criar, editar, excluir, concluir/reabrir, três status, prioridade, prazo, projeto, etiquetas, checklist e favoritos                    |
| Organização  | Lista paginada, quadro Kanban com arraste e seletor acessível, busca global, filtros e ordenação                                       |
| Projetos     | CRUD, cor, descrição, progresso e tarefas vinculadas; excluir projeto preserva as tarefas                                              |
| Calendário   | Navegação mensal, seleção de dia, agenda e criação de tarefa com prazo preenchido                                                      |
| Progresso    | Conclusões dos últimos sete dias, distribuição por status, projeto e prioridade, indicadores de hoje e atraso                          |
| Foco         | Timer de foco/pausa, seleção de tarefa, pausar, continuar e reiniciar                                                                  |
| Preferências | Tema claro/escuro/sistema, lista compacta, prioridade padrão e duração do timer, separadas por conta neste navegador                   |
| Dados        | Backup JSON, importação com confirmação, exportação CSV para planilhas e consultas sem truncamento no limite padrão da API             |
| Celular      | Interface responsiva, navegação inferior, manifest, ícones, instalação PWA e cache somente dos arquivos estáticos                      |
| Banco        | RLS por dono em tarefas e projetos, permissões explícitas, chave estrangeira que impede vincular tarefa a projeto alheio               |

**Situação:** código compilado e testado localmente. Sem credenciais reais incluídas, projeto Supabase provisionado, Google OAuth real comprovado, repositório publicado ou APK compilado. Os testes usam contas simuladas ou PostgreSQL local. Para usar o app com suas contas, execute a configuração abaixo. As evidências do professor precisam ser produzidas com o seu projeto real.

## Começar

Use **Node.js 24.15 ou superior**, preferencialmente Node 24, e abra o terminal na pasta de `package.json`.

```bash
npm ci
```

1. Abra seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. No **SQL Editor**, execute `supabase/setup.sql`. Ele cria/atualiza as tabelas próprias do Nexo. Também pode ser reaplicado na versão 1, preservando as tarefas.
3. Copie `.env.example` para `.env` na raiz e preencha a URL do projeto e a chave pública **publishable**:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

No PowerShell: `Copy-Item .env.example .env`. Projetos legados podem usar `VITE_SUPABASE_ANON_KEY` em vez da publishable. Reinicie o servidor após editar as variáveis.

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Se essa porta estiver ocupada, encerre o outro servidor; a porta não muda silenciosamente. Sem configuração, a tela mostra um aviso e desativa os botões de autenticação. O app não cria uma sessão fictícia como alternativa.

## Google Cloud Console em português

1. Entre no [Google Cloud Console](https://console.cloud.google.com/) e crie/selecione um projeto.
2. Abra **Menu ☰ → Plataforma de autenticação do Google**. No primeiro acesso, clique em **Começar**.
3. Em **Branding / Informações da marca**, informe nome do app, e-mail de suporte e contato. Em **Público-alvo**, escolha **Externo**. Se solicitado, adicione sua conta em **Usuários de teste**.
4. Em **Clientes → Criar cliente**, escolha **Aplicativo da Web** e nomeie como `Nexo Web`.
5. Preencha os valores abaixo. O painel também pode apresentar os menus antigos **APIs e Serviços → Tela de permissão OAuth / Credenciais**.

| Campo                                | Valor local                                            |
| ------------------------------------ | ------------------------------------------------------ |
| Origens JavaScript autorizadas       | `http://localhost:5173`                                |
| URIs de redirecionamento autorizados | `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback` |

Copie **o callback exato apresentado no provedor Google do Supabase**, especialmente se usar um domínio personalizado. Não coloque `localhost` no lugar do callback do Supabase.

Guarde o **ID do cliente** e a **Chave secreta do cliente** para o painel do Supabase. Mantenha os escopos de identidade, e-mail e perfil necessários ao login.

## Supabase Auth

Em **Authentication → Sign In / Providers → Google**, habilite o provedor e preencha o ID e o segredo do cliente Google. Salve.

Em **Authentication → URL Configuration**, configure:

| Campo                                | Valor                                   |
| ------------------------------------ | --------------------------------------- |
| Site URL                             | `http://localhost:5173`                 |
| Redirect URLs — login/confirmação    | `http://localhost:5173/`                |
| Redirect URLs — recuperação de senha | `http://localhost:5173/redefinir-senha` |

O **Google retorna ao callback do Supabase**. O **Supabase retorna ao endereço do app**. O SDK processa o código PKCE antes do redirecionamento interno. Links de confirmação e recuperação devem ser abertos no mesmo navegador em que o fluxo começou, por causa do verificador PKCE.

Verifique também o provedor **Email**, a permissão de novos cadastros e a confirmação de e-mail. O app nunca trata um cadastro sem sessão como um usuário logado. Para envio de e-mails em produção, configure o SMTP e os limites adequados no projeto. Falhas e limites são apresentados na interface.

## Usar o aplicativo

- **Visão geral:** progresso, tarefas em aberto, prazos de hoje e atrasos. Clique em um indicador para abrir a lista filtrada.
- **Minhas tarefas:** crie/edite tarefas, passos do checklist, etiquetas e favoritos. Troque entre lista e quadro. No computador, arraste cartões; no celular e teclado, use o seletor de status.
- **Projetos:** reúna tarefas em objetivos. Excluir um projeto exige confirmação e deixa suas tarefas sem projeto.
- **Calendário:** selecione um dia e use **Tarefa neste dia** para preencher o prazo.
- **Meu progresso:** os gráficos usam registros atuais. Excluir uma tarefa remove sua contribuição; não são um histórico de auditoria. Conclusões anteriores sem data conhecida não entram no gráfico semanal.
- **Modo foco:** o timer continua durante a navegação interna enquanto o app estiver aberto. Ao terminar, mostra um aviso dentro do app. Fechar o app ou sair da conta encerra o timer e sua contagem de blocos. Uma alteração de duração nas configurações reinicia o timer.
- **Meu perfil:** mostra dados reais da sessão, permite editar o nome, alterar a senha e sair deste dispositivo. A foto aparece quando fornecida pelo Google.
- **Configurações:** preferências deste navegador, instalação, CSV e backup.
- **Lembretes:** o sino lista tarefas atrasadas e previstas para hoje dentro do aplicativo. Não envia push, SMS ou e-mails de lembrete.

Atalhos: **Ctrl/⌘ + K** busca tarefas, **N** cria uma tarefa quando nenhum campo ou janela está em edição, e **Esc** fecha a janela. As rotas das telas são preservadas ao recarregar e podem ser acessadas diretamente após entrar.

Os dados são carregados ao entrar, ao atualizar manualmente, ao voltar a focar a janela e ao reconectar. Não há edição offline ou sincronização por WebSocket nesta versão. Enquanto desconectado, o app informa a situação e impede novas ações de gravação pela interface.

### Backup e importação

O JSON leva projetos, tarefas e seus campos, sem IDs de conta, tokens ou senhas. Os vínculos de projeto são remapeados para registros pertencentes à conta que importa. CSV escapa textos e neutraliza inícios de fórmula para abrir em planilhas.

A importação **adiciona cópias**, mantendo os registros atuais; não substitui a conta nem conserva os timestamps originais. Conclusões importadas recebem a data da importação. Importar duas vezes cria registros repetidos. Limites: arquivo de até 5 MB, até 100 projetos e 1.000 tarefas por importação. Em caso de interrupção, o app informa quantos registros já foram adicionados; a operação não é uma transação única. Não importe o mesmo arquivo novamente sem considerar as cópias.

## Instalar no celular e publicar

Compile:

```bash
npm run build
npm run preview
```

O build gera `dist/`, o manifest e um service worker com os arquivos estáticos da versão. A instalação é de uma **PWA**, pelo navegador. Não é um APK nem uma publicação nas lojas.

1. Hospede `dist/` com HTTPS e fallback de rotas para `index.html`. `vercel.json` já inclui essa configuração para Vercel.
2. Configure as duas variáveis públicas no ambiente de build da hospedagem e gere um novo build.
3. No Google, adicione a origem `https://SEU_DOMINIO`.
4. No Supabase, defina a Site URL pública e adicione os retornos exatos `https://SEU_DOMINIO/` e `https://SEU_DOMINIO/redefinir-senha`.
5. Teste o Google, a recuperação e o CRUD no domínio publicado.
6. No Android, use **Instalar aplicativo** no menu do navegador ou o botão em Configurações quando disponível. No iPhone, Safari → Compartilhar → Adicionar à Tela de Início. A opção depende do navegador.

O preview usa [http://localhost:4173](http://localhost:4173). Para testar Auth nessa porta, autorize também essa origem no Google e ambos os retornos correspondentes no Supabase.

O service worker guarda somente a interface, ícones e arquivos do build. Não guarda respostas da API, credenciais ou URLs de retorno OAuth no Cache Storage. A sessão persistente continua sendo gerenciada pelo SDK no armazenamento do navegador. É necessário internet para entrar e consultar/salvar dados. Uma atualização do cache aguarda fechar as janelas antigas antes de ativar o novo build.

## Segurança dos dados

As tabelas `ppdm2_tasks` e `ppdm2_projects` têm RLS e quatro políticas por dono. Todas as operações usam o usuário autenticado. A chave estrangeira `(user_id, project_id)` impede vincular uma tarefa ao projeto de outra conta. O SQL Editor é administrador e não comprova o isolamento do usuário final; teste com duas contas reais.

URL e publishable/anon são públicas. **Toda variável `VITE_` vai para o navegador.** Não coloque `service_role`, `sb_secret_`, senha de banco ou Client Secret do Google no frontend. O segredo Google fica apenas no painel do Supabase. `.env` é ignorado pelo Git; `.env.example` contém exemplos. Nome e foto em `user_metadata` são apresentação, nunca autorização.

## Verificar e entregar

```bash
npm test
npm run build
```

Leia `docs/VALIDACAO.md` para o alcance dos testes e `docs/ENTREGA.md` para as evidências reais exigidas. `supabase/verify.sql` faz o diagnóstico estrutural somente leitura.

Crie um repositório GitHub, substitua a URL abaixo pela sua e envie:

```bash
git init -b main
git add .
git commit -m "Implementa Nexo com Supabase Auth e projetos protegidos"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Não envie `.env`, `node_modules` ou `dist`. O professor precisa do **link do repositório e prints/gravação do Google funcionando e do usuário registrado no Supabase**, além do código. O ZIP sozinho não atende ao critério de entrega.

## Estrutura principal

| Arquivos                                                                 | Responsabilidade                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------- |
| `src/context/AuthContext.jsx`                                            | Login, cadastro, sessão, recuperação, perfil e logout     |
| `src/App.jsx`, `src/components/ProtectedRoute.jsx`                       | Retornos PKCE e proteção de todas as telas internas       |
| `src/pages/Workspace.jsx`                                                | Navegação, painel e integração das operações              |
| `src/components/`                                                        | Formulários, calendário, relatórios, foco e configurações |
| `src/lib/tasks.js`, `projects.js`, `readRows.js`                         | Operações do banco e paginação da leitura                 |
| `src/lib/backup.js`                                                      | Exportação, validação e leitura do backup                 |
| `src/hooks/useWorkspaceData.js`                                          | Estado por conta e atualização dos dados                  |
| `src/hooks/usePreferences.js`                                            | Preferências locais e tema                                |
| `supabase/setup.sql`                                                     | Esquema, atualização da versão 1, índices, triggers e RLS |
| `public/manifest.webmanifest`, `pwa/service-worker.js`, `vite.config.js` | Instalação e cache estático gerado no build               |

Para adaptar a autenticação ao seu CRUD anterior, consulte `docs/INTEGRAR_NO_SEU_APP.md`.

## Problemas comuns

| Problema                                   | Conferir                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `redirect_uri_mismatch`                    | Callback Google idêntico ao apresentado pelo Supabase                          |
| Conta Google bloqueada                     | Público-alvo, estado e usuários de teste solicitados pelo console              |
| Recuperação volta para lugar errado        | Autorizar o retorno completo `/redefinir-senha` e conferir templates de e-mail |
| Link expirado ou aberto em outro navegador | Solicitar novo link no mesmo navegador e abri-lo nele                          |
| Tabela/campo não encontrado                | Executar o `supabase/setup.sql` da versão 2 no mesmo projeto do `.env`         |
| `permission denied` / `42501`              | GRANTs e políticas; manter RLS ativada                                         |
| E-mail não chega                           | Spam, SMTP, limites e confirmação do projeto                                   |
| App não instala                            | HTTPS, build publicado, manifest/ícones e suporte do navegador                 |
| Alteração de `.env` não aparece            | Reiniciar Vite ou gerar novo build de produção                                 |

## Referências oficiais

- [Google OAuth com Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Recuperação de senha](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Eventos de autenticação](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Clientes OAuth Google](https://support.google.com/cloud/answer/15549257)
- [Instalação PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

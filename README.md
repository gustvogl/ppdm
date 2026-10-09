# Nexo — PPDM2 · Atividade 10

Base independente em **React + Supabase Auth**, preparada para a atividade de autenticação do 4º semestre, professor **Adriano Rosa Mazetto**. O CRUD de exemplo organiza tarefas pessoais. Como o código do aplicativo anterior não foi fornecido, este projeto não modifica nem substitui aquele aplicativo.

## O que está implementado

- Login com Google por `signInWithOAuth`, usando fluxo PKCE.
- Cadastro por e-mail com `signUp` e login com `signInWithPassword`.
- Sessão global com React Context, `getSession` e `onAuthStateChange`.
- Restauração da sessão após recarregar a página e logout deste dispositivo.
- Rota `/app` protegida e perfil com nome, e-mail e foto, quando disponíveis.
- CRUD de tarefas: criar, listar, editar, concluir/reabrir e excluir.
- Busca, filtro de status, prioridade, data opcional e indicadores de progresso.
- SQL com RLS e permissões que limitam os registros ao dono.
- Layout responsivo para computador e celular, navegação por teclado e respeito a movimento reduzido.
- Testes de autenticação, validação e execução das políticas em PostgreSQL local.

**Situação da entrega:** código preparado e validado localmente. Não há credenciais reais incluídas, projeto Supabase provisionado, login Google real comprovado, repositório publicado ou APK compilado. Os testes automatizados usam clientes simulados ou PostgreSQL local com usuários fictícios; não substituem as evidências reais exigidas pelo professor.

## 1. Preparar o computador

Instale **Node.js 24, versão 24.15.0 ou superior**, e use o terminal na pasta que contém `package.json`.

```bash
npm ci
```

As versões estão fixadas no `package.json` e no `package-lock.json`. O ZIP contém os arquivos na raiz, sem uma pasta externa envolvendo o projeto.

## 2. Preparar o Supabase

1. Abra seu projeto em <https://supabase.com/dashboard>.
2. Entre no **SQL Editor**, cole o conteúdo de `supabase/setup.sql` e execute.
3. Se quiser conferir a estrutura, execute também `supabase/verify.sql`.
4. Em configurações do projeto, copie a **Project URL** e uma chave **publishable**. Projetos legados também podem usar a **anon key**.
5. Copie `.env.example` para `.env`, na mesma pasta de `package.json`, e preencha:

No PowerShell do Windows, você pode criar a cópia com `Copy-Item .env.example .env`.

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Para anon key legada, use `VITE_SUPABASE_ANON_KEY` no lugar da variável publishable.

O app exibe um aviso e mantém os botões de autenticação desativados enquanto faltar configuração. Ele não oferece um login fictício nem acesso local ao CRUD como alternativa.

**Chaves no frontend:** URL e publishable/anon são credenciais públicas de cliente, protegidas pelas políticas do banco. As variáveis `VITE_` vão para o código entregue ao navegador. Por isso, não coloque nelas `service_role`, `sb_secret_`, senha de banco ou Client Secret do Google. `.env` está no `.gitignore`; `.env.example` contém apenas exemplos. O Client Secret do Google fica no painel do Supabase.

## 3. Criar o cliente OAuth do Google

1. Abra <https://console.cloud.google.com/> e selecione/crie o projeto da disciplina.
2. Em **Google Auth Platform**, preencha **Branding** com nome do app e contatos. Em **Audience**, escolha **External/Externo**. Esses recursos também podem aparecer pelo menu antigo **APIs e Serviços → Tela de permissão OAuth**.
3. Se o console solicitar contas de teste, inclua o e-mail que usará na apresentação. Para o perfil básico, mantenha apenas os escopos de identidade, e-mail e perfil.
4. Em **Clients**, crie um cliente do tipo **Web application / Aplicativo da Web**.
5. Configure as origens e o callback usando a tabela abaixo. Copie o callback exibido pelo provedor Google do seu projeto Supabase, sem modificar nada.
6. Guarde o **Client ID** e o **Client Secret** para a próxima etapa.

| Campo do Google               | Valor para desenvolvimento                             |
| ----------------------------- | ------------------------------------------------------ |
| Authorized JavaScript origins | `http://localhost:5173`                                |
| Authorized redirect URIs      | `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback` |

O callback acima corresponde a um projeto hospedado no Supabase. Se o seu projeto usar domínio personalizado, use o callback exato apresentado no painel.

## 4. Ativar Google no Supabase

Em **Authentication → Sign In / Providers → Google**, habilite o provedor, informe Client ID e Client Secret e salve.

Depois, em **Authentication → URL Configuration**, configure:

| Campo do Supabase | Valor                    |
| ----------------- | ------------------------ |
| Site URL          | `http://localhost:5173`  |
| Redirect URLs     | `http://localhost:5173/` |

Existem dois retornos diferentes: o **Google volta para o callback do Supabase**; o **Supabase volta para a raiz do app**. `authReturnUrl()` produz essa raiz e a usa no login Google e na confirmação por e-mail. O SDK processa o código PKCE ao restaurar a sessão.

Para a demonstração por e-mail, verifique também se o provedor **Email** e os cadastros estão habilitados. Se houver confirmação de e-mail, a conta só acessará o CRUD após confirmar e obter uma sessão.

## 5. Executar e testar com sua conta

```bash
npm run dev
```

Abra **<http://localhost:5173>**. A porta é fixa: se estiver ocupada, encerre o outro servidor. O projeto não troca de porta silenciosamente, evitando divergências nos redirects.

1. Clique em **Entrar com Google**, escolha sua conta e conclua o consentimento.
2. Após o retorno, abra **Meu perfil**: confira nome, e-mail e foto disponível.
3. Crie uma tarefa, edite, conclua, reabra e exclua uma tarefa de teste.
4. Recarregue a página: a sessão deve continuar ativa.
5. Saia da conta e tente abrir `/app`: deve retornar ao login.
6. Entre com uma segunda conta: a lista deve ser independente.
7. No painel Supabase, abra **Authentication → Users** e confira o usuário criado.

O SDK guarda a sessão no armazenamento do navegador. Use **Sair da conta** em um computador compartilhado. O logout implementado usa `scope: 'local'`, encerrando esta sessão sem desconectar outros dispositivos.

Os dados exibidos em `user_metadata` servem apenas para apresentação do perfil. A autorização no banco usa o identificador autenticado (`auth.uid()`), nunca o nome ou outro campo editável de perfil.

## 6. Compilar e verificar

```bash
npm test
npm run build
npm run preview
```

O build gera `dist/`. O preview usa <http://localhost:4173>; para testar OAuth nele, adicione também essa origem e `http://localhost:4173/` à configuração correspondente. Para a entrega local, prefira o servidor da porta 5173.

O conjunto de testes cobre rotas, restauração da sessão, eventos de login/logout, erros de credenciais, confirmação de senha/e-mail, validações e políticas SQL. Os testes do banco usam PGlite (PostgreSQL em WASM), com dois usuários fictícios. Leia `docs/VALIDACAO.md` para entender o alcance da verificação.

## 7. Enviar ao GitHub e ao professor

Crie um repositório na sua conta e envie o código, incluindo `.env.example`, `package.json`, `package-lock.json`, `src/`, `public/`, `supabase/`, `tests/` e `docs/`. Não envie `.env`, `node_modules/` ou `dist/`.

Se preferir Git pelo terminal, substitua a URL abaixo pela URL do repositório que você criou:

```bash
git init -b main
git add .
git commit -m "Implementa Supabase Auth e CRUD protegido"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Envie ao professor **o link do repositório e as evidências reais** listadas em `docs/ENTREGA.md`. O ZIP sozinho não atende ao critério do link GitHub.

## Publicação web opcional

O `vercel.json` contém fallback das rotas para a SPA. Em uma hospedagem compatível, use `npm ci`, build `npm run build` e saída `dist`; configure as duas variáveis públicas no ambiente de build. Após publicar, cadastre a origem pública no Google e o retorno exato `https://SEU_DOMINIO/` no Supabase. Defina a Site URL pública e faça um novo teste real.

Este projeto tem interface móvel no navegador. **Não contém integração nativa de retorno OAuth para Capacitor nem um APK**. Para um app Android empacotado, o retorno por deep link precisa ser implementado e testado no aplicativo nativo.

## Onde cada requisito aparece

| Requisito                                | Arquivo principal                                  |
| ---------------------------------------- | -------------------------------------------------- |
| Cliente do Supabase e PKCE               | `src/lib/supabaseClient.js`                        |
| Google, cadastro, login, sessão e logout | `src/context/AuthContext.jsx`                      |
| Interfaces de cadastro e login           | `src/pages/AuthPage.jsx`                           |
| Redirecionamento e rotas protegidas      | `src/App.jsx`, `src/components/ProtectedRoute.jsx` |
| Perfil e telas internas                  | `src/pages/Workspace.jsx`                          |
| Operações do CRUD                        | `src/lib/tasks.js`, `src/hooks/useTasks.js`        |
| RLS e permissões por proprietário        | `supabase/setup.sql`                               |
| Roteiro de evidências                    | `docs/ENTREGA.md`                                  |

Para integrar a autenticação ao CRUD do seu app anterior, siga `docs/INTEGRAR_NO_SEU_APP.md`.

## Problemas comuns

| Problema                           | Verificação                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `redirect_uri_mismatch`            | O callback autorizado no Google precisa coincidir exatamente com o callback do Supabase.               |
| Google está desativado             | Confira provedor habilitado, Client ID e Client Secret no Supabase.                                    |
| Retorno para o endereço errado     | Confira Site URL e o retorno completo com a barra final na lista de Redirect URLs.                     |
| Conta bloqueada no Google          | Confira Audience, estado do aplicativo e usuários de teste solicitados pelo console.                   |
| Senha correta, mas login negado    | Verifique a confirmação de e-mail.                                                                     |
| Confirmação de e-mail não chega    | Confira spam, limites e configuração de envio do projeto; login Google pode ser testado separadamente. |
| Tabela não encontrada / `PGRST205` | Execute `supabase/setup.sql` no mesmo projeto apontado pelo `.env`.                                    |
| `permission denied` / `42501`      | Confira os GRANTs e as quatro políticas. Não desative RLS para contornar o erro.                       |
| `.env` alterado, mas app igual     | Reinicie o Vite; em produção, gere outro build.                                                        |

## Documentação oficial consultada

- Supabase, Google: <https://supabase.com/docs/guides/auth/social-login/auth-google>
- Supabase, redirects: <https://supabase.com/docs/guides/auth/redirect-urls>
- Supabase, eventos da sessão: <https://supabase.com/docs/reference/javascript/auth-onauthstatechange>
- Supabase, RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase, permissões explícitas de tabelas: <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>
- Google, clientes OAuth: <https://support.google.com/cloud/answer/15549257>

Preparado em 09/10/2026. A entrega escolar informada tem prazo às **16h** nesse dia, horário de São Paulo.

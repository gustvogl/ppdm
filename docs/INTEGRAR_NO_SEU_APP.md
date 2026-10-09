# Integrar a autenticação ao aplicativo anterior

Esta base é independente porque o código do aplicativo original não foi fornecido. Para integrar, faça as mudanças abaixo no seu projeto, preservando o nome, as telas e a tabela do CRUD existente.

1. Instale uma versão compatível de `@supabase/supabase-js`. Esta base usa 2.117.3 e requer Node 24.15 ou superior para as ferramentas escolhidas.
2. Reaproveite `src/lib/supabaseClient.js`, `src/lib/config.js` e `src/lib/errors.js`. Se já houver um cliente Supabase, mantenha uma única instância compartilhada.
3. Adicione `AuthProvider` acima das telas do aplicativo. Leia a sessão com `useAuth()`.
4. Adapte `AuthPage` ao seu design. Preserve as chamadas `signInWithGoogle`, `signIn`, `signUp` e `signOut`.
5. Proteja as rotas internas com `ProtectedRoute` ou uma condição equivalente. Enquanto `loading` for verdadeiro, mostre a tela de carregamento.
6. No CRUD, use `user.id` como dono dos novos registros e como filtro das consultas.
7. Configure RLS na sua própria tabela, com SELECT, INSERT, UPDATE e DELETE por proprietário. O arquivo `setup.sql` desta base cria `ppdm2_tasks` e `ppdm2_projects`; ele não altera automaticamente a tabela antiga.
8. Planeje a atribuição dos registros antigos ao dono correto antes de tornar `user_id` obrigatório. Não atribua registros de outras pessoas ao primeiro usuário que entrar. Para dados compartilhados, use políticas específicas desse modelo.
9. Ao sair ou trocar de conta, limpe o estado do CRUD. Nesta base, `Workspace` recebe `key={user.id}` e é desmontado quando não há usuário.
10. Configure callbacks e redirects para o endereço real do aplicativo e teste com duas contas.

## Provider na raiz de uma aplicação React

```jsx
<BrowserRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</BrowserRouter>
```

## Proteger uma rota

```jsx
<Routes>
  <Route path="/login" element={<SuaTelaDeLogin />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/app" element={<SeuCRUD />} />
  </Route>
</Routes>
```

## Ler os dados da conta

```jsx
const { user, signOut } = useAuth();
const nome = user.user_metadata?.full_name || user.email;
```

Nome e foto são dados de apresentação. A regra de acesso deve usar o identificador autenticado e políticas do banco. Esconder a tela no React sozinho não protege os dados remotos.

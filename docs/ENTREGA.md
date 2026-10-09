# Evidências — PPDM2 · Atividade 10

Professor: **Adriano Rosa Mazetto** · 4º semestre · 100 pontos.
Prazo informado: **09/10/2026, às 16h (São Paulo)**.

## O que enviar

1. Link do repositório GitHub com o código atualizado.
2. Capturas de tela ou uma gravação curta de funcionamento real.

## Capturas obrigatórias

| Arquivo sugerido        | O que mostrar                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `01-login.png`          | Tela inicial com o botão **Entrar com Google** ativo.                                    |
| `02-perfil-logado.png`  | Após o consentimento, tela **Meu perfil** com nome, e-mail ou foto da conta real.        |
| `03-supabase-users.png` | **Authentication → Users** no seu projeto Supabase, mostrando o registro correspondente. |

Na captura do painel, deixe visível apenas o necessário para identificar sua conta. Feche páginas com chaves, segredos ou dados de outras pessoas. Não use prints de clientes simulados como comprovação de OAuth real.

## Gravação sugerida — 60 a 90 segundos

1. Mostre a tela de login e clique em **Entrar com Google**.
2. Escolha a conta e conclua o consentimento, evitando gravar senhas ou códigos pessoais.
3. Após o retorno, abra **Meu perfil** e mostre os dados.
4. Volte a **Minhas tarefas**, crie uma tarefa e marque como concluída.
5. Recarregue a página para mostrar a sessão restaurada.
6. Saia e tente abrir `/app` para mostrar a proteção.
7. Mostre o registro em **Authentication → Users** no painel Supabase.

## Teste adicional de isolamento

Use duas contas diferentes. Crie uma tarefa na conta A, saia e entre com B. A tarefa de A não deve aparecer. Ao sair de B e voltar à conta A, a tarefa deve continuar disponível. O SQL Editor executa como administrador e pode ver todas as linhas; ele não serve como teste de isolamento do usuário final.

## Antes de enviar

- O repositório abre para o professor; se privado, o acesso necessário está concedido.
- `.env` e Client Secret não aparecem no código, nos commits ou nas capturas.
- `package-lock.json` e `.env.example` estão no repositório.
- O README explica a configuração e como executar.
- O login Google foi testado de verdade no endereço usado na gravação.
- As três evidências estão anexadas.

## Explicação para apresentar

“O Supabase Auth faz a autenticação. O botão Google inicia o OAuth e retorna ao nosso app com uma sessão. O AuthContext guarda o estado global e acompanha mudanças de login e logout. A rota interna só abre para quem tem uma sessão. No banco, as políticas de RLS comparam o identificador autenticado com o dono do registro; assim cada conta acessa suas próprias tarefas. Também incluímos cadastro e login por e-mail para os requisitos iniciais da atividade.”

## Modelo de envio

```text
PPDM2 — Atividade 10: Autenticação no App com Supabase Auth
Aluno/grupo: [preencher]
Repositório: [colar link real do GitHub]
Evidências: [anexar capturas ou colar link da gravação]

Implementado: login Google, cadastro/login por e-mail, sessão global,
perfil do usuário, logout, rota protegida e CRUD com RLS por proprietário.
```

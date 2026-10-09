# Validação e limites

## Verificações locais realizadas

- `npm test`: **25 testes passaram**.
- `npm run build`: compilação da aplicação para produção aprovada.
- Autenticação: clientes simulados em ambiente de teste, sem credenciais reais.
- Banco: execução de `setup.sql` em PostgreSQL local com PGlite, usuários fictícios e papéis `anon` e `authenticated`.
- Navegador Chromium: fluxo completo de login por e-mail, CRUD, perfil, logout e troca de conta com respostas de backend simuladas. Conferência visual em 1440 × 960 e 390 × 844, sem rolagem horizontal.

As imagens usadas nesta revisão são apenas prévias de interface com contas fictícias; não foram incluídas como evidências de autenticação real.

## Comportamentos verificados

| Área                 | Resultado esperado coberto                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Primeiro acesso      | Aguardar a sessão antes de decidir o redirecionamento.                                       |
| Visitante            | Não renderizar o CRUD e redirecionar para o login.                                           |
| Sessão existente     | Abrir a área interna ao restaurar a sessão.                                                  |
| Corrida de eventos   | Uma leitura inicial antiga não sobrescreve um login recente.                                 |
| Logout               | O evento SIGNED_OUT fecha a área interna. Uma falha de logout não informa sucesso.           |
| Google               | A chamada envia o provedor e o retorno; falhas exibem uma mensagem.                          |
| E-mail               | Login válido, erro de credenciais, confirmação de senha e cadastro sem sessão.               |
| Credenciais públicas | Rejeitar secret/service_role e valores de exemplo.                                           |
| Validações           | Datas impossíveis, títulos vazios e status inválido são rejeitados.                          |
| RLS                  | Sem acesso de anon; duas contas leem listas diferentes.                                      |
| Escritas             | CRUD do dono permitido; inserção, alteração de dono, edição e exclusão indevidas bloqueadas. |
| SQL                  | Reaplicação sem duplicar as quatro políticas.                                                |

## O que ainda depende do projeto real

- Consentimento e retorno OAuth com uma conta Google real.
- Criação correspondente em Authentication → Users.
- Políticas e permissões aplicadas ao projeto Supabase escolhido.
- Envio e recebimento da confirmação por e-mail, se habilitada.
- Capturas ou gravação de funcionamento para a entrega.
- Publicação do repositório GitHub.

Uma compilação ou um teste com simulação não comprova configuração correta do Google Cloud ou do Supabase Dashboard. Use o roteiro de `ENTREGA.md` para fazer essa comprovação.

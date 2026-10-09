export function authErrorMessage(error) {
  const code = error?.code || "";
  if (code === "invalid_credentials")
    return "E-mail ou senha incorretos. Confira seus dados.";
  if (code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar. Confira também o spam.";
  if (code === "user_already_exists")
    return "Este e-mail já tem uma conta. Tente entrar.";
  if (code === "weak_password")
    return "Escolha uma senha mais forte para sua conta.";
  if (code === "signup_disabled")
    return "Novos cadastros estão desativados neste aplicativo.";
  if (
    code === "provider_disabled" ||
    /provider.*not enabled/i.test(error?.message || "")
  )
    return "O login com Google ainda não está disponível. Você pode entrar com e-mail.";
  if (code.includes("rate_limit") || error?.status === 429)
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  if (error instanceof TypeError || /fetch|network/i.test(error?.message || ""))
    return "Não foi possível conectar. Confira sua internet e tente de novo.";
  return "Não foi possível concluir. Tente novamente ou confira a configuração de autenticação.";
}

export function taskErrorMessage(error) {
  if (error?.code === "42P01" || error?.code === "PGRST205")
    return "O espaço de tarefas ainda não está disponível. Confira a configuração do banco.";
  if (error?.code === "42501")
    return "Seu acesso a estas tarefas não foi autorizado. Entre novamente ou confira as permissões.";
  if (error?.code === "PGRST116")
    return "Esta tarefa já foi alterada ou você não tem acesso a ela. Atualize a lista.";
  if (error?.code === "23514")
    return "Confira os dados da tarefa antes de salvar.";
  if (error instanceof TypeError || /fetch|network/i.test(error?.message || ""))
    return "Sem conexão. Seus dados não foram alterados; tente novamente.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

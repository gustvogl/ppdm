import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  unsubscribe: vi.fn(),
  listener: null,
}));

vi.mock("../src/lib/supabaseClient.js", () => ({
  supabase: { auth: mocks.auth },
  configurationError: null,
  authReturnUrl: (path = "/") => `http://localhost:5173${path}`,
}));

vi.mock("../src/pages/Workspace.jsx", async () => {
  const { useAuth } = await import("../src/context/AuthContext.jsx");
  return {
    default: function FakeWorkspace() {
      const { user } = useAuth();
      return <div>CRUD protegido: {user.email}</div>;
    },
  };
});

import { AuthProvider, useAuth } from "../src/context/AuthContext.jsx";
import App from "../src/App.jsx";

const session = {
  user: {
    id: "user-a",
    email: "aluno@example.com",
    user_metadata: { full_name: "Aluno Teste" },
  },
};
function boot(route = "/app") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mocks.auth.onAuthStateChange.mockImplementation((listener) => {
    mocks.listener = listener;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
  mocks.auth.signInWithOAuth.mockResolvedValue({
    data: { url: "https://accounts.google.com/" },
    error: null,
  });
  mocks.auth.signInWithPassword.mockResolvedValue({
    data: { session },
    error: null,
  });
  mocks.auth.signUp.mockResolvedValue({
    data: { user: session.user, session: null },
    error: null,
  });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  mocks.auth.updateUser.mockResolvedValue({
    data: { user: session.user },
    error: null,
  });
});

describe("sessão e rotas", () => {
  it("espera o estado inicial sem exibir o CRUD a um visitante", async () => {
    const pending = deferred();
    mocks.auth.getSession.mockReturnValue(pending.promise);
    boot("/app");
    expect(screen.getByText("Preparando seu espaço…")).toBeInTheDocument();
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
    await act(async () =>
      pending.resolve({ data: { session: null }, error: null }),
    );
    expect(
      await screen.findByRole("button", { name: "Entrar com Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
  });
  it("restaura a sessão e redireciona o usuário já autenticado", async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    boot("/login");
    expect(
      await screen.findByText("CRUD protegido: aluno@example.com"),
    ).toBeInTheDocument();
  });
  it("ignora uma leitura inicial antiga depois de SIGNED_IN", async () => {
    const pending = deferred();
    mocks.auth.getSession.mockReturnValue(pending.promise);
    boot();
    act(() => mocks.listener("SIGNED_IN", session));
    expect(await screen.findByText(/CRUD protegido/)).toBeInTheDocument();
    await act(async () =>
      pending.resolve({ data: { session: null }, error: null }),
    );
    expect(screen.getByText(/CRUD protegido/)).toBeInTheDocument();
  });
  it("bloqueia o CRUD imediatamente ao receber SIGNED_OUT", async () => {
    mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    boot();
    await screen.findByText(/CRUD protegido/);
    act(() => mocks.listener("SIGNED_OUT", null));
    expect(
      await screen.findByRole("button", { name: "Entrar com Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
  });
  it("bloqueia o conteúdo quando a restauração de sessão falha", async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { code: "network_error", message: "fetch failed" },
    });
    boot();
    expect(
      await screen.findByRole("button", { name: "Recarregar" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
  });
  it("remove a assinatura ao desmontar o Provider", async () => {
    const view = boot();
    await screen.findByRole("button", { name: "Entrar com Google" });
    view.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("interfaces de autenticação", () => {
  it("envia Google com redirectTo autorizado e mostra erro sem perder o formulário", async () => {
    mocks.auth.signInWithOAuth.mockResolvedValue({
      error: { code: "provider_disabled" },
    });
    boot("/login");
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Entrar com Google" }),
    );
    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:5173/" },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Google ainda não está disponível",
    );
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });
  it("entra com e-mail/senha e abre a área protegida", async () => {
    boot("/login");
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("E-mail"),
      "aluno@example.com",
    );
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "senha12345",
    );
    await user.click(
      screen.getByRole("button", { name: "Entrar no meu espaço" }),
    );
    expect(await screen.findByText(/CRUD protegido/)).toBeInTheDocument();
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "aluno@example.com",
      password: "senha12345",
    });
  });
  it("mostra credenciais inválidas sem abrir a área interna", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { code: "invalid_credentials" },
    });
    boot("/login");
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("E-mail"),
      "aluno@example.com",
    );
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "errada123",
    );
    await user.click(
      screen.getByRole("button", { name: "Entrar no meu espaço" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha incorretos",
    );
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
  });
  it("não chama signUp quando a confirmação de senha é diferente", async () => {
    boot("/cadastro");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Seu nome"), "Aluno Teste");
    await user.type(screen.getByLabelText("E-mail"), "aluno@example.com");
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "senha12345",
    );
    await user.type(
      screen.getByLabelText("Confirmar senha", { exact: true }),
      "outrasenha",
    );
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "As senhas precisam ser iguais",
    );
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });
  it("explica a confirmação de e-mail sem tratar cadastro sem sessão como login", async () => {
    boot("/cadastro");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Seu nome"), "Aluno Teste");
    await user.type(screen.getByLabelText("E-mail"), "aluno@example.com");
    await user.type(
      screen.getByLabelText("Senha", { exact: true }),
      "senha12345",
    );
    await user.type(
      screen.getByLabelText("Confirmar senha", { exact: true }),
      "senha12345",
    );
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));
    expect(await screen.findByText("Confira seu e-mail.")).toBeInTheDocument();
    expect(mocks.auth.signUp).toHaveBeenCalledWith({
      email: "aluno@example.com",
      password: "senha12345",
      options: {
        data: { full_name: "Aluno Teste" },
        emailRedirectTo: "http://localhost:5173/",
      },
    });
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
  });
});

it("uma falha de logout mantém a sessão; o logout concluído limpa o usuário", async () => {
  mocks.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  function Harness() {
    const { user, signOut, loading } = useAuth();
    const [error, setError] = React.useState("");
    if (loading) return <p>Carregando</p>;
    return (
      <>
        <p>{user?.email || "Visitante"}</p>
        <p>{error}</p>
        <button onClick={() => signOut().catch(() => setError("Falhou"))}>
          Sair
        </button>
      </>
    );
  }
  const React = await import("react");
  mocks.auth.signOut
    .mockResolvedValueOnce({ error: { code: "network_error" } })
    .mockResolvedValueOnce({ error: null });
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
  const user = userEvent.setup();
  await screen.findByText("aluno@example.com");
  await user.click(screen.getByText("Sair"));
  await screen.findByText("Falhou");
  expect(screen.getByText("aluno@example.com")).toBeInTheDocument();
  await user.click(screen.getByText("Sair"));
  await waitFor(() =>
    expect(screen.getByText("Visitante")).toBeInTheDocument(),
  );
  expect(mocks.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
});

describe("recuperação de acesso", () => {
  it("solicita um link autorizado e usa resposta genérica", async () => {
    boot("/recuperar-senha");
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("E-mail"),
      "aluno@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );
    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "aluno@example.com",
      { redirectTo: "http://localhost:5173/redefinir-senha" },
    );
    expect(await screen.findByText(/Se houver uma conta/)).toBeInTheDocument();
  });
  it("PASSWORD_RECOVERY abre a troca de senha antes do CRUD", async () => {
    boot("/app");
    await screen.findByRole("button", { name: "Entrar com Google" });
    act(() => mocks.listener("PASSWORD_RECOVERY", session));
    expect(await screen.findByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Nova senha", { exact: true }),
      "nova-senha-123",
    );
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      "nova-senha-123",
    );
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({
      password: "nova-senha-123",
    });
    expect(await screen.findByText("Senha atualizada.")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Ir para meu espaço" }));
    expect(await screen.findByText(/CRUD protegido/)).toBeInTheDocument();
  });
  it("um visitante não consegue atualizar a senha sem uma sessão", async () => {
    boot("/redefinir-senha");
    expect(
      await screen.findByRole("link", { name: "Solicitar um novo link" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });
});

describe("retorno OAuth", () => {
  it("mantém o retorno inicial aguardando a troca da sessão", async () => {
    const pending = deferred();
    mocks.auth.getSession.mockReturnValue(pending.promise);
    boot("/?code=ficticio");
    expect(screen.getByText("Preparando seu espaço…")).toBeInTheDocument();
    expect(screen.queryByText(/CRUD protegido/)).not.toBeInTheDocument();
    await act(async () => pending.resolve({ data: { session }, error: null }));
    expect(await screen.findByText(/CRUD protegido/)).toBeInTheDocument();
  });
  it("preserva o erro de consentimento na chegada ao login", async () => {
    boot("/?error=access_denied");
    expect(
      await screen.findByRole("button", { name: "Entrar com Google" }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Você cancelou a entrada pelo Google",
    );
  });
});

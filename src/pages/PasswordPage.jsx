import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authErrorMessage } from "../lib/errors.js";
import Brand from "../components/Brand.jsx";
import Icon from "../components/Icon.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";

export default function PasswordPage({ reset = false }) {
  const {
    user,
    loading,
    configured,
    requestPasswordReset,
    updatePassword,
    sessionError,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  if (loading) return <LoadingScreen />;
  const needsLink = reset && !user;
  async function submit(e) {
    e.preventDefault();
    if (busy || !configured) return;
    setError("");
    if (reset && (password.length < 8 || password !== confirm)) {
      setError("Use pelo menos 8 caracteres e confirme a mesma senha.");
      return;
    }
    setBusy(true);
    try {
      if (reset) await updatePassword(password);
      else await requestPasswordReset(email);
      setSent(true);
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="recovery-layout">
      <Link to="/login" aria-label="Nexo, voltar ao login">
        <Brand />
      </Link>
      <section className="recovery-card">
        <span className="round-icon">
          <Icon name={reset ? "lock" : "mail"} size={25} />
        </span>
        <span className="eyebrow">SUA CONTA, SEU ESPAÇO</span>
        <h1>{reset ? "Uma nova senha." : "Vamos recuperar seu acesso."}</h1>
        <p>
          {needsLink
            ? "Abra o link de recuperação recebido por e-mail. Se expirou, solicite outro abaixo."
            : reset
              ? "Escolha uma senha nova para continuar."
              : "Enviaremos um link para você redefinir sua senha."}
        </p>
        {(error || sessionError) && (
          <div className="notice error-notice" role="alert">
            {error || sessionError}
          </div>
        )}
        {!configured && (
          <div className="notice config-notice" role="status">
            A conexão com o Supabase precisa ser configurada para recuperar a
            conta.
          </div>
        )}
        {sent ? (
          <div className="confirmation-panel" role="status">
            <h2>{reset ? "Senha atualizada." : "Confira seu e-mail."}</h2>
            <p>
              {reset
                ? "Sua nova senha está pronta para usar."
                : "Se houver uma conta para esse e-mail, você receberá as instruções. Confira também o spam e abra o link neste mesmo navegador."}
            </p>
            <Link className="button primary" to={reset ? "/app" : "/login"}>
              {reset ? "Ir para meu espaço" : "Voltar ao login"}
              <Icon name="arrow" />
            </Link>
          </div>
        ) : needsLink ? (
          <Link className="button primary" to="/recuperar-senha">
            Solicitar um novo link
          </Link>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {reset ? (
              <>
                <label className="field">
                  <span>Nova senha</span>
                  <input
                    type="password"
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Confirmar nova senha</span>
                  <input
                    type="password"
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                />
              </label>
            )}
            <button className="button primary" disabled={busy || !configured}>
              {busy
                ? "Aguarde…"
                : reset
                  ? "Salvar nova senha"
                  : "Enviar link de recuperação"}
            </button>
          </form>
        )}
        {!sent && (
          <Link className="text-link" to="/login">
            Voltar ao login
          </Link>
        )}
      </section>
      <span className="recovery-footer">
        Nexo · Um próximo passo mais tranquilo.
      </span>
    </main>
  );
}

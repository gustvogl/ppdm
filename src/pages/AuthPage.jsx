import { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { authErrorMessage } from "../lib/errors.js";
import Brand from "../components/Brand.jsx";
import Icon, { GoogleIcon } from "../components/Icon.jsx";

function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
  minLength,
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="password-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={128}
          placeholder="Sua senha"
        />
        <button
          className="icon-button"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          <Icon name="eye" size={19} />
        </button>
      </span>
    </label>
  );
}

function readOAuthError(search, hash) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const code = query.get("error") || fragment.get("error");
  if (!code) return "";
  return code === "access_denied"
    ? "Você cancelou a entrada pelo Google. Pode tentar de novo quando quiser."
    : "Não foi possível finalizar a entrada pelo Google. Confira os redirecionamentos e tente novamente.";
}

export default function AuthPage({ mode }) {
  const location = useLocation();
  const isSignup = mode === "signup";
  const {
    signIn,
    signUp,
    signInWithGoogle,
    configured,
    configurationError,
    sessionError,
  } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState(() =>
    readOAuthError(location.search, location.hash),
  );
  const [confirmation, setConfirmation] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending || !configured) return;
    setError("");
    if (isSignup && fullName.trim().length < 2) {
      setError("Escreva seu nome com pelo menos 2 caracteres.");
      return;
    }
    if (isSignup && password.length < 8) {
      setError("Sua senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setPending("email");
    try {
      if (isSignup) {
        const data = await signUp(fullName, email, password);
        if (!data.session) {
          setConfirmation(true);
          setPassword("");
          setConfirmPassword("");
        }
      } else await signIn(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending("");
    }
  }

  async function googleLogin() {
    if (pending || !configured) return;
    setError("");
    setPending("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
      setPending("");
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="Bem-vindo ao Nexo">
        <Brand light />
        <div className="story-content">
          <span className="eyebrow story-eyebrow">
            <span />
            SEU PRÓXIMO PASSO
          </span>
          <h1>
            Menos ruído.
            <br />
            <em>Mais direção.</em>
          </h1>
          <p>
            Um lugar para suas ideias virarem planos.
            <br />E seus planos, pequenas conquistas.
          </p>
          <div className="story-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-orbit orbit-three" />
            <div className="art-leaf leaf-one" />
            <div className="art-leaf leaf-two" />
            <div className="art-leaf leaf-three" />
            <div className="art-caption">
              <span className="art-check">
                <Icon name="check" size={20} />
              </span>
              <div>
                <strong>Uma coisa de cada vez.</strong>
                <span>Seu ritmo. Seu espaço.</span>
              </div>
            </div>
            <span className="art-star">✳</span>
          </div>
        </div>
        <div className="story-footer">
          <span>
            <Icon name="lock" size={15} />
            Uma conta só sua.
          </span>
          <span>Feito para simplificar.</span>
        </div>
      </section>

      <section className="auth-main">
        <header className="auth-top">
          <span className="auth-mobile-brand">
            <Brand />
          </span>
          <span>
            {isSignup ? "Já faz parte?" : "Primeira vez por aqui?"}{" "}
            <Link to={isSignup ? "/login" : "/cadastro"}>
              {isSignup ? "Entrar" : "Criar conta"}{" "}
              <Icon name="arrow" size={15} />
            </Link>
          </span>
        </header>
        <div className="auth-form-area">
          <span className="eyebrow">
            {isSignup ? "COMECE DO SEU JEITO" : "BOM TER VOCÊ AQUI"}
          </span>
          <h2>
            {isSignup ? "Seu espaço começa aqui." : "Vamos ao próximo passo?"}
          </h2>
          <p className="auth-subtitle">
            {isSignup
              ? "Crie sua conta e organize o que importa."
              : "Entre para continuar de onde parou."}
          </p>
          {!configured && (
            <aside className="notice config-notice" role="status">
              <strong>Conexão ainda não configurada.</strong>
              <p>
                {configurationError} Copie .env.example para .env e siga o
                README do projeto para ativar a autenticação.
              </p>
            </aside>
          )}
          {(error || sessionError) && (
            <div className="notice error-notice" role="alert">
              {error || sessionError}
            </div>
          )}
          {confirmation ? (
            <div className="confirmation-panel" role="status">
              <span className="confirmation-icon">
                <Icon name="mail" size={28} />
              </span>
              <h3>Confira seu e-mail.</h3>
              <p>
                Se houver uma confirmação pendente para{" "}
                <strong>{email.trim()}</strong>, abra o link recebido para
                ativar o acesso. Confira também a pasta de spam.
              </p>
              <Link className="button primary" to="/login">
                Ir para o login
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="button google-button"
                onClick={googleLogin}
                disabled={!configured || Boolean(pending)}
              >
                {pending === "google" ? (
                  <span className="spinner small" aria-hidden="true" />
                ) : (
                  <GoogleIcon />
                )}
                {pending === "google"
                  ? "Abrindo o Google…"
                  : "Entrar com Google"}
              </button>
              <div className="divider">
                <span>ou use seu e-mail</span>
              </div>
              <form
                onSubmit={handleSubmit}
                className="auth-form"
                aria-label={
                  isSignup ? "Cadastro por e-mail" : "Login por e-mail"
                }
              >
                {isSignup && (
                  <label className="field">
                    <span>Seu nome</span>
                    <input
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={80}
                      placeholder="Como podemos chamar você?"
                    />
                  </label>
                )}
                <label className="field">
                  <span>E-mail</span>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength={254}
                    placeholder="voce@exemplo.com"
                  />
                </label>
                <PasswordField
                  label="Senha"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? 8 : undefined}
                />
                {!isSignup && (
                  <Link className="forgot-link" to="/recuperar-senha">
                    Esqueci minha senha
                  </Link>
                )}
                {isSignup && (
                  <>
                    <small className="field-hint">
                      Use pelo menos 8 caracteres.
                    </small>
                    <PasswordField
                      label="Confirmar senha"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </>
                )}
                <button
                  className="button primary"
                  type="submit"
                  disabled={!configured || Boolean(pending)}
                >
                  {pending === "email" ? (
                    <>
                      <span className="spinner small" aria-hidden="true" />
                      Aguarde…
                    </>
                  ) : (
                    <>
                      {isSignup ? "Criar minha conta" : "Entrar no meu espaço"}
                      <Icon name="arrow" size={18} />
                    </>
                  )}
                </button>
              </form>
              <p className="auth-bottom-text">
                {isSignup
                  ? "Sua conta acompanha você, no computador ou no celular."
                  : "Seu espaço, suas tarefas, seu ritmo."}
              </p>
            </>
          )}
        </div>
        <footer className="auth-footer">
          <span>© {new Date().getFullYear()} Nexo</span>
          <span>
            <Icon name="lock" size={13} />
            Acesso com Supabase Auth
          </span>
        </footer>
      </section>
    </main>
  );
}

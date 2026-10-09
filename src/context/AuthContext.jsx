import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  supabase,
  authReturnUrl,
  configurationError,
} from "../lib/supabaseClient.js";
import { authErrorMessage } from "../lib/errors.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    let revision = 0;
    // O callback é síncrono: não executar consultas/await aqui para evitar deadlocks.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      revision += 1;
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
      setSessionError("");
      setLoading(false);
    });
    const initialRevision = revision;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        // Uma resposta inicial antiga não pode sobrescrever um login/logout recente.
        if (!active || revision !== initialRevision) return;
        if (error) {
          setSession(null);
          setSessionError(authErrorMessage(error));
        } else setSession(data.session);
        setLoading(false);
      })
      .catch((error) => {
        if (!active || revision !== initialRevision) return;
        setSession(null);
        setSessionError(authErrorMessage(error));
        setLoading(false);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const requireClient = useCallback(() => {
    if (!supabase) throw new Error(configurationError);
    return supabase;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await requireClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authReturnUrl() },
    });
    if (error) throw error;
  }, [requireClient]);

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await requireClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setSession(data.session);
      setSessionError("");
    },
    [requireClient],
  );

  const signUp = useCallback(
    async (fullName, email, password) => {
      const { data, error } = await requireClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: authReturnUrl(),
        },
      });
      if (error) throw error;
      if (data.session) setSession(data.session);
      return data;
    },
    [requireClient],
  );

  const signOut = useCallback(async () => {
    // Sair desta sessão/dispositivo; não desconectar outros dispositivos.
    const { error } = await requireClient().auth.signOut({ scope: "local" });
    if (error) throw error;
    setSession(null);
    setRecovering(false);
    setSessionError("");
  }, [requireClient]);

  const requestPasswordReset = useCallback(
    async (email) => {
      const { error } = await requireClient().auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: authReturnUrl("/redefinir-senha") },
      );
      if (error) throw error;
    },
    [requireClient],
  );
  const updatePassword = useCallback(
    async (password) => {
      const { error } = await requireClient().auth.updateUser({ password });
      if (error) throw error;
      setRecovering(false);
    },
    [requireClient],
  );
  const updateProfile = useCallback(
    async (fullName) => {
      const name = fullName.trim();
      if (name.length < 2 || name.length > 80)
        throw new Error("Use um nome de 2 a 80 caracteres.");
      const { data, error } = await requireClient().auth.updateUser({
        data: { full_name: name },
      });
      if (error) throw error;
      setSession((current) =>
        current ? { ...current, user: data.user } : current,
      );
    },
    [requireClient],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      sessionError,
      configured: Boolean(supabase),
      configurationError,
      signInWithGoogle,
      signIn,
      signUp,
      signOut,
      recovering,
      requestPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [
      session,
      loading,
      sessionError,
      signInWithGoogle,
      signIn,
      signUp,
      signOut,
      recovering,
      requestPasswordReset,
      updatePassword,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve estar dentro de AuthProvider.");
  return context;
}

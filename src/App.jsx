import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import PasswordPage from "./pages/PasswordPage.jsx";
const Workspace = lazy(() => import("./pages/Workspace.jsx"));

function AuthReturn() {
  const { loading, recovering } = useAuth();
  const location = useLocation();
  // O SDK precisa terminar a troca PKCE antes de remover o código da URL.
  if (loading) return <LoadingScreen />;
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (query.has("error") || hash.has("error"))
    return <Navigate to={`/login${location.search}${location.hash}`} replace />;
  return <Navigate to={recovering ? "/redefinir-senha" : "/app"} replace />;
}

function PublicOnly({ mode }) {
  const { user, loading, recovering } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user)
    return <Navigate to={recovering ? "/redefinir-senha" : "/app"} replace />;
  return <AuthPage key={mode} mode={mode} />;
}
function UserWorkspace() {
  const { user } = useAuth();
  // Outra conta sempre recebe uma instância nova, sem estado da conta anterior.
  return <Workspace key={user.id} />;
}
export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<AuthReturn />} />
        <Route path="/login" element={<PublicOnly mode="login" />} />
        <Route path="/cadastro" element={<PublicOnly mode="signup" />} />
        <Route path="/recuperar-senha" element={<PasswordPage />} />
        <Route path="/redefinir-senha" element={<PasswordPage reset />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app/*" element={<UserWorkspace />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}

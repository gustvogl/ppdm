import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import AuthPage from "./pages/AuthPage.jsx";
const Workspace = lazy(() => import("./pages/Workspace.jsx"));

function PublicOnly({ mode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
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
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/login" element={<PublicOnly mode="login" />} />
        <Route path="/cadastro" element={<PublicOnly mode="signup" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<UserWorkspace />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

export default function ProtectedRoute() {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (sessionError)
    return (
      <main className="session-error">
        <h1>Vamos tentar de novo?</h1>
        <p role="alert">{sessionError}</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Recarregar
        </button>
      </main>
    );
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

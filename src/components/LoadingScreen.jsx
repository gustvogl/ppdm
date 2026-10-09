import Brand from "./Brand.jsx";
export default function LoadingScreen() {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <Brand />
      <span className="spinner" aria-hidden="true" />
      <p>Preparando seu espaço…</p>
    </main>
  );
}

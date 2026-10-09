import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="session-error">
          <h1>Vamos tentar de novo?</h1>
          <p>Não foi possível abrir esta tela. Recarregue para continuar.</p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Recarregar aplicativo
          </button>
        </main>
      );
    return this.props.children;
  }
}

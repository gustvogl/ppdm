import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";

export default function Modal({
  title,
  subtitle,
  onClose,
  busy = false,
  children,
}) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return createPortal(
    <dialog
      className="modal"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="modal-header">
        <div>
          <span className="eyebrow">SEU PRÓXIMO PASSO</span>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar"
          onClick={onClose}
          disabled={busy}
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>,
    document.body,
  );
}

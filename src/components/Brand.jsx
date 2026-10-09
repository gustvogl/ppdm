export default function Brand({ light = false }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        n
      </span>
      nexo<span className="brand-dot">.</span>
    </span>
  );
}

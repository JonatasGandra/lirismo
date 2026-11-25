/** Divisor de catálogo: filete — losango — filete. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={["ornament", className].filter(Boolean).join(" ")} aria-hidden="true">
      <span className="ornament-line" />
      <span className="ornament-gem" />
      <span className="ornament-line ornament-line--end" />
    </div>
  );
}

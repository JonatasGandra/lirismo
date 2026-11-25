import { PETAL_SHAPE, PETAL_VEIN, PETAL_VIEWBOX } from "@/lib/lily";

/** Uma pétala solta de lírio. */
export function PetalSvg({ className }: { className?: string }) {
  return (
    <svg viewBox={PETAL_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <path d={PETAL_SHAPE} className="petal-shape" />
      <path d={PETAL_VEIN} className="petal-vein" />
    </svg>
  );
}

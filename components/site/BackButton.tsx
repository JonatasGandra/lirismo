import Link from "next/link";
import { Chevron } from "@/components/site/Chevron";

/**
 * Voltar, sem seta escrita: um botão redondo e fino com um chevron delicado,
 * no canto superior esquerdo (mesmo estilo do botão redondo da capa).
 * O pai precisa ter `position: relative`.
 */
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back-button" aria-label={label} title={label}>
      <Chevron direction="left" />
    </Link>
  );
}

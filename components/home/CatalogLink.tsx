import Link from "next/link";
import { Chevron } from "@/components/site/Chevron";

/**
 * "Abrir catálogo": botão minimalista, fora da seção do destaque, que leva à
 * página com a lista de todos os poemas (só os títulos).
 */
export function CatalogLink() {
  return (
    <div className="catalog-cta">
      <Link href="/poemas" className="catalog-button">
        <span>Abrir catálogo</span>
        <span className="go-circle" aria-hidden="true">
          <Chevron />
        </span>
      </Link>
    </div>
  );
}

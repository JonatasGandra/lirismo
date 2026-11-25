import type Lenis from "lenis";

// Guarda a instância ativa da rolagem suave (criada em SmoothScroll), para
// que outras peças — como a barra de rolagem discreta — rolem por ela.
let active: Lenis | null = null;

export function setActiveLenis(lenis: Lenis | null): void {
  active = lenis;
}

export function getActiveLenis(): Lenis | null {
  return active;
}

/** Rola até `top`: pela rolagem suave quando ela existe, senão pela janela. */
export function scrollToY(top: number, immediate: boolean): void {
  const lenis = active;
  if (lenis) lenis.scrollTo(top, { immediate, force: true });
  else window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
}

"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { setActiveLenis } from "@/lib/lenis-store";

/** Fora da capa, cada giro da roda anda 65% do normal (35% mais devagar). */
const CALM_WHEEL = 0.65;

/** A capa está presa na tela (lírio abrindo, amanhecer ou frase sendo escrita)? */
function isBloomPinned(): boolean {
  const bloom = document.querySelector(".bloom");
  if (!bloom) return false;
  const { top, bottom } = bloom.getBoundingClientRect();
  return top <= 1 && bottom >= window.innerHeight - 1;
}

/**
 * Rolagem com inércia suave (Lenis): a página desliza em vez de pular.
 * No celular o toque continua nativo. Desligada para quem pede menos movimento.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: { offset: -88 },
      // Fora da capa, a roda do mouse anda mais devagar (dentro dela cada
      // movimento já vira animação: o lírio abrindo e a frase sendo escrita).
      virtualScroll: (data) => {
        if (data.event.type.includes("wheel") && !isBloomPinned()) {
          data.deltaX *= CALM_WHEEL;
          data.deltaY *= CALM_WHEEL;
        }
        return true;
      },
    });
    setActiveLenis(lenis);

    return () => {
      setActiveLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}

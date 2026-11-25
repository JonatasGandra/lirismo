import type { ReactNode } from "react";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { Footer } from "@/components/site/Footer";
import { RouteTransition } from "@/components/site/RouteTransition";
import { SmoothScroll } from "@/components/site/SmoothScroll";

// Layout das páginas públicas, sem barra de navegação: a navegação fica nos
// links da própria página e no rodapé. O player vive aqui, então a música
// continua tocando enquanto se navega entre poemas e músicas.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <SmoothScroll />
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <main id="conteudo">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <Footer />
      <MiniPlayer />
    </PlayerProvider>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { PetalGust } from "@/components/lily/PetalGust";

/**
 * A cada troca de página o conteúdo entra suave e algumas pétalas passam com
 * o vento. Na primeira carga não anima: a capa já tem a própria entrada e o
 * texto precisa aparecer rápido.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const firstPath = useRef(pathname);
  const navigated = useRef(false);
  if (pathname !== firstPath.current) navigated.current = true;

  return (
    <>
      {navigated.current ? <PetalGust key={`gust:${pathname}`} /> : null}
      <div key={pathname} className={navigated.current ? "page-enter" : undefined}>
        {children}
      </div>
    </>
  );
}

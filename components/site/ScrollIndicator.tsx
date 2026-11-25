"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { scrollToY } from "@/lib/lenis-store";

const MIN_THUMB = 36;
const HIDE_AFTER_MS = 1100;

/**
 * Barra de rolagem discreta e translúcida (só no computador): uma linha fina
 * que aparece enquanto a página rola ou o mouse chega na borda direita, e
 * some sozinha. Dá para arrastar e clicar para pular, como a barra comum.
 * No celular fica a barra nativa, que já é fina e some sozinha.
 */
export function ScrollIndicator() {
  const [enabled, setEnabled] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, startScroll: 0 });
  const sizes = useRef({ viewport: 0, total: 0, thumb: 0 });

  // Só em telas com mouse (no toque, a barra nativa já é discreta).
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;

    let raf = 0;
    let hideTimer = 0;

    const render = () => {
      raf = 0;
      const viewport = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const max = total - viewport;
      if (max <= 1) {
        rail.dataset.hidden = "true";
        return;
      }
      delete rail.dataset.hidden;

      const thumbSize = Math.max(MIN_THUMB, Math.round((viewport * viewport) / total));
      if (thumbSize !== sizes.current.thumb) thumb.style.height = `${thumbSize}px`;
      sizes.current = { viewport, total, thumb: thumbSize };

      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      thumb.style.transform = `translate3d(0, ${(progress * (viewport - thumbSize)).toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const reveal = () => {
      rail.classList.add("is-active");
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!drag.current.active) rail.classList.remove("is-active");
      }, HIDE_AFTER_MS);
    };

    const onScroll = () => {
      reveal();
      schedule();
    };

    render();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  if (!enabled) return null;

  const maxScroll = () => sizes.current.total - sizes.current.viewport;
  const maxThumb = () => sizes.current.viewport - sizes.current.thumb;

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { active: true, startY: event.clientY, startScroll: window.scrollY };
    railRef.current?.classList.add("is-dragging", "is-active");
    document.documentElement.classList.add("is-scroll-dragging");
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active || maxThumb() <= 0) return;
    const delta = event.clientY - drag.current.startY;
    scrollToY(drag.current.startScroll + delta * (maxScroll() / maxThumb()), true);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    railRef.current?.classList.remove("is-dragging");
    document.documentElement.classList.remove("is-scroll-dragging");
  }

  // Clique na trilha: leva o polegar até ali, com a rolagem suave.
  function jump(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || maxThumb() <= 0) return;
    const position = (event.clientY - sizes.current.thumb / 2) / maxThumb();
    scrollToY(Math.min(1, Math.max(0, position)) * maxScroll(), false);
  }

  return (
    <div ref={railRef} className="scroll-rail" aria-hidden="true" onPointerDown={jump}>
      <div
        ref={thumbRef}
        className="scroll-thumb"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
}

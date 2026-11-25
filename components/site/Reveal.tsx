"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

type Props = {
  as?: "div" | "li" | "section";
  className?: string;
  /** Atraso em ms, para as entradas chegarem uma depois da outra. */
  delay?: number;
  children: ReactNode;
};

// Um único observador para a página toda.
let observer: IntersectionObserver | null = null;

function observe(element: Element): () => void {
  if (typeof IntersectionObserver === "undefined") {
    element.classList.add("is-visible");
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries, current) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        current.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
  );
  observer.observe(element);
  return () => observer?.unobserve(element);
}

/** Faz o conteúdo chegar ao rolar a página, como uma pétala trazida pelo vento. */
export function Reveal({ as = "div", className, delay = 0, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return observe(element);
  }, []);

  return createElement(
    as as "div",
    {
      ref: ref as RefObject<HTMLDivElement>,
      className: ["reveal", className].filter(Boolean).join(" "),
      style: delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined,
    },
    children,
  );
}

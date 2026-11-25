"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Chevron } from "@/components/site/Chevron";

export type CoverflowItem = { key: string; label: string; content: ReactNode };

type Props = {
  items: CoverflowItem[];
  /** Nome do carrossel para leitores de tela, ex.: "Poemas recentes". */
  label: string;
  variant: "poem" | "song";
};

// Como cada cartão aparece conforme a distância `d` até o centro (em cartões):
const SPREAD = 0.6; // o vizinho fica a 60% de uma largura do centro (meio escondido atrás)
const SPREAD_OUT = 0.26; // depois disso ainda anda um pouco enquanto some
const SHRINK = 0.18; // vizinho 18% menor
const FADE = 0.45; // e 45% mais apagado
const BLUR_PX = 4; // e desfocado
const TILT_DEG = 10; // girado de leve, a borda de fora indo para o fundo
const EDGE = 1.5; // daqui em diante o cartão está invisível (é onde a lista "dá a volta")

const mod = (value: number, n: number) => ((value % n) + n) % n;
/** Leva para o intervalo [-n/2, n/2): a lista é circular. */
const wrap = (value: number, n: number) => mod(value + n / 2, n) - n / 2;

function look(d: number) {
  const a = Math.min(Math.abs(d), EDGE);
  const side = Math.sign(d);
  const shift = a <= 1 ? SPREAD * a : SPREAD + SPREAD_OUT * (a - 1);
  const opacity = a <= 1 ? 1 - FADE * a : Math.max(0, ((1 - FADE) * (EDGE - a)) / (EDGE - 1));
  return {
    x: `${(side * shift * 100).toFixed(3)}%`,
    s: (1 - SHRINK * a).toFixed(4),
    r: `${(side * Math.min(a, 1) * TILT_DEG).toFixed(3)}deg`,
    f: a > 0.01 ? `blur(${(a * BLUR_PX).toFixed(2)}px)` : "none",
    opacity: opacity.toFixed(3),
    z: String(10 - Math.round(a * 4)),
    visibility: opacity < 0.01 ? "hidden" : "visible",
  };
}

/**
 * Carrossel em perspectiva: o item atual no centro, nítido; os vizinhos menores,
 * desfocados e "atrás", um de cada lado. A lista dá a volta (com 3 itens ou mais),
 * então o mais recente começa no centro com um vizinho de cada lado.
 *
 * Anda com o dedo ou o trackpad para os lados (a rolagem vertical continua sendo da
 * página), arrastando com o mouse, clicando num cartão do lado, pelas setas do
 * teclado ou pelos botões e pontinhos embaixo. O movimento segue o gesto e assenta
 * suavemente no cartão mais próximo.
 */
export function Coverflow({ items, label, variant }: Props) {
  const n = items.length;
  const loop = n >= 3;
  const stageRef = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef(0); // posição desenhada (fracionária)
  const target = useRef(0); // para onde ela está indo
  const frame = useRef(0);
  const dragging = useRef(false);
  const swallowClick = useRef(false);
  const shown = useRef(0);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    from: number;
    moved: boolean;
    lastX: number;
    lastT: number;
    velocity: number;
  } | null>(null);
  const [active, setActive] = useState(0);

  const offsetOf = useCallback((i: number, at: number) => (loop ? wrap(i - at, n) : i - at), [loop, n]);
  const limit = useCallback((value: number) => (loop ? value : Math.max(0, Math.min(n - 1, value))), [loop, n]);
  const slideWidth = useCallback(
    () => slides.current[0]?.offsetWidth || (stageRef.current?.clientWidth ?? 800) * 0.6,
    [],
  );

  const paint = useCallback(() => {
    slides.current.forEach((slide, i) => {
      if (!slide) return;
      const v = look(offsetOf(i, pos.current));
      slide.style.setProperty("--x", v.x);
      slide.style.setProperty("--s", v.s);
      slide.style.setProperty("--r", v.r);
      slide.style.setProperty("--f", v.f);
      slide.style.opacity = v.opacity;
      slide.style.zIndex = v.z;
      slide.style.visibility = v.visibility;
    });
    const current = mod(Math.round(pos.current), n);
    if (current !== shown.current) {
      shown.current = current;
      setActive(current);
    }
  }, [n, offsetOf]);

  const animate = useCallback(() => {
    if (frame.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!dragging.current) {
        const diff = target.current - pos.current;
        if (reduce || Math.abs(diff) < 0.0008) pos.current = target.current;
        else pos.current += diff * (1 - Math.exp(-dt / 130));
      }
      paint();
      frame.current =
        dragging.current || pos.current !== target.current ? requestAnimationFrame(step) : 0;
    };
    frame.current = requestAnimationFrame(step);
  }, [paint]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const goBy = useCallback(
    (delta: number) => {
      target.current = limit(Math.round(target.current) + delta);
      animate();
    },
    [animate, limit],
  );

  const goTo = useCallback(
    (index: number) => {
      const base = Math.round(target.current);
      const delta = loop ? wrap(index - mod(base, n), n) : index - base;
      target.current = limit(base + delta);
      animate();
    },
    [animate, limit, loop, n],
  );

  // Trackpad / shift+roda para os lados. Gesto mais vertical que horizontal é da página.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || n < 2) return;
    let settle = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault(); // sem "voltar página" do navegador
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientWidth : 1;
      target.current = limit(target.current + (event.deltaX * unit) / (slideWidth() * 1.1));
      animate();
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        target.current = limit(Math.round(target.current));
        animate();
      }, 160);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [animate, limit, n, slideWidth]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (n < 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    const control = (event.target as Element).closest(
      "input, select, textarea, audio, [role='slider'], button:not(.coverflow-peek)",
    );
    if (control) return; // o player (play, barra de tempo) continua funcionando
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: pos.current,
      moved: false,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const dx = event.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(event.clientY - d.y) > Math.abs(dx)) {
        drag.current = null; // gesto vertical: é rolagem da página
        return;
      }
      d.moved = true;
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-dragging");
      animate();
    }
    const elapsed = event.timeStamp - d.lastT;
    if (elapsed > 0) {
      d.velocity = (event.clientX - d.lastX) / elapsed;
      d.lastX = event.clientX;
      d.lastT = event.timeStamp;
    }
    let next = d.from - dx / slideWidth();
    if (!loop) {
      // nas pontas (só com 2 itens), resiste em vez de passar direto
      if (next < 0) next /= 3;
      else if (next > n - 1) next = n - 1 + (next - (n - 1)) / 3;
    }
    pos.current = next;
    target.current = next;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moved) return;
    dragging.current = false;
    event.currentTarget.classList.remove("is-dragging");
    // Quem arrastou não quis abrir o cartão: engole o clique que vem logo depois.
    swallowClick.current = true;
    window.setTimeout(() => {
      swallowClick.current = false;
    }, 0);
    const fling = Math.max(-1, Math.min(1, (-d.velocity * 220) / slideWidth()));
    target.current = limit(Math.round(pos.current + fling));
    animate();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("input, select, textarea, [role='slider']")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goBy(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goBy(1);
    }
  }

  if (n === 0) return null;

  return (
    <div
      className={`coverflow coverflow--${variant}`}
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div
        ref={stageRef}
        className={`coverflow-stage${n > 1 ? " is-interactive" : ""}`}
        data-lenis-prevent-horizontal
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (!swallowClick.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {items.map((item, i) => {
          const isActive = i === active;
          // Primeiro desenho (também sem JavaScript): o mesmo cálculo da animação.
          const v = look(offsetOf(i, 0));
          const style = {
            "--x": v.x,
            "--s": v.s,
            "--r": v.r,
            "--f": v.f,
            opacity: v.opacity,
            zIndex: v.z,
            visibility: v.visibility,
          } as CSSProperties;
          return (
            <div
              key={item.key}
              ref={(element) => {
                slides.current[i] = element;
              }}
              className="coverflow-slide"
              data-active={isActive}
              role="group"
              aria-roledescription="item"
              aria-label={`${i + 1} de ${n}: ${item.label}`}
              aria-hidden={!isActive}
              style={style}
            >
              <div className="coverflow-content" inert={!isActive}>
                {item.content}
              </div>
              {!isActive ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="coverflow-peek"
                  aria-label={`Ver “${item.label}”`}
                  onClick={() => goTo(i)}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {n > 1 ? (
        <div className="coverflow-nav">
          <button
            type="button"
            className="go-circle coverflow-arrow"
            aria-label="Anterior"
            onClick={() => goBy(-1)}
            disabled={!loop && active === 0}
          >
            <Chevron direction="left" />
          </button>
          <div className="coverflow-dots">
            {items.map((item, i) => (
              <button
                key={item.key}
                type="button"
                className="coverflow-dot"
                aria-label={`Ir para “${item.label}”`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="go-circle coverflow-arrow"
            aria-label="Próximo"
            onClick={() => goBy(1)}
            disabled={!loop && active === n - 1}
          >
            <Chevron />
          </button>
        </div>
      ) : null}
    </div>
  );
}

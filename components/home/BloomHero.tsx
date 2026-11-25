"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PetalSvg } from "@/components/lily/PetalSvg";
import { Handwriting } from "./Handwriting";
import { site } from "@/lib/site";

// Time-lapse do lírio em 72 quadros (public/lirio). "l" para telas largas,
// "s" (mais leve) para o celular. Como foram gerados: ver o README.
const FRAME_COUNT = 72;
const LAST = FRAME_COUNT - 1;
// A linha do tempo da capa, em fração da rolagem dela (0 → 1). A capa tem
// 537svh de altura (globals.css), isto é, 437svh de rolagem; entre parênteses,
// quanto de rolagem cada etapa ocupa.
/** 1. a flor desabrocha (~160svh)… */
const BLOOM_END = 0.365;
/** 2. …a noite clareia até o branco lilás (~61svh)… */
const DAWN_START = 0.383;
const DAWN_END = 0.522;
/** 3. …a frase é escrita à mão, com a pena movida pela rolagem (~171svh, devagar)… */
const WRITE_START = 0.548;
const WRITE_END = 0.939;
/** 4. …e fica um instante completa, sozinha na tela, antes de seguir. */
/** Quanto do tempo de cada letra a tinta leva para preencher (em segundos do traçado). */
const INK_FILL = 0.75;

/** Ao sair da frase rumo ao catálogo, uma rajada de pétalas atravessa a tela. */
const GUST_AT = 0.975;
const GUST_RESET = 0.9; // subiu de volta para a capa: a próxima saída sopra de novo
const GUST_MS = 1900;

// 16 pétalas com posição, tamanho e trajeto variados. A "aleatoriedade" é
// determinística (seno), para o servidor e o navegador desenharem igual.
const LEAF_GUST = Array.from({ length: 16 }, (_, i) => {
  const pick = (seed: number) => (Math.sin((i + 1) * seed) + 1) / 2;
  return {
    y: `${Math.round(4 + pick(12.9898) * 88)}%`,
    size: Math.round(14 + pick(78.233) * 16),
    delay: Math.round(pick(37.719) * 35) / 100,
    duration: Math.round(95 + pick(4.581) * 45) / 100,
    rise: `${Math.round(-18 + pick(9.137) * 26)}vh`,
    spin: `${Math.round(200 + pick(3.71) * 260)}deg`,
  };
});

type FrameSize = "l" | "s";

const frameSrc = (size: FrameSize, index: number) => `/lirio/${size}/${String(index).padStart(2, "0")}.webp`;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Começa e termina devagar, como uma flor de verdade. */
const ease = (t: number) => t * t * (3 - 2 * t);

/** Primeiro quadros espaçados (a rolagem nunca fica sem imagem), depois os do meio. */
function loadingOrder(): number[] {
  const order = [0, LAST];
  const seen = new Set(order);
  for (const step of [12, 6, 3, 1]) {
    for (let index = 0; index < FRAME_COUNT; index += step) {
      if (!seen.has(index)) {
        seen.add(index);
        order.push(index);
      }
    }
  }
  return order;
}

/**
 * Capa: o lírio desabrocha conforme ela rola a página e, no fim, a noite
 * vira dia (branco lilás) e aparece a dedicatória.
 */
export function BloomHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gustRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!section || !stage || !canvas || !context) return;

    // Com "reduzir movimento", o lírio já aparece aberto (sem a animação).
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size: FrameSize = window.innerWidth < 768 ? "s" : "l";
    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    let target = reduceMotion ? LAST : 0;
    let shown: HTMLImageElement | null = null;
    let raf = 0;
    let idle = 0;
    let loadingStarted = false;
    let cancelled = false;

    const nearestLoaded = (index: number) => {
      for (let distance = 0; distance < FRAME_COUNT; distance++) {
        const image = frames[index - distance] ?? frames[index + distance];
        if (image) return image;
      }
      return null;
    };

    const draw = (force = false) => {
      const image = nearestLoaded(target);
      if (!image || (image === shown && !force)) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      shown = image;
      stage.dataset.ready = "true";
    };

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      draw(true);
    };

    const load = (index: number) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.src = frameSrc(size, index);
        image
          .decode()
          .then(() => {
            if (cancelled) return;
            frames[index] = image;
            draw(); // troca se este quadro estiver mais perto do ponto da rolagem
          })
          .catch(() => {})
          .finally(resolve);
      });

    const startLoading = () => {
      if (loadingStarted || reduceMotion) return;
      loadingStarted = true;
      const queue = loadingOrder().filter((index) => !frames[index]);
      let cursor = 0;
      const worker = async () => {
        while (!cancelled && cursor < queue.length) await load(queue[cursor++]);
      };
      for (let lane = 0; lane < 4; lane++) void worker();
    };

    // Cada letra da frase manuscrita, com o seu trecho no tempo do traçado.
    const letters = [...stage.querySelectorAll<SVGPathElement>(".ink path")].map((path) => ({
      path,
      delay: Number(path.dataset.delay),
      duration: Number(path.dataset.duration),
      total: Number(path.ownerSVGElement?.dataset.total) || 1,
    }));
    let written = -1;

    /** Posiciona a pena: 0 = nada escrito, 1 = frase completa. */
    const writeTo = (amount: number) => {
      if (Math.abs(amount - written) < 0.0005) return;
      written = amount;
      for (const letter of letters) {
        const time = amount * letter.total;
        const stroke = clamp((time - letter.delay) / letter.duration);
        const ink = clamp((time - letter.delay - letter.duration * 0.5) / INK_FILL);
        letter.path.style.strokeDashoffset = (1 - stroke).toFixed(4);
        letter.path.style.fillOpacity = ink.toFixed(3);
      }
    };

    // A rajada de pétalas da saída. Na primeira leitura só registra onde a
    // página está (voltar para a página já rolada não deve soprar à toa).
    const gust = gustRef.current;
    let gustBlown: boolean | null = null;
    let gustTimer = 0;
    const blowGust = () => {
      if (!gust || reduceMotion) return;
      gust.classList.remove("is-blowing");
      void gust.offsetWidth; // reinicia a animação
      gust.classList.add("is-blowing");
      window.clearTimeout(gustTimer);
      gustTimer = window.setTimeout(() => gust.classList.remove("is-blowing"), GUST_MS);
    };

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance > 0 ? clamp(-rect.top / distance) : 0;
      const bloom = reduceMotion ? 1 : clamp(progress / BLOOM_END);
      const dawn = clamp((progress - DAWN_START) / (DAWN_END - DAWN_START));

      stage.style.setProperty("--bloom", bloom.toFixed(4));
      stage.style.setProperty("--dawn", dawn.toFixed(4));
      // "day" quando a luz do amanhecer já chegou lá em cima (muda a cor da barra de rolagem).
      const phase = dawn >= 0.8 ? "day" : "night";
      if (section.dataset.phase !== phase) section.dataset.phase = phase;

      // A pena segue a rolagem: só se passa pela frase vendo-a escrita.
      writeTo(reduceMotion ? 1 : clamp((progress - WRITE_START) / (WRITE_END - WRITE_START)));

      if (gustBlown === null) {
        gustBlown = progress >= GUST_AT;
      } else if (!gustBlown && progress >= GUST_AT) {
        gustBlown = true;
        blowGust();
      } else if (gustBlown && progress < GUST_RESET) {
        gustBlown = false;
      }

      const index = Math.round(ease(bloom) * LAST);
      if (index !== target) {
        target = index;
        draw();
      }
      // Se ela começar a rolar antes de a página terminar de carregar, carrega já.
      if (progress > 0) startLoading();
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Os demais quadros só depois que a página terminou de carregar.
    const whenIdle = () => {
      // (o Safari não tem requestIdleCallback: usa um pequeno atraso)
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(startLoading, { timeout: 2000 });
      } else {
        idle = window.setTimeout(startLoading, 800);
      }
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    resize();
    update();
    void load(target).then(() => draw(true));

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(gustTimer);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      observer.disconnect();
      window.removeEventListener("load", whenIdle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const [leftLine, leftWord] = site.hero.left;
  const [rightLine, rightWord] = site.hero.right;

  return (
    <section ref={sectionRef} className="bloom" data-phase="night" aria-labelledby="bloom-title">
      <div ref={stageRef} className="bloom-stage">
        <div className="bloom-sky" aria-hidden="true" />

        <div className="bloom-lily" role="img" aria-label="Um lírio desabrochando">
          {/* eslint-disable-next-line @next/next/no-img-element -- 1º quadro, visível antes do canvas */}
          <img
            className="bloom-poster"
            src={frameSrc("l", 0)}
            srcSet={`${frameSrc("s", 0)} 688w, ${frameSrc("l", 0)} 1122w`}
            // no celular, a versão leve (a mesma que o canvas usa depois)
            sizes="(max-width: 767px) 340px, 102vh"
            width={1122}
            height={880}
            alt=""
            fetchPriority="high"
          />
          <canvas ref={canvasRef} className="bloom-canvas" aria-hidden="true" />
        </div>

        <h1 id="bloom-title" className="bloom-title">
          <span className="sr-only">{site.name}: </span>
          <span className="bloom-left">
            <span>{leftLine}</span>
            <span className="bloom-line--em">{leftWord}</span>
          </span>
          <span className="bloom-right">
            <span>{rightLine}</span>
            <span className="bloom-line--em">{rightWord}</span>
          </span>
        </h1>

        <p className="bloom-note">{site.hero.note}</p>

        {/* Só um sinal de "role para baixo": não é botão (a capa se descobre rolando). */}
        <span className="bloom-down" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M12 3v17m0 0-6.5-6.5M12 20l6.5-6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div className="bloom-day" aria-hidden="true" />

        <div className="bloom-dedication">
          <Handwriting />
        </div>
      </div>

      <div ref={gustRef} className="leaf-gust" aria-hidden="true">
        {LEAF_GUST.map((petal, index) => (
          <span
            key={index}
            className="leaf-gust-petal"
            style={
              {
                "--y": petal.y,
                "--size": `${petal.size}px`,
                "--delay": `${petal.delay}s`,
                "--dur": `${petal.duration}s`,
                "--rise": petal.rise,
                "--spin": petal.spin,
              } as CSSProperties
            }
          >
            <PetalSvg />
          </span>
        ))}
      </div>
    </section>
  );
}

import { Cormorant_Garamond, EB_Garamond, Great_Vibes, Italiana, Jost } from "next/font/google";

// Títulos grandes (capa e seções): Italiana, serifada fina e alta, de vitrine.
export const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
  display: "swap",
});

// Poemas: Garamond (EB Garamond, a Garamond clássica do Google Fonts).
export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

// Títulos: Cormorant Garamond, um Garamond de vitrine, elegante em tamanho grande.
// Um só peso (500) e sem pré-carregamento: não aparece na capa, então não
// disputa banda com as fontes da primeira tela.
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "500",
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

// Detalhes marcantes ("para a Milly", assinatura): Great Vibes, cursiva de caligrafia.
// Não aparece na primeira tela, então não é pré-carregada.
export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});

// Interface (rótulos, botões, datas): Jost, sem serifa geométrica e leve.
export const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const fontVariables = [italiana, ebGaramond, cormorant, greatVibes, jost]
  .map((font) => font.variable)
  .join(" ");

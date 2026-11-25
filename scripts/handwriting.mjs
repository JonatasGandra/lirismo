#!/usr/bin/env node
// Gera o traçado da frase escrita à mão no fim da capa
// (components/home/handwriting-paths.ts) a partir da fonte Great Vibes.
//
// Uso:  npm run handwriting                      → "Com carinho à Milly"
//       npm run handwriting -- "Outra frase aqui"
//
// Cada letra vira um contorno vetorial com o seu tempo de escrita: o site
// desenha o contorno como uma pena e depois preenche de tinta, letra por letra.
import { writeFile } from "node:fs/promises";
import opentype from "opentype.js";

const FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf";
const OUT = new URL("../components/home/handwriting-paths.ts", import.meta.url);
const TEXT = (process.argv[2] ?? "Com carinho à Milly").trim();

const SIZE = 200; // unidades do desenho por "em"
const LINE_HEIGHT = 1.2; // entre as duas linhas da versão do celular
const PAD = 30; // folga em volta (a cursiva tem floreios)
const OPTIONS = { kerning: true, features: { liga: true, rlig: true } };

const response = await fetch(FONT_URL);
if (!response.ok) throw new Error(`Não consegui baixar a fonte (HTTP ${response.status}).`);
const font = opentype.parse(await response.arrayBuffer());

const width = (line) => font.getAdvanceWidth(line, SIZE, OPTIONS);

/** Divide a frase em duas linhas de larguras parecidas (versão do celular). */
function splitInTwo(phrase) {
  const words = phrase.split(/\s+/);
  if (words.length < 2) return [phrase];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(width(words.slice(0, i).join(" ")) - width(words.slice(i).join(" ")));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

const round = (n) => Math.round(n * 100) / 100;

function layout(lines) {
  const widths = lines.map(width);
  const maxWidth = Math.max(...widths);
  const marks = [];
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  lines.forEach((line, row) => {
    if (row > 0) marks.push({ newline: true });
    const offset = (maxWidth - widths[row]) / 2; // linhas centralizadas
    const baseline = SIZE + row * SIZE * LINE_HEIGHT;
    for (const path of font.getPaths(line, offset, baseline, SIZE, OPTIONS)) {
      const d = path.toPathData(0);
      if (!d) {
        marks.push({ space: true });
        continue;
      }
      const box = path.getBoundingBox();
      x1 = Math.min(x1, box.x1);
      y1 = Math.min(y1, box.y1);
      x2 = Math.max(x2, box.x2);
      y2 = Math.max(y2, box.y2);
      marks.push({ d, box });
    }
  });

  // O ritmo da mão: letras largas levam mais tempo; espaços e a troca de
  // linha são pequenas pausas; cada letra começa antes da anterior terminar.
  const glyphs = [];
  let t = 0.25;
  for (const mark of marks) {
    if (mark.space) {
      t += 0.16;
      continue;
    }
    if (mark.newline) {
      t += 0.26;
      continue;
    }
    const letterWidth = (mark.box.x2 - mark.box.x1) / SIZE;
    const duration = Math.min(0.85, Math.max(0.3, 0.24 + letterWidth * 0.55));
    glyphs.push({ d: mark.d, delay: round(t), duration: round(duration) });
    t += duration * 0.52;
  }
  const last = glyphs[glyphs.length - 1];

  return {
    viewBox: [x1 - PAD, y1 - PAD, x2 - x1 + PAD * 2, y2 - y1 + PAD * 2].map((n) => Math.round(n)).join(" "),
    glyphs,
    total: round(last.delay + last.duration + 0.8),
  };
}

const wide = layout([TEXT]);
const stacked = layout(splitInTwo(TEXT));

const source = `// Gerado por scripts/handwriting.mjs a partir da fonte Great Vibes (SIL Open Font License).
// Não edite à mão: para trocar a frase, rode  npm run handwriting -- "Nova frase"

export type InkGlyph = { d: string; delay: number; duration: number };
export type InkLayout = { viewBox: string; glyphs: InkGlyph[]; total: number };

export const HANDWRITING_TEXT = ${JSON.stringify(TEXT)};

/** Uma linha (telas largas). */
export const inkWide: InkLayout = ${JSON.stringify(wide, null, 2)};

/** Duas linhas (celular). */
export const inkStacked: InkLayout = ${JSON.stringify(stacked, null, 2)};
`;

await writeFile(OUT, source, "utf8");
console.log(
  `Frase: "${TEXT}" — ${wide.glyphs.length} letras; escrita em ~${wide.total}s (uma linha) e ~${stacked.total}s (duas linhas).`,
);

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { themeTokens as t } from "@/lib/theme-tokens";

export const OG_SIZE = { width: 1200, height: 630 };

type OgFont = { name: string; data: ArrayBuffer; style: "normal" | "italic"; weight: 400 };

/** Baixa só os glifos necessários de uma fonte do Google Fonts (formato TTF, aceito pelo gerador). */
async function loadGoogleFont(family: string, axes: string, text: string): Promise<ArrayBuffer | null> {
  if (!text.trim()) return null;
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}${axes}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const source = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!source) return null;
    const response = await fetch(source[1]);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null; // sem rede: usa a fonte padrão do gerador
  }
}

let lilyPhoto: Promise<string | null> | undefined;

/** O lírio no auge, sobre fundo preto (public/lirio/og-lily.jpg, 802×630). */
function loadLilyPhoto(): Promise<string | null> {
  lilyPhoto ??= readFile(join(process.cwd(), "public", "lirio", "og-lily.jpg"))
    .then((file) => `data:image/jpeg;base64,${file.toString("base64")}`)
    .catch(() => null);
  return lilyPhoto;
}

/**
 * Ícone (aba do navegador e tela inicial do celular): um "L" de Lirismo na
 * serifada fina, em lilás claro sobre a noite da capa.
 */
export async function renderMonogram(size: number, rounded: boolean) {
  const font = await loadGoogleFont("Italiana", "", "L");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.night,
          borderRadius: rounded ? Math.round(size * 0.22) : 0,
          color: t.nightAccent,
          fontFamily: "Display",
          fontSize: Math.round(size * 0.74),
          lineHeight: 1,
          paddingTop: Math.round(size * 0.06),
        }}
      >
        L
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: font ? [{ name: "Display", data: font, style: "normal" as const, weight: 400 as const }] : [],
    },
  );
}

type OgOptions = {
  kicker: string;
  title: string;
  lines?: string[];
  /** Título bem grande (imagem geral do site, com o nome "Lirismo"). */
  large?: boolean;
};

/**
 * Imagem de compartilhamento (WhatsApp, Instagram…): a noite da capa, o lírio
 * aberto à direita e o título na serifada fina à esquerda.
 */
export async function renderOgImage({ kicker, title, lines = [], large = false }: OgOptions) {
  const brand = site.name.toUpperCase();
  const [display, italic, photo] = await Promise.all([
    loadGoogleFont("Italiana", "", `${brand}${kicker.toUpperCase()}${title}`),
    loadGoogleFont("EB Garamond", ":ital@1", lines.join("")),
    loadLilyPhoto(),
  ]);

  const fonts: OgFont[] = [];
  if (display) fonts.push({ name: "Display", data: display, style: "normal", weight: 400 });
  if (italic) fonts.push({ name: "Garamond", data: italic, style: "italic", weight: 400 });

  const titleSize = large ? 132 : title.length > 40 ? 58 : title.length > 22 ? 72 : 92;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#000000",
          fontFamily: "Display",
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem gerada, não é página
          <img src={photo} width={802} height={630} alt="" style={{ position: "absolute", right: 0, top: 0 }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 780,
            height: 630,
            display: "flex",
            backgroundImage: "linear-gradient(90deg, #000000 0%, #000000 50%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 620,
            height: "100%",
            padding: "60px 0 60px 72px",
          }}
        >
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 10, color: t.nightAccent }}>
            {large ? "" : brand}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: t.nightMuted }}>
              {kicker.toUpperCase()}
            </div>
            <div
              style={{ display: "flex", marginTop: 16, fontSize: titleSize, lineHeight: 1.04, color: t.nightText }}
            >
              {title}
            </div>
            {lines.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
                {lines.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      fontFamily: "Garamond",
                      fontStyle: "italic",
                      fontSize: 28,
                      lineHeight: 1.4,
                      color: t.nightMuted,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", width: 160, height: 1, backgroundColor: t.nightAccent }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

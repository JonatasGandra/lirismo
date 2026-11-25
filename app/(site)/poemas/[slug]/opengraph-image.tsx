import { getPoemBySlug } from "@/lib/data";
import { toRoman } from "@/lib/format";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { firstVerses } from "@/lib/poem";
import { site } from "@/lib/site";

export const alt = `Poema · ${site.name}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

// A imagem que aparece ao mandar o link de um poema (WhatsApp, Instagram…).
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPoemBySlug(slug);

  if (!entry) {
    return renderOgImage({ kicker: "Poemas & canções", title: site.name, large: true });
  }

  return renderOgImage({
    kicker: `Poema ${toRoman(entry.poem.number)}`,
    title: entry.poem.title,
    lines: firstVerses(entry.poem.body, 2),
  });
}

import { HANDWRITING_TEXT, inkStacked, inkWide, type InkLayout } from "./handwriting-paths";

function Ink({ layout, className }: { layout: InkLayout; className: string }) {
  return (
    <svg
      viewBox={layout.viewBox}
      className={`ink ${className}`}
      data-total={layout.total}
      aria-hidden="true"
      focusable="false"
    >
      {layout.glyphs.map((glyph, index) => (
        <path key={index} d={glyph.d} pathLength={1} data-delay={glyph.delay} data-duration={glyph.duration} />
      ))}
    </svg>
  );
}

/**
 * "Com carinho à Milly" escrito à mão: letra por letra, o contorno é traçado
 * como por uma pena e logo em seguida preenchido de tinta. Quem move a pena é
 * a rolagem (BloomHero lê data-delay/data-duration de cada letra), então não
 * dá para passar pela frase sem vê-la escrita. Uma linha em telas largas, duas
 * no celular.
 */
export function Handwriting() {
  return (
    <div className="handwriting" role="img" aria-label={HANDWRITING_TEXT}>
      <Ink layout={inkWide} className="ink--wide" />
      <Ink layout={inkStacked} className="ink--stacked" />
    </div>
  );
}

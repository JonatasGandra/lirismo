import type { CSSProperties } from "react";
import { PetalSvg } from "./PetalSvg";

const GUST = [
  { y: "24%", size: 18, delay: 0 },
  { y: "44%", size: 13, delay: 0.18 },
  { y: "63%", size: 16, delay: 0.34 },
];

/** Três pétalas que atravessam a tela uma vez, como uma rajada de vento. */
export function PetalGust() {
  return (
    <div className="gust" aria-hidden="true">
      {GUST.map((petal, index) => (
        <span
          key={index}
          className="gust-petal"
          style={
            {
              "--y": petal.y,
              "--size": `${petal.size}px`,
              "--delay": `${petal.delay}s`,
              "--dur": "3.5s",
            } as CSSProperties
          }
        >
          <PetalSvg />
        </span>
      ))}
    </div>
  );
}

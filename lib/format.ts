import { site } from "@/lib/site";

const dateFormatter = new Intl.DateTimeFormat(site.locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: site.timeZone,
});

const numericFormatter = new Intl.DateTimeFormat(site.locale, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: site.timeZone,
});

const yearFormatter = new Intl.DateTimeFormat(site.locale, {
  year: "numeric",
  timeZone: site.timeZone,
});

/** "24 de novembro de 2026" (usada no painel) */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** "20 · 11 · 2026" — a data minimalista dos poemas no site. */
export function formatMinimalDate(iso: string): string {
  const parts = Object.fromEntries(
    numericFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day} · ${parts.month} · ${parts.year}`;
}

export function yearOf(iso: string): string {
  return yearFormatter.format(new Date(iso));
}

/** 214 → "3:34". Sem duração conhecida → "--:--". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** 4 → "IV": o número do poema no catálogo. */
export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  let rest = n;
  let roman = "";
  for (const [value, symbol] of ROMAN) {
    while (rest >= value) {
      roman += symbol;
      rest -= value;
    }
  }
  return roman;
}

/** plural(1, "poema", "poemas") → "1 poema" */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

import { describe, expect, it } from "vitest";
import { formatMinimalDate, toRoman } from "@/lib/format";

describe("toRoman", () => {
  it("converte o número do poema no catálogo", () => {
    expect([1, 2, 4, 9, 14, 40, 90, 400, 1994].map(toRoman)).toEqual([
      "I",
      "II",
      "IV",
      "IX",
      "XIV",
      "XL",
      "XC",
      "CD",
      "MCMXCIV",
    ]);
  });

  it("devolve como está o que não é um número romano válido", () => {
    expect(toRoman(0)).toBe("0");
    expect(toRoman(2.5)).toBe("2.5");
  });
});

describe("formatMinimalDate", () => {
  it("mostra dia · mês · ano", () => {
    expect(formatMinimalDate("2026-11-20T15:00:00+00:00")).toBe("20 · 11 · 2026");
  });

  it("usa o fuso de São Paulo (22h30 do dia 20 lá ainda é dia 20)", () => {
    expect(formatMinimalDate("2026-11-21T01:30:00+00:00")).toBe("20 · 11 · 2026");
  });
});

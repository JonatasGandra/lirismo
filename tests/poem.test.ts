import { describe, expect, it } from "vitest";
import { excerptPoem, firstVerses, normalizePoem } from "@/lib/poem";

describe("normalizePoem", () => {
  it("converte \\r\\n e \\r em \\n", () => {
    expect(normalizePoem("um\r\ndois\rtrês")).toBe("um\ndois\ntrês");
  });

  it("remove espaços no fim da linha e preserva o recuo no início", () => {
    expect(normalizePoem("verso   \n    recuado\t \n")).toBe("verso\n    recuado");
  });

  it("colapsa 3 ou mais quebras em exatamente uma linha em branco", () => {
    expect(normalizePoem("a\n\n\n\nb\n\nc")).toBe("a\n\nb\n\nc");
  });

  it("remove linhas em branco (inclusive só com espaços) no início e no fim", () => {
    expect(normalizePoem("\n\n  \nverso\n\n \n")).toBe("verso");
  });

  it("mantém o recuo do primeiro verso", () => {
    expect(normalizePoem("\n\n   primeiro")).toBe("   primeiro");
  });

  it("aceita texto colado do Word/WhatsApp sem quebrar a formatação", () => {
    const colado =
      "\r\n\r\nPrimeiro verso   \r\n   segundo, recuado \r\n \r\n\r\n\r\nNova estrofe\t\r\n";
    expect(normalizePoem(colado)).toBe("Primeiro verso\n   segundo, recuado\n\nNova estrofe");
  });

  it("preserva 3 estrofes e um verso recuado exatamente como digitados", () => {
    const poema = "Lírio branco\nno jardim\n\n    curvo ao vento\nme lembra você\n\nfica o perfume";
    expect(normalizePoem(poema)).toBe(poema);
    expect(normalizePoem(poema).split(/\n\s*\n/)).toHaveLength(3);
  });
});

describe("firstVerses", () => {
  it("pega os primeiros versos não vazios, sem recuo", () => {
    expect(firstVerses("   um\n\ndois\ntrês", 2)).toEqual(["um", "dois"]);
  });
});

describe("excerptPoem", () => {
  const estrofe = "a\nb\nc\nd";

  it("corta por estrofes inteiras", () => {
    const poema = [estrofe, estrofe, estrofe].join("\n\n");
    expect(excerptPoem(poema, 8)).toEqual({ text: `${estrofe}\n\n${estrofe}`, truncated: true });
  });

  it("não marca como cortado quando cabe inteiro", () => {
    expect(excerptPoem(estrofe, 12)).toEqual({ text: estrofe, truncated: false });
  });

  it("corta uma estrofe única longa demais", () => {
    const longa = Array.from({ length: 20 }, (_, i) => `v${i}`).join("\n");
    const { text, truncated } = excerptPoem(longa, 12);
    expect(text.split("\n")).toHaveLength(12);
    expect(truncated).toBe(true);
  });
});

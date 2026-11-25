import { describe, expect, it } from "vitest";
import { pickUniqueSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("deixa em minúsculas, sem acento e com hífens", () => {
    expect(slugify("Lírio do Campo")).toBe("lirio-do-campo");
  });

  it("remove pontuação e símbolos", () => {
    expect(slugify("Ação & Coração!")).toBe("acao-coracao");
  });

  it("trata cedilha e til", () => {
    expect(slugify("Canção à Milly")).toBe("cancao-a-milly");
  });

  it("usa 'sem-titulo' quando não sobra nada", () => {
    expect(slugify("♥ ♥")).toBe("sem-titulo");
  });
});

describe("pickUniqueSlug", () => {
  it("usa a base quando está livre", () => {
    expect(pickUniqueSlug("lirio", [])).toBe("lirio");
  });

  it("acrescenta -2, -3… quando já existe", () => {
    expect(pickUniqueSlug("lirio", ["lirio"])).toBe("lirio-2");
    expect(pickUniqueSlug("lirio", ["lirio", "lirio-2"])).toBe("lirio-3");
  });
});

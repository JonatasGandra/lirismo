import { revalidatePath } from "next/cache";

/**
 * Revalida o site inteiro depois de qualquer escrita. O site é pequeno, e
 * assim a capa, os catálogos, a página do poema e os vizinhos anterior/próximo
 * (que mudam quando um poema entra ou sai) ficam certos na hora.
 */
export function revalidateSite(): void {
  revalidatePath("/", "layout");
}

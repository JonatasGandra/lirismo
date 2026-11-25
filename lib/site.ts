/**
 * Textos do site. Para trocar o nome, as frases da capa ou a dedicatória,
 * edite só este arquivo.
 */
export const site = {
  // Lírio + lira + poesia: a flor, a música e os versos num só nome.
  name: "Lirismo",
  shortName: "Lirismo",
  description: "Poemas e canções para a Milly — o lírio, a lira e a poesia num só nome.",
  hero: {
    // Título dividido dos dois lados do lírio (a 2ª palavra aparece em caixa alta).
    left: ["Versos que", "florescem"],
    right: ["canções que", "perfumam"],
    note: "Um catálogo de poemas e canções escritos para Camilly. Lírio, lira e poesia num só nome: Lirismo.",
  },
  // A frase escrita à mão quando a noite da capa vira dia ("Com carinho à Milly")
  // não fica aqui: ela é desenhada letra por letra a partir da fonte. Para trocar,
  // rode  npm run handwriting -- "Nova frase"  (gera components/home/handwriting-paths.ts).
  poemsIntro: "Versos guardados como flores entre as páginas, do mais recente ao primeiro.",
  songsIntro: "Canções para ouvir devagar. Pode seguir lendo os poemas: a música continua tocando.",
  footerSignature: "amo você, Milly",
  // Quem fez o site (aparece no rodapé, abaixo da assinatura)
  author: "Jônatas Gandra",
  locale: "pt-BR",
  ogLocale: "pt_BR",
  timeZone: "America/Sao_Paulo",
} as const;

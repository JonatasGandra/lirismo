# Lirismo

*Lírio + lira + poesia.* Site pessoal com um catálogo de **poemas** e **músicas** feitos
para a Camilly (Milly). Um único autor publica; quem tem o link só lê e ouve.

- **Capa:** noite escura com um lírio de verdade (time-lapse) que **desabrocha conforme a
  página rola**. No fim, a noite vira dia — a luz sobe em lilás até o branco do site — e,
  sozinha na tela inteira, a frase **"Com carinho à Milly" é escrita à mão**, letra por letra.
- **Visual:** papel marfim e destaque **lilás**; títulos grandes em **Italiana** (serifada
  fina), poemas em **Garamond** (EB Garamond), títulos de poema em Cormorant Garamond,
  detalhes em cursiva (**Great Vibes**) e interface em Jost. Sem barra de navegação e sem
  logo desenhada: o nome aparece só escrito, na serifada fina, no rodapé.
- **Movimento:** rolagem com inércia suave (Lenis), conteúdo que chega ao rolar como
  pétalas trazidas pelo vento e rajada de pétalas ao trocar de página. Com "reduzir
  movimento" ligado no sistema, as animações param e o lírio da capa já aparece aberto.

A especificação completa está em [Especificação — Site de Poesias e Músicas.md](Especificação%20—%20Site%20de%20Poesias%20e%20Músicas.md).

---

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS 3 + CSS variables · Supabase
(Postgres, Auth, Storage) · Vercel. Tudo no plano gratuito, sem backend separado.

## Estrutura

```
app/
  (site)/                 páginas públicas (capa, /poemas, /poemas/[slug], /musicas)
  entrar/                 login do autor
  painel/                 área do autor (lista, poema/[id], musica/[id])
  api/keepalive/          rota chamada pelo cron para o Supabase não pausar
  theme.css               ★ tokens do tema: cores, fontes, tamanhos, movimento
  globals.css             estilos dos componentes (usam só os tokens)
  fonts.ts                fontes do Google (next/font)
components/
  home/BloomHero.tsx      ★ a capa: o lírio que desabrocha com a rolagem
  lily/                   divisor (filete com losango) e pétalas ao vento
  site/ home/ poems/ songs/ player/ admin/
public/lirio/             quadros do time-lapse (l = desktop, s = celular) e og-lily.jpg
lib/
  site.ts                 ★ textos do site (nome, dedicatória, frases)
  poem.ts                 normalizePoem e trechos de poema
  data.ts                 leituras públicas
  actions/                Server Actions (login, poemas, músicas)
  upload.ts               upload direto ao Storage com progresso, capa, duração
  supabase/               clientes (servidor, navegador, público) e middleware
supabase/migrations/
  0001_init.sql           tabelas, RLS e buckets
middleware.ts             protege /painel e renova a sessão
vercel.json               cron de keep-alive (a cada 3 dias)
```

---

## 1. Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (plano Free; região
   *South America (São Paulo)* deixa o site mais rápido no Brasil).
2. **SQL Editor → New query**: cole todo o conteúdo de
   [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) e clique em **Run**.
3. **Authentication → Users → Add user → Create new user**: e-mail e senha do autor.
   Marque **Auto Confirm User** (senão o login recusa o e-mail não confirmado).
4. **Authentication → Sign In / Providers**: desative **Allow new users to sign up**.
   Isso é obrigatório: qualquer usuário logado é tratado como autor.
5. Depois do deploy (passo 3): **Authentication → URL Configuration → Site URL** com a
   URL da Vercel.
6. **Project Settings → API / API Keys**: copie a *Project URL* e a chave pública
   (*anon* ou *publishable*). **Nunca** use a chave `service_role` — ela não é necessária.

## 2. Rodar localmente

Requer Node.js 20.9 ou mais novo.

```bash
npm install
cp .env.example .env.local   # e preencha as variáveis abaixo
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Onde pegar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (chave pública *anon* ou *publishable*) |
| `CRON_SECRET` | Uma string aleatória longa criada por você (ex.: `openssl rand -hex 32`) |

Sem as variáveis do Supabase o site abre com as seções vazias e a tela de login avisa
que falta configurar — útil para mexer só no visual.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e servidor de produção |
| `npm run typecheck` | checagem de tipos (TypeScript estrito) |
| `npm test` | testes de `normalizePoem` e dos slugs |
| `npm run check` | typecheck + testes |

## 3. Deploy na Vercel

1. Suba o projeto para um repositório no GitHub (de preferência **privado**):
   ```bash
   git init -b main
   git add .
   git commit -m "Lirismo"
   git remote add origin git@github.com:SEU-USUARIO/lirismo.git
   git push -u origin main
   ```
2. Na Vercel: **Add New → Project → Import** o repositório. O framework (Next.js) é
   detectado sozinho; não mude nada no build.
3. Em **Settings → Environment Variables**, cadastre as três variáveis acima
   (Production e Preview) e faça o deploy.
4. A cada `git push` na `main` sai um deploy novo automaticamente.
5. O cron de keep-alive já está em [vercel.json](vercel.json) e aparece em
   **Settings → Cron Jobs**. A Vercel envia o `CRON_SECRET` sozinha. Para testar:
   ```bash
   curl -H "Authorization: Bearer SEU_CRON_SECRET" https://SEU-SITE.vercel.app/api/keepalive
   # → {"ok":true,...}
   ```
6. Volte ao Supabase e coloque a URL final em **URL Configuration** (passo 1.5).

## 4. Como publicar

Acesse **`/entrar`** (não há link público para o login, de propósito) e entre com o
e-mail e a senha do autor. O painel fica em **`/painel`**.

**Novo poema**

- Título (obrigatório) e o texto num campo simples, sem formatação.
- Uma quebra de linha = novo **verso**. Uma linha em branco = nova **estrofe**.
  Espaços no início do verso ficam (recuo intencional).
- Pode colar do Word ou do WhatsApp: o texto é limpo ao salvar (quebras `\r\n`,
  espaços sobrando no fim, linhas em branco repetidas).
- A pré-visualização ao lado mostra exatamente como vai ficar.
- **Publicado** vem marcado. Desmarcado = rascunho (só aparece no painel).
- Ao salvar, o poema aparece no site na hora e o navegador abre a página dele.

**Nova música**

- Título, a música e capa opcional (JPG/PNG/WebP até 5 MB).
- A música pode ser um **MP3** (até 50 MB) ou um **vídeo MP4** (até 2 GB). Do vídeo, só
  o áudio é extraído, em MP3 a 192 kbps, no próprio navegador, ao salvar. O vídeo não é
  enviado (barra "Extraindo o áudio do vídeo…"). Funciona no Chrome, no Edge e no Safari
  atualizados.
- Dica: exporte o MP3 a **128–192 kbps** (cerca de 3–5 MB por música).
- O MP3 sobe direto do navegador para o Supabase, com barra de progresso. A capa é
  reduzida para no máximo 1200 px e convertida para WebP antes de subir.
- Sem capa, o card mostra um placeholder lilás com o lírio e a inicial do título.
- Na edição, trocar o MP3 ou a capa apaga o arquivo antigo; dá para remover a capa.

**Editar / excluir**: no painel, cada item tem *Ver*, *Editar* e *Excluir*
(com confirmação). Excluir uma música apaga também o MP3 e a capa do Storage.

## 5. Personalizar o visual

| Quero mudar… | Arquivo |
| --- | --- |
| Nome do site, dedicatória, frases da capa e do rodapé | [lib/site.ts](lib/site.ts) |
| Cores, tamanhos, raios, sombras, velocidade das animações | [app/theme.css](app/theme.css) (e as cores em [lib/theme-tokens.ts](lib/theme-tokens.ts), usadas nas imagens de compartilhamento) |
| Fontes | [app/fonts.ts](app/fonts.ts) + `--font-*` em [app/theme.css](app/theme.css) |
| Ícone da aba e da tela do celular (o "L") | `renderMonogram` em [lib/og.tsx](lib/og.tsx) |
| Capa: ritmo do desabrochar e do amanhecer | [components/home/BloomHero.tsx](components/home/BloomHero.tsx) (`BLOOM_END`, `DAWN_START`); as cores da noite em [app/theme.css](app/theme.css) (`--color-night*`, `--gradient-night`) |
| Rajada de pétalas entre páginas | [components/lily/PetalGust.tsx](components/lily/PetalGust.tsx) |

Nenhum componente tem cor ou fonte fixa: tudo vem das variáveis de `app/theme.css`.

## 6. Os quadros do lírio da capa

A capa usa `public/lirio/{l,s}/00.webp` … `71.webp`: 72 quadros do time-lapse (de 0 a 38 s,
do botão ao auge, antes de as pétalas caírem), recortados no lírio e com o preto do fundo
"achatado" para sumir no céu da noite. Para refazer a partir de outro vídeo (precisa do
`ffmpeg`; o fundo do vídeo tem que ser preto):

```bash
BASE="fps=72/38,crop=1272:998:64:36,lutyuv=y=if(lte(val\,18)\,16\,val)"
ffmpeg -t 38 -i video.mp4 -an -vf "$BASE,scale=-2:880:flags=lanczos" -c:v libwebp -quality 70 -start_number 0 public/lirio/l/%02d.webp
ffmpeg -t 38 -i video.mp4 -an -vf "$BASE,scale=-2:540:flags=lanczos" -c:v libwebp -quality 68 -start_number 0 public/lirio/s/%02d.webp
```

Ajuste `-t` (duração útil), o `crop` (a região do lírio) e, se mudar a quantidade de
quadros, `FRAME_COUNT` em [components/home/BloomHero.tsx](components/home/BloomHero.tsx).
A gravação bruta (`*.mp4` na raiz) fica fora do git.

### A frase escrita à mão

"Com carinho à Milly" não é texto comum: cada letra da cursiva (Great Vibes) foi convertida
em traçado vetorial ([components/home/handwriting-paths.ts](components/home/handwriting-paths.ts)),
com o tempo de escrita de cada uma. O site desenha o contorno como uma pena e preenche de
tinta, letra por letra — e **quem move a pena é a rolagem**: a frase só fica completa no fim
da capa, então não dá para passar por ela sem vê-la escrita (e, rolando para trás, ela se
desfaz). O ritmo de cada letra (`BLOOM_END`, `DAWN_*`, `WRITE_START`/`WRITE_END`) fica em
[components/home/BloomHero.tsx](components/home/BloomHero.tsx). Para trocar a frase:

```bash
npm run handwriting -- "Nova frase aqui"
```

O script ([scripts/handwriting.mjs](scripts/handwriting.mjs)) baixa a fonte do repositório
oficial do Google Fonts e gera as duas versões: uma linha (telas largas) e duas (celular).

---

## Decisões tomadas

A especificação pede para registrar aqui as escolhas feitas nos pontos em aberto
(sempre a opção mais simples).

1. **Policy extra no Storage** (`autor lista arquivos`, SELECT para usuário logado).
   A API de Storage exige SELECT para apagar arquivos; sem ela, excluir uma música
   deixaria o MP3 e a capa órfãos. A leitura pública continua pela URL pública.
   Também adicionei `on conflict do nothing` na criação dos buckets.
2. **Slug fixo após criado.** O slug é gerado do título na criação (com `-2`, `-3`… se
   repetir) e **não muda** quando o título é editado, para não quebrar links já enviados.
3. **Revalidação:** toda escrita chama `revalidatePath('/', 'layout')`, que revalida o
   site inteiro. É pequeno, e assim capa, catálogos, página do poema e os links
   anterior/próximo dos vizinhos ficam certos na hora.
4. **Páginas públicas sem cookies:** leem o Supabase com o cliente anônimo (só o que está
   publicado, pela RLS), então continuam estáticas com `revalidate = 3600`. O
   `middleware.ts` roda só em `/painel/*` e `/entrar`.
5. **Capa:** o último poema em destaque (até 12 versos, por estrofes inteiras) e, logo
   abaixo, os **3 poemas seguintes** (sem repetir o destaque) e as 3 músicas mais recentes.
6. **Músicas não têm página própria** (a especificação não lista essa rota). Cada card tem
   uma âncora `/musicas#slug`, usada pelo painel e pelo mini-player.
7. **Mini-player implementado** (era opcional): um único `<audio preload="none">` no layout
   público. A música continua tocando ao navegar e tocar uma pausa as outras.
8. **Upload com progresso via XHR** direto na API REST do Storage, com o token da sessão do
   autor (o supabase-js não expõe progresso de upload).
9. **Capa em WebP**; se o navegador não souber gerar WebP, vai como JPG (`{uuid}.jpg`).
10. **Duração:** lida no navegador; se não der (alguns MP3 VBR), fica vazia e aparece `--:--`.
11. **Volume:** escondido no iOS, que não permite mudar o volume por código.
12. **Login por Server Action** (`signInWithPassword`); os cookies ficam com `@supabase/ssr`.
13. **Numeração "Nº"** do catálogo segue a ordem de publicação (Nº 01 = o primeiro). Se um
    poema for excluído, os seguintes são renumerados.
14. **Rascunho:** ao salvar um poema não publicado, volta para o painel (a página pública
    não existe para rascunhos).
15. **Excluir** pede confirmação com um segundo clique, sem janela de diálogo do navegador.
16. **Imagens de compartilhamento** (Open Graph) geradas automaticamente: uma geral, uma
    para `/poemas`, uma para `/musicas` e uma por poema (título + primeiros versos), para o
    link ficar bonito no WhatsApp. `robots: noindex` em todo o site.
17. **Sem ESLint:** o projeto usa TypeScript estrito + testes (`npm run check`). Para
    adicionar lint, instale `eslint` e `eslint-config-next` e crie um `eslint.config.mjs`.
18. **Nome Lirismo e capa "noite que vira dia"** (escolhas do autor a partir de uma
    referência): capa escura com o lírio real; ao rolar, a luz do amanhecer sobe em lilás
    até o branco do site. O cabeçalho fica transparente e claro sobre a noite.
19. **Time-lapse em quadros, não em vídeo:** o vídeo virou 72 imagens WebP desenhadas num
    `<canvas>` (um vídeo controlado pela rolagem engasga no iPhone). A primeira vem junto
    com a página; as outras só depois que ela termina de carregar — primeiro espaçadas,
    depois as do meio. Celular baixa a versão leve (~1,4 MB), desktop a maior (~2,6 MB).
20. **Título da capa em diagonal** (em cima à esquerda, embaixo à direita), e não na mesma
    altura como na referência: na mesma altura ele cobriria as três flores abertas.
21. **Origem do time-lapse:** gravação de tela de um vídeo do YouTube, feita pelo autor do
    site. Os direitos do vídeo são de quem o publicou; como o site é público por link, vale
    pedir autorização ou dar o crédito.
22. **Barra de rolagem discreta e translúcida:** no computador a barra nativa é escondida
    e no lugar entra uma linha fina lilás ([components/site/ScrollIndicator.tsx](components/site/ScrollIndicator.tsx))
    que aparece ao rolar ou ao passar o mouse na borda, some sozinha e pode ser arrastada.
    (Só pintar a barra nativa não basta no Windows: ela ocupa uma faixa própria, que
    ficaria clara sobre a capa escura.) No celular fica a barra nativa, que já é discreta.
    As áreas roláveis internas, como o campo do poema, usam a barra nativa fina em lilás.
23. **Sem barra de navegação e sem logo** (pedido do autor): a navegação fica nos links da
    própria página (destaque, "ver o catálogo", "ouvir todas"), no "← voltar" discreto no
    topo das páginas internas e no rodapé (Início · Poemas · Músicas). O lírio desenhado
    saiu de todo o site; os divisores viraram um filete com um losango lilás, e o ícone da
    aba é um "L" na serifada fina. Só o painel do autor mantém um cabeçalho (com "Sair").
24. **Frase final escrita à mão:** a tela que fecha a capa é só "Com carinho à Milly",
    ocupando a tela inteira. Em vez de revelar um texto comum (que parece uma cortina), as
    letras da cursiva viram traçados vetoriais: contorno desenhado (`stroke-dashoffset` com
    `pathLength=1`) e preenchimento logo depois, com ritmo proporcional ao tamanho de cada
    letra. A escrita **acompanha a rolagem** (como o lírio), num trecho próprio da capa
    (~1,7 tela de rolagem, devagar de propósito), para não dar para pular.
25. **Rolagem mais calma fora da capa:** dentro da capa cada giro da roda do mouse vira
    animação (lírio, amanhecer, escrita); fora dela a página andava rápido demais. Por isso,
    fora da capa cada giro anda 35% menos (`CALM_WHEEL` em
    [components/site/SmoothScroll.tsx](components/site/SmoothScroll.tsx)). No celular o toque
    continua nativo.
26. **Catálogo minimalista** (pedidos do autor):
    - o número do poema aparece em **romano** (I, II, III…), centralizado, com a data
      minimalista embaixo (`20 · 11 · 2026`) — no destaque, na página do poema e na imagem
      de compartilhamento;
    - **sem botões** de "ouvir todas"/"ler o poema": o título "Músicas" da capa é link (um
      filete lilás embaixo se estende ao passar o mouse), o cartão do destaque é clicável
      por inteiro (sobe e acende) e cada entrada também;
    - **voltar** é um botão redondo e fino com um chevron, no canto superior esquerdo;
    - na passagem da frase escrita para o catálogo, uma **rajada de pétalas** cruza a tela
      (~1,5 s); repete se ela voltar para a capa e descer de novo.
27. **Formulários com reserva sem JavaScript:** o de poema e o de login enviam direto para
    a Server Action se o JavaScript da página falhar (o poema é salvo do mesmo jeito); o de
    música usa `method="post"` para nunca pôr os campos na URL. Motivo: em desenvolvimento,
    o cache do `next dev` chegou a servir 404 para o JavaScript da página do formulário, e o
    envio caía numa URL com o texto do poema sem salvar. Se isso acontecer: pare o servidor,
    apague a pasta `.next` e rode `npm run dev` de novo. Com "reduzir movimento", a frase já
    aparece escrita.
28. **"Abrir catálogo" na capa** (pedido do autor): logo abaixo do poema em destaque, fora
    da seção, um botão minimalista (texto pequeno + chevron num círculo fino) que leva a
    `/poemas`. Essa página é a lista de **todos** os poemas publicados, **só com os
    títulos**, do mais novo para o mais antigo. Cada linha é um link inteiro e parece
    clicável: chevron num círculo à direita (sempre visível, também no celular) e, ao passar
    o mouse, um véu lilás, o título fica lilás e anda um pouco. Cada poema novo publicado
    no painel entra na lista sozinho. A antiga seção "Poemas" da capa (os 3 mais recentes)
    saiu para não repetir o catálogo.
29. **Música a partir de vídeo MP4** (pedido do autor): o vídeo é convertido **no
    navegador** e só o áudio sobe, em MP3. Assim o bucket `audio`, as regras de RLS, o
    caminho `{uuid}.mp3` validado no servidor e o player continuam iguais, e o vídeo (que
    pode ter centenas de MB) não gasta Storage nem banda do plano gratuito. A conversão
    usa o [Mediabunny](https://mediabunny.dev), que lê o vídeo aos pedaços sem carregá-lo
    inteiro na memória, e o `@mediabunny/mp3-encoder`, o LAME em WebAssembly. Os dois têm
    licença MPL-2.0 e estão fixados na versão 1.65.2. Só são baixados quando alguém
    escolhe um MP4, então não pesam no site. Código em `lib/extract-audio.ts`. Áudio acima
    de 48 kHz é reamostrado para 44,1 kHz e o 5.1 vira estéreo. Vídeo sem som mostra um
    aviso. O MP3 extraído segue o mesmo limite de 50 MB (cerca de 35 minutos a 192 kbps).
30. **Carrossel em perspectiva na capa** (pedido do autor): poemas ("Em destaque") e
    músicas mostram até os 12 mais recentes. O último enviado fica no centro, nítido, e os
    vizinhos ficam atrás, um de cada lado: 18% menores, desfocados, mais apagados e com um
    leve giro. A lista dá a volta (com 3 ou mais itens), então o mais recente já começa
    com um vizinho de cada lado; com 2, o outro fica só à direita. Dá para passar de
    várias formas:
    - deslizando o dedo ou o trackpad para os lados (a rolagem vertical continua sendo da
      página, pelo `data-lenis-prevent-horizontal`);
    - arrastando com o mouse;
    - clicando no cartão do lado;
    - pelas setas do teclado;
    - pelas setinhas e pontinhos embaixo.

    O cartão do centro abre o poema; nas músicas, o player do centro toca. Os cartões dos
    lados ficam inertes até virem para o centro. O primeiro desenho sai do servidor, então
    a capa aparece certa antes do JavaScript carregar. Código em
    `components/site/Coverflow.tsx`. "Abrir catálogo" continua logo abaixo dos poemas.

## Critérios de aceite — como verificar

- [ ] Poema com 3 estrofes e um verso recuado aparece em `/poemas` na hora, idêntico ao
      digitado → publicar pelo painel e abrir o poema (há teste automático em
      `tests/poem.test.ts`).
- [ ] Colar do Word/WhatsApp não quebra a formatação → coberto por `normalizePoem` e testes.
- [ ] Música de 20 MB sem capa aparece com placeholder e toca no celular.
- [ ] Música com capa: a capa aparece; excluir apaga os 2 arquivos (Storage → buckets
      `audio` e `covers`).
- [ ] `/painel` deslogado redireciona para `/entrar`; criar conta nova é bloqueado
      (passo 1.4).
- [ ] Inserir em `poems` com a anon key sem login falha (RLS):
      ```bash
      curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/poems" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
        -d '{"slug":"x","title":"x","body":"x"}'
      # → erro 401/403 "new row violates row-level security policy"
      ```
- [ ] Lighthouse mobile ≥ 90 em Performance e Acessibilidade na capa (rodar no Chrome
      DevTools → Lighthouse, modo *Mobile*, na URL da Vercel).
- [x] README explica setup local, variáveis e como publicar.

## Limites do plano gratuito

- **Supabase Free:** 1 GB de arquivos, 50 MB por arquivo, 5 GB de egress por mês, 500 MB de
  banco. Os arquivos sobem com cache longo (`max-age` de 1 ano) para economizar egress.
- **Pausa por inatividade:** projetos gratuitos pausam após 1 semana sem uso; o cron
  `/api/keepalive` (a cada 3 dias) evita isso.
- **Vercel Hobby:** requisições a funções têm limite de ~4,5 MB, por isso o MP3 e a capa
  nunca passam pela Vercel.

## Fora do escopo (não implementado)

Comentários, curtidas, busca, contas de visitantes, editor rich text, playlists, vídeo.

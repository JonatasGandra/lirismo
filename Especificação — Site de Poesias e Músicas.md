# Especificação — Site de Poesias e Músicas

Nov 24, 2026 · @Gandra

## 1. Visão geral e escopo

Site pessoal e privado em espírito (público por link) que reúne **poemas** e **músicas** feitos para uma pessoa. Um único autor publica; qualquer pessoa com o link só lê e ouve. O objetivo é ficar pronto rápido, com código simples e sem custo.

**Entra no escopo (MVP):**

- Catálogo de poemas: título + texto com versos e estrofes preservados exatamente como digitados, sempre na fonte padrão do site.
- Catálogo de músicas: título + arquivo MP3 + imagem de capa opcional, com player.
- Página inicial com as duas seções e a última publicação em destaque.
- Área de publicação protegida por login (só o autor): publicar, editar e excluir poemas e músicas. Ao salvar, o item aparece no catálogo imediatamente.

**Fora do escopo (não implementar agora):** comentários, curtidas, busca, contas de visitantes, editor rich text (negrito, cores, fontes por poema), playlists, upload de vídeo.

> Instrução ao agente: implemente exatamente o que está aqui. Em caso de dúvida, escolha a opção mais simples e registre a decisão no README.

## 2. Stack e limites do plano gratuito

Next.js (App Router) na Vercel + Supabase (Postgres, Auth e Storage), tudo no plano gratuito. Sem backend separado.

| Camada | Escolha | Observação |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript | Server Components para leitura, Server Actions para escrita |
| Estilo | Tailwind CSS + CSS variables | Tokens de tema num só arquivo, para trocar o visual depois (seção 7) |
| Fontes | `next/font/google` | Fonte padrão dos poemas definida em uma variável |
| Banco | Supabase Postgres | 2 tabelas: `poems` e `songs` |
| Arquivos | Supabase Storage | Buckets públicos `audio` e `covers` |
| Auth | Supabase Auth (e-mail + senha) | Um único usuário; cadastro público desativado |
| Cliente | `@supabase/ssr` + `@supabase/supabase-js` | Cliente de servidor e de browser |
| Hospedagem | Vercel Hobby | Deploy automático a cada push no GitHub |

**Limites que afetam o projeto:**

- Supabase Free: 1 GB de arquivos, no máximo 50 MB por arquivo, 5 GB de egress por mês e 500 MB de banco ([preços](https://supabase.com/pricing)). Exportar MP3 a 128–192 kbps (\~3–5 MB por música) cabe com folga.
- Projetos gratuitos do Supabase **pausam após 1 semana sem atividade**. Mitigação: um Vercel Cron semanal que faz uma consulta leve ao banco (seção 8).
- Funções da Vercel aceitam corpo de requisição de até \~4,5 MB. Por isso o **MP3 e a imagem sobem direto do navegador para o Supabase Storage**, nunca passando por Server Action ou API Route.

## 3. Modelo de dados

Duas tabelas e dois buckets. Leitura pública; escrita só para usuário autenticado (o único usuário existente). Rodar o SQL abaixo no SQL Editor do Supabase como migration inicial (`supabase/migrations/0001_init.sql`).

```sql
-- POEMAS
create table public.poems (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null check (char_length(title) between 1 and 200),
  body        text not null,            -- texto cru, com \n entre versos e linha em branco entre estrofes
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- MÚSICAS
create table public.songs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null check (char_length(title) between 1 and 200),
  audio_path  text not null,            -- caminho no bucket 'audio'
  cover_path  text,                     -- caminho no bucket 'covers' (opcional)
  duration_s  integer,                  -- preenchido no upload pelo browser
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.poems (created_at desc);
create index on public.songs (created_at desc);

-- RLS
alter table public.poems enable row level security;
alter table public.songs enable row level security;

create policy "leitura publica poemas" on public.poems
  for select using (published = true or auth.role() = 'authenticated');
create policy "escrita autor poemas" on public.poems
  for all to authenticated using (true) with check (true);

create policy "leitura publica musicas" on public.songs
  for select using (published = true or auth.role() = 'authenticated');
create policy "escrita autor musicas" on public.songs
  for all to authenticated using (true) with check (true);

-- STORAGE
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('audio',  'audio',  true, 52428800, array['audio/mpeg']),
  ('covers', 'covers', true, 5242880,  array['image/jpeg','image/png','image/webp']);

create policy "autor envia arquivos" on storage.objects
  for insert to authenticated with check (bucket_id in ('audio','covers'));
create policy "autor altera arquivos" on storage.objects
  for update to authenticated using (bucket_id in ('audio','covers'));
create policy "autor apaga arquivos" on storage.objects
  for delete to authenticated using (bucket_id in ('audio','covers'));
```

**Regras:**

- `slug` gerado do título (minúsculas, sem acento, hífens); se já existir, acrescentar `-2`, `-3`…
- Nomes de arquivo no Storage: `{uuid}.mp3` e `{uuid}.{ext}`; nunca o nome original.
- Ao excluir uma música, apagar também o MP3 e a capa do Storage.
- Como só existe um usuário, “autenticado” = autor. Por isso o cadastro público precisa ficar **desativado** em Authentication → Providers → Email (seção 8).

## 4. Formatação dos poemas

O autor digita o poema num `<textarea>` simples; o site mostra os versos e estrofes exatamente como foram digitados, sempre na fonte padrão. Nada de editor rich text.

**Convenção de entrada (mostrar como dica abaixo do campo):**

- Uma quebra de linha = novo **verso**.
- Uma ou mais linhas em branco = nova **estrofe**.
- Espaços no início do verso são preservados (recuo intencional).

**Normalização ao salvar** (função `normalizePoem(body)` em `lib/poem.ts`):

1. Converter `\r\n` e `\r` em `\n`.
2. Remover espaços no fim de cada linha (não no início).
3. Colapsar 3+ quebras seguidas em exatamente uma linha em branco.
4. Remover linhas em branco no início e no fim do texto.

**Renderização** (componente `<PoemBody body={...} />`):

```tsx
const stanzas = body.split(/\n\s*\n/);
return (
  <div className="poem">
    {stanzas.map((stanza, i) => (
      <p key={i} className="stanza">
        {stanza.split("\n").map((verse, j) => (
          <span key={j} className="verse">{verse}</span>
        ))}
      </p>
    ))}
  </div>
);
```

```css
.poem    { font-family: var(--font-poem); font-size: var(--poem-size); line-height: 1.7; }
.stanza  { margin: 0 0 var(--stanza-gap); }
.verse   { display: block; white-space: pre-wrap; }
```

- Renderizar como texto, nunca com `dangerouslySetInnerHTML` (evita HTML injetado).
- Versos longos quebram naturalmente no celular; o recuo visual do verso continuado fica a critério do estilo (seção 7).
- O **título** é obrigatório e aparece acima do poema, numa fonte de título definida pelo tema.
- O formulário tem **pré-visualização ao vivo** ao lado (desktop) ou abaixo (celular), usando o mesmo `<PoemBody>`.

## 5. Músicas

Cada música tem título (obrigatório), MP3 (obrigatório, até 50 MB) e imagem de capa (opcional, JPG/PNG/WebP até 5 MB). O upload vai direto do navegador para o Storage; só os metadados passam pela Server Action.

**Fluxo de publicação:**

1. Validar no browser: tipo `audio/mpeg`, tamanho ≤ 50 MB; capa, se houver, ≤ 5 MB.
2. Ler a duração com um `<audio>` temporário (`loadedmetadata`) e guardar em `duration_s`.
3. Enviar o MP3 com o cliente Supabase do browser (sessão do autor) para `audio/{uuid}.mp3`, mostrando barra de progresso.
4. Se houver capa, redimensionar no browser para no máx. 1200 px e enviar para `covers/{uuid}.webp`.
5. Chamar a Server Action `createSong({ title, audio_path, cover_path, duration_s })`, que insere a linha e chama `revalidatePath`.
6. Se o passo 5 falhar, apagar os arquivos já enviados.

**Sem capa:** mostrar um placeholder gerado por CSS (gradiente do tema + inicial do título). Nunca imagem quebrada.

**Player:**

- Componente próprio sobre `<audio preload="none">` com play/pause, barra de progresso arrastável, tempo atual/total e volume. Visual definido na seção 7.
- Tocar uma música pausa qualquer outra que esteja tocando.
- Funciona no celular (iOS/Android) e com teclado (espaço = play/pause).
- Opcional, se sobrar tempo: mini-player fixo no rodapé que continua tocando ao navegar entre páginas (estado num Context no layout raiz).

## 6. Páginas, rotas e publicação

Sete rotas: quatro públicas e três do painel. Páginas públicas são Server Components com `revalidate = 3600`; toda escrita chama `revalidatePath` nas rotas afetadas, então o item novo aparece na hora.

| Rota | Acesso | Conteúdo |
| --- | --- | --- |
| `/` | Público | Capa: nome/dedicatória, último poema em destaque, 3 poemas e 3 músicas mais recentes, links para os catálogos |
| `/poemas` | Público | Lista de poemas (título + primeiros 2 versos + data), mais recentes primeiro |
| `/poemas/[slug]` | Público | Poema completo; links para anterior/próximo |
| `/musicas` | Público | Grade de cards (capa ou placeholder, título, duração) com player em cada card |
| `/entrar` | Público | Login com e-mail e senha (Supabase Auth) |
| `/painel` | Autor | Lista de poemas e músicas com editar/excluir; botões “Novo poema” e “Nova música” |
| `/painel/poema/[id]` e `/painel/musica/[id]` | Autor | Formulário de criação (`id = novo`) ou edição |

**Proteção:** `middleware.ts` renova a sessão do Supabase e redireciona `/painel/*` para `/entrar` sem sessão. As Server Actions conferem a sessão de novo antes de gravar.

**Formulário de poema:** título, `<textarea>` do corpo, pré-visualização ao vivo, checkbox “publicado” (padrão marcado), botão Salvar. Ao salvar: `normalizePoem` → gerar slug → inserir/atualizar → `revalidatePath('/')`, `('/poemas')`, `('/poemas/[slug]')` → redirecionar para o poema publicado.

**Formulário de música:** título, seletor de MP3, seletor de capa opcional com prévia, checkbox “publicado”. Na edição, trocar o MP3 ou a capa apaga o arquivo antigo.

**Gerais:** layout responsivo (mobile first), metadados Open Graph por página (título do poema/música), `robots: noindex` em todo o site por padrão (site pessoal), página 404 no estilo do site.

## 7. Estilo visual

O estilo será passado pelo autor durante a construção, com referências e exemplos. Até lá, o agente monta tudo em cima de **tokens de tema**, para que trocar o visual seja editar um arquivo e não reescrever componentes.

**Regras para o agente:**

- Todas as cores, fontes, tamanhos, espaçamentos, raios e sombras vêm de CSS variables em `app/theme.css` (expostas ao Tailwind via `theme.extend`). Nenhuma cor ou fonte “chumbada” em componente.
- Comece com um tema neutro e elegante (fundo claro quente, texto escuro, uma fonte serifada para poemas e títulos, uma sans para a interface) apenas como ponto de partida.
- Ao receber referências, perguntar o que agradou em cada uma (cor, tipografia, clima, animação) antes de aplicar.
- Animações sutis e respeitando `prefers-reduced-motion`.

**Tokens mínimos:**

```css
:root {
  --color-bg: ;        --color-surface: ;    --color-text: ;
  --color-muted: ;     --color-accent: ;     --color-accent-contrast: ;
  --font-poem: ;       --font-title: ;       --font-ui: ;
  --poem-size: 1.15rem; --stanza-gap: 1.6em; --content-width: 38rem;
  --radius: ;          --shadow: ;
}
```

**Referências do autor** (preencher na hora):

- [ ] Paleta / cores:
- [ ] Fonte dos poemas:
- [ ] Fonte dos títulos e da interface:
- [ ] Sites ou imagens de referência:
- [ ] Nome do site, dedicatória e textos da capa:
- [ ] Detalhes especiais (fundo, ilustrações, animações, modo escuro):

## 8. Deploy, ambiente e ordem de execução

O agente entrega em 6 etapas, cada uma testável antes da próxima; o estilo final entra por último.

**Variáveis de ambiente** (`.env.local` e Vercel → Settings → Environment Variables):

| Variável | Onde pegar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (chave pública) |
| `CRON_SECRET` | String aleatória gerada pelo autor |

Nenhuma chave `service_role` é necessária; não usar.

**Configuração manual no Supabase (autor faz uma vez):**

1. Criar o projeto e rodar `0001_init.sql`.
2. Authentication → Users → “Add user” com o e-mail e senha do autor.
3. Authentication → Providers/Sign In → **desativar “Allow new users to sign up”**.
4. Authentication → URL Configuration → adicionar a URL da Vercel.

**Keep-alive:** rota `app/api/keepalive/route.ts` que confere `Authorization: Bearer ${CRON_SECRET}` e faz `select id from poems limit 1`. Em `vercel.json`: `{"crons":[{"path":"/api/keepalive","schedule":"0 12 */3 * *"}]}` (a cada 3 dias).

**Ordem de execução:**

1. Scaffold Next.js + TypeScript + Tailwind, `theme.css` com tema neutro, clientes Supabase (`lib/supabase/server.ts`, `client.ts`), `middleware.ts`.
2. Migration SQL + login em `/entrar` + painel vazio protegido.
3. Poemas: `normalizePoem`, `<PoemBody>`, formulário com pré-visualização, `/poemas` e `/poemas/[slug]`.
4. Músicas: upload direto ao Storage, formulário, player, `/musicas`.
5. Capa `/`, 404, metadados, keep-alive, deploy na Vercel.
6. Aplicar o estilo com as referências do autor (seção 7).

**Critérios de aceite:**

- [ ] Publicar um poema com 3 estrofes e um verso recuado: aparece em `/poemas` imediatamente, com estrofes e recuo idênticos ao digitado.
- [ ] Colar um poema vindo do Word/WhatsApp (`\r\n`, espaços sobrando) não quebra a formatação.
- [ ] Publicar uma música de 20 MB sem capa: aparece com placeholder e toca no celular.
- [ ] Publicar uma música com capa: capa aparece; excluir a música apaga os 2 arquivos do Storage.
- [ ] Acessar `/painel` deslogado redireciona para `/entrar`; criar conta nova pelo Supabase é bloqueado.
- [ ] Tentar inserir em `poems` com a anon key sem login falha (RLS).
- [ ] Lighthouse mobile ≥ 90 em Performance e Acessibilidade na capa.
- [ ] README explica setup local, variáveis e como publicar.

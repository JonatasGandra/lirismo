-- Lírios para Milly — migration inicial
-- Rodar uma vez no Supabase: SQL Editor → New query → colar → Run.

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
  ('covers', 'covers', true, 5242880,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "autor envia arquivos" on storage.objects
  for insert to authenticated with check (bucket_id in ('audio','covers'));
create policy "autor altera arquivos" on storage.objects
  for update to authenticated using (bucket_id in ('audio','covers'));
create policy "autor apaga arquivos" on storage.objects
  for delete to authenticated using (bucket_id in ('audio','covers'));

-- Adição em relação à especificação: a API de Storage exige permissão de
-- SELECT para apagar um arquivo (remove). Sem esta policy, excluir uma música
-- apagaria a linha mas deixaria o MP3 e a capa órfãos no bucket.
-- A leitura pública dos arquivos continua pela URL pública dos buckets.
create policy "autor lista arquivos" on storage.objects
  for select to authenticated using (bucket_id in ('audio','covers'));

export type Poem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type Song = {
  id: string;
  slug: string;
  title: string;
  audio_path: string;
  cover_path: string | null;
  duration_s: number | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

/** Poema publicado com seu número no catálogo (I = o primeiro publicado; mostrado em romano). */
export type CatalogPoem = Pick<Poem, "id" | "slug" | "title" | "body" | "created_at"> & {
  number: number;
};

/** Música pronta para o player, com as URLs públicas já resolvidas. */
export type PlayableSong = {
  id: string;
  slug: string;
  title: string;
  audioUrl: string;
  coverUrl: string | null;
  duration: number | null;
};

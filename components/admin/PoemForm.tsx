"use client";

import Link from "next/link";
import { startTransition, useActionState, useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { Ornament } from "@/components/lily/Ornament";
import { PoemBody } from "@/components/poems/PoemBody";
import { savePoem, type PoemFormState } from "@/lib/actions/poems";
import { normalizePoem } from "@/lib/poem";

export type EditablePoem = { id: string; title: string; body: string; published: boolean };

/**
 * Formulário de poema: título, <textarea> simples e pré-visualização ao vivo
 * (ao lado no desktop, abaixo no celular), com o mesmo <PoemBody> do site.
 */
export function PoemForm({ poem }: { poem?: EditablePoem }) {
  const [state, dispatch, pending] = useActionState<PoemFormState, FormData>(savePoem, undefined);
  const [title, setTitle] = useState(poem?.title ?? "");
  const [body, setBody] = useState(poem?.body ?? "");
  const deferredBody = useDeferredValue(body);
  // A prévia mostra o texto já normalizado: é exatamente o que será salvo.
  const preview = useMemo(() => normalizePoem(deferredBody), [deferredBody]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return (
    // `action` é a reserva: se o JavaScript da página falhar, o envio vai direto
    // para a Server Action (o poema é salvo do mesmo jeito). Com JavaScript, o
    // onSubmit assume e o campo não é limpo se der erro.
    <form action={dispatch} onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="space-y-7">
        <input type="hidden" name="id" value={poem?.id ?? ""} />

        <div>
          <label htmlFor="poem-title" className="field-label">
            Título
          </label>
          <input
            id="poem-title"
            name="title"
            className="field field--title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="poem-body" className="field-label">
            Poema
          </label>
          <textarea
            id="poem-body"
            name="body"
            className="field field--poem"
            rows={18}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            spellCheck
            lang="pt-BR"
            aria-describedby="poem-hint"
          />
          <ul id="poem-hint" className="field-hint list-inside list-disc space-y-0.5">
            <li>
              Uma quebra de linha = novo <strong>verso</strong>.
            </li>
            <li>
              Uma ou mais linhas em branco = nova <strong>estrofe</strong>.
            </li>
            <li>Espaços no início do verso são preservados (recuo intencional).</li>
          </ul>
        </div>

        <label className="flex items-center gap-3">
          <input type="checkbox" name="published" defaultChecked={poem?.published ?? true} className="checkbox" />
          <span>Publicado</span>
        </label>

        {state?.error ? (
          <p role="alert" className="form-error">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </button>
          <Link href="/painel" className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </div>

      <aside aria-label="Pré-visualização" className="preview-card lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)] lg:self-start lg:overflow-auto">
        <p className="eyebrow">Pré-visualização</p>
        <h2 className="poem-title">{title.trim() || "Sem título"}</h2>
        <Ornament className="my-7 justify-start" />
        {preview ? (
          <PoemBody body={preview} />
        ) : (
          <p className="font-poem text-lg italic text-muted">Os versos aparecem aqui enquanto você escreve.</p>
        )}
      </aside>
    </form>
  );
}

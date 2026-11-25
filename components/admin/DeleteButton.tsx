"use client";

import { useState, useTransition } from "react";

/** Excluir com confirmação em dois cliques (sem janela de diálogo do navegador). */
export function DeleteButton({ action, itemTitle }: { action: () => Promise<void>; itemTitle: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        className="text-button text-button--danger"
        onClick={() => setConfirming(true)}
        aria-label={`Excluir ${itemTitle}`}
      >
        Excluir
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-3" role="group" aria-label={`Confirmar exclusão de ${itemTitle}`}>
      <button
        type="button"
        className="btn-danger"
        disabled={pending}
        autoFocus
        onClick={() =>
          startTransition(async () => {
            await action();
          })
        }
      >
        {pending ? "Excluindo…" : "Confirmar exclusão"}
      </button>
      <button type="button" className="text-button" disabled={pending} onClick={() => setConfirming(false)}>
        Cancelar
      </button>
    </span>
  );
}

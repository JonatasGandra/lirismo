"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { signIn, type SignInState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, dispatch, pending] = useActionState<SignInState, FormData>(signIn, undefined);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return (
    // `action` é a reserva sem JavaScript (o login funciona do mesmo jeito).
    <form action={dispatch} onSubmit={handleSubmit} className="mt-10 space-y-5 text-left">
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

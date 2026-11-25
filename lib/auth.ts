import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Confere a sessão antes de gravar (o middleware já protege as páginas, mas
 * Server Actions podem ser chamadas diretamente). Só existe um usuário, então
 * "autenticado" = autor.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");
  return { supabase, user };
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Painel" };

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="site-header">
        <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
          <Link href="/painel" className="brand-name">
            Painel
          </Link>
          <nav aria-label="Painel" className="flex items-center gap-6">
            <Link href="/" className="nav-link">
              Ver o site
            </Link>
            <form action={signOut}>
              <button type="submit" className="nav-link">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-wide px-4 py-10 sm:px-8 sm:py-14">{children}</main>
    </div>
  );
}

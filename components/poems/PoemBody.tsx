type Props = {
  body: string;
  className?: string;
};

/**
 * Renderiza o poema exatamente como foi digitado (seção 4 da especificação):
 * linha em branco = nova estrofe; quebra de linha = novo verso; espaços no
 * início do verso são mantidos. Sempre como texto, nunca como HTML.
 */
export function PoemBody({ body, className }: Props) {
  const stanzas = body.split(/\n\s*\n/);

  return (
    <div className={["poem", className].filter(Boolean).join(" ")}>
      {stanzas.map((stanza, i) => (
        <p key={i} className="stanza">
          {stanza.split("\n").map((verse, j) => (
            <span key={j} className="verse">
              {verse}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

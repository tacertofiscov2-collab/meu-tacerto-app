/* LISTASIMPLES v1 — lista "clean" do Perfil e do Editar perfil (05/10/2026) */
import { Children } from "react";
import { ChevronRight } from "lucide-react";

/* ===================================================================
   LISTA SIMPLES (05/10/2026) — referencia: app Pierre Finance

   Usada no Perfil e no Editar perfil. Sem cartoes envolvendo os
   grupos: cada item e uma LINHA (icone pequeno cinza, texto, valor em
   cinza a direita e a setinha discreta quando da para tocar),
   separadas por uma risca fina de 1px.

     <SecaoLista titulo="Conta">
       <LinhaLista Icon={User} rotulo="Editar perfil" onClick={...} />
     </SecaoLista>

   A risca so aparece ENTRE linhas que existem: item escondido por
   chave (null/false) nao deixa risca sobrando.
   =================================================================== */

/* Risca fina, comecando no texto (depois do icone), com opacidade baixa */
function Divisor({ comIcone }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        marginLeft: comIcone ? 32 : 0,
        backgroundColor: "var(--border)",
        opacity: 0.55,
      }}
    />
  );
}

export function SecaoLista({ titulo, children, style }) {
  const itens = Children.toArray(children).filter(Boolean);
  if (itens.length === 0) return null;
  return (
    <section style={{ marginTop: 28, ...style }}>
      {titulo && (
        <p
          className="font-semibold uppercase"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 11.5,
            letterSpacing: "0.09em",
            marginBottom: 4,
          }}
        >
          {titulo}
        </p>
      )}
      <div>
        {itens.map((item, i) => (
          <div key={item.key ?? i}>
            {i > 0 && <Divisor comIcone={Boolean(item.props?.Icon)} />}
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

/* Uma linha. Sem onClick = so informacao (sem setinha, nao reage ao
   toque). `cor` pinta o texto (ex.: vermelho do "Sair da conta").
   `semSeta` tira a setinha de uma linha que da para tocar. */
export function LinhaLista({ Icon, rotulo, detalhe, valor, onClick, cor, semSeta = false }) {
  const conteudo = (
    <>
      {Icon && (
        <Icon
          size={18}
          strokeWidth={1.9}
          className="shrink-0"
          style={{ color: cor || "var(--text-tertiary)" }}
        />
      )}
      <span className="flex-1 min-w-0">
        <span className="block font-medium leading-snug" style={{ color: cor || "var(--text)", fontSize: 15 }}>
          {rotulo}
        </span>
        {detalhe && (
          <span className="block" style={{ color: "var(--text-tertiary)", fontSize: 12.5, marginTop: 1 }}>
            {detalhe}
          </span>
        )}
      </span>
      {valor != null && valor !== "" && (
        <span
          className="shrink-0 text-right truncate"
          style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: "55%" }}
        >
          {valor}
        </span>
      )}
      {onClick && !semSeta && (
        <ChevronRight size={16} className="shrink-0" style={{ color: "var(--text-tertiary)", opacity: 0.7 }} />
      )}
    </>
  );
  const estilo = { gap: 14, padding: "13px 0", minHeight: 50 };
  if (!onClick) {
    return (
      <div className="w-full flex items-center text-left" style={estilo}>
        {conteudo}
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} className="toque w-full flex items-center text-left" style={estilo}>
      {conteudo}
    </button>
  );
}

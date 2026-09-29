/* TOPOROLAVEL v2 — prop "simples": setinha sem circulo (telas de entrada: Cadastro) */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

/* ===================================================================
   TOPO DAS TELAS COM ROLAGEM (28/09/2026 — pedido do Fernando)

   - O TITULO rola junto com o conteudo (some ao descer), igual ao
     "Tirar dúvidas" do Dashboard.
   - A SETINHA de voltar fica parada no canto e, enquanto a tela esta
     rolada, fica TRANSPARENTE. Quando a rolagem volta ao topo (o titulo
     de novo ao lado dela), ela volta ao normal.

   COMO USAR: colocar como PRIMEIRO item DENTRO da area que rola
   (ex.: a div .conteudo-rolavel com px-5), no lugar do <header>:

     <div className="conteudo-rolavel hide-scrollbar px-5">
       <TopoRolavel titulo="Histórico de saídas" onVoltar={() => navigate(-1)} />
       ...resto da tela...
     </div>

   v2: nas telas de ENTRADA (Cadastro), a setinha e "simples" — sem o
   circulo em volta, um pouco maior — igual ao Login e ao Onboarding.
   Passe simples. Sem titulo ao lado (titulo=""), so a setinha.

   Se a area que rola NAO tem padding dos lados (ex.: Perfil), passe
   recuo={20}: a setinha e o titulo ganham o mesmo recuo da tela.

   Por dentro: a setinha mora numa faixa "grudenta" (sticky) de altura
   zero, no topo da area que rola; o cabecalho reserva o lugar dela ao
   lado do titulo. O componente acha sozinho quem esta rolando.
   =================================================================== */

export default function TopoRolavel({ titulo, onVoltar, direita = null, recuo = 0, simples = false }) {
  const ancoraRef = useRef(null);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const ancora = ancoraRef.current;
    if (!ancora) return undefined;

    // quem rola: o ancestral mais proximo com rolagem vertical
    let el = ancora.parentElement;
    while (el && el !== document.body) {
      const oy = window.getComputedStyle(el).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      el = el.parentElement;
    }
    const alvo = el && el !== document.body ? el : window;

    const ler = () => {
      const topo = alvo === window ? window.scrollY : alvo.scrollTop;
      setRolou(topo > 8);
    };
    ler();
    alvo.addEventListener("scroll", ler, { passive: true });
    return () => alvo.removeEventListener("scroll", ler);
  }, []);

  return (
    <>
      <div ref={ancoraRef} style={{ position: "sticky", top: 0, height: 0, zIndex: 30 }}>
        <button
          onClick={onVoltar}
          aria-label="Voltar"
          className={`${simples ? "rounded-lg" : "rounded-full"} flex items-center justify-center active:scale-95`}
          style={{
            position: "absolute",
            top: 20,
            left: recuo,
            width: 40,
            height: 40,
            border: simples ? "none" : "1px solid var(--border)",
            backgroundColor: rolou ? "var(--bg)" : "transparent",
            opacity: rolou ? 0.55 : 1,
            transition: "opacity 200ms ease, background-color 200ms ease",
          }}
        >
          <ArrowLeft size={simples ? 22 : 20} strokeWidth={2} style={{ color: "var(--text)" }} />
        </button>
      </div>

      <header
        className="flex items-center"
        style={{ gap: 12, paddingTop: 20, paddingBottom: 8, paddingLeft: recuo, paddingRight: recuo }}
      >
        {/* lugar reservado para a setinha, ao lado do titulo */}
        <span aria-hidden style={{ width: 40, height: 40, flexShrink: 0 }} />
        <h1 className="text-xl font-bold flex-1 min-w-0" style={{ color: "var(--text)" }}>
          {titulo}
        </h1>
        {direita}
      </header>
    </>
  );
}
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * TransicaoTela — desliza a tela ao navegar.
 *
 * Envolve as <Routes /> e aplica uma classe de animação
 * a cada mudança de rota. Sem biblioteca externa: CSS puro.
 *
 * - Avançar (PUSH)  → tela entra deslizando da direita
 * - Voltar (POP)    → tela entra deslizando da esquerda
 */
export default function TransicaoTela({ children }) {
  const location = useLocation();
  const tipoNav = useNavigationType(); // "PUSH" | "POP" | "REPLACE"
  const [classe, setClasse] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    // Não anima o primeiro carregamento do app
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    const nova = tipoNav === "POP" ? "tela-anima-voltar" : "tela-anima-avancar";

    // Reinicia a animação mesmo quando a classe é a mesma
    setClasse("");
    const t = requestAnimationFrame(() => setClasse(nova));
    return () => cancelAnimationFrame(t);
  }, [location.pathname, location.search, tipoNav]);

  return (
    <div
      key={location.pathname + location.search}
      className={classe}
      style={{ height: "100%", willChange: "transform, opacity" }}
    >
      {children}
    </div>
  );
}
import { useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * TransicaoTela â€” desliza a tela ao navegar.
 *
 * Envolve as <Routes /> e aplica uma classe de animaÃ§Ã£o
 * a cada mudanÃ§a de rota. Sem biblioteca externa: CSS puro.
 *
 * - AvanÃ§ar (PUSH)  â†’ tela entra deslizando da direita
 * - Voltar (POP)    â†’ tela entra deslizando da esquerda
 *
 * A chave e a classe mudam SEMPRE no mesmo render. Se a classe
 * entrasse um frame depois, a tela nova apareceria no lugar final
 * e sÃ³ entÃ£o pularia pra trÃ¡s pra animar â€” que era a "vibrada".
 */
/* Estas rotas jÃ¡ tÃªm o prÃ³prio gesto de transiÃ§Ã£o (framer-motion) e
   nÃ£o devem passar pela animaÃ§Ã£o CSS daqui â€” se passassem, as duas
   animaÃ§Ãµes rodariam juntas (uma por cima da outra) e ainda forÃ§ariam
   um remount extra pela troca de key, causando a travadinha geral. */
const ROTAS_DO_TRILHO = new Set(["/dashboard", "/perfil"]);

const ROTAS_COM_VOLTAR_REAL = new Set([
  "/editar-perfil", "/preferencias", "/alterar-senha",
  "/faq", "/sobre", "/termos", "/excluir-conta",
  "/perfil/informacoes-fiscais", "/perfil/resumo",
  "/historico", "/alertas", "/regra-vinte",
]);

const ROTAS_SEM_ANIMACAO_PROPRIA = new Set([
  ...ROTAS_DO_TRILHO,
  ...ROTAS_COM_VOLTAR_REAL,
]);

export default function TransicaoTela({ children }) {
  const location = useLocation();
  const tipoNav = useNavigationType(); // "PUSH" | "POP" | "REPLACE"

  /* Nessas rotas, a chave Ã© sempre a mesma: assim o React nÃ£o
     remonta nada ao trocar de tela, e nenhuma animaÃ§Ã£o daqui Ã©
     disparada â€” quem cuida da transiÃ§Ã£o Ã© o AbasDeslizantes ou o
     TelaComVoltarReal, conforme o caso. */
  const semAnimacaoPropria = ROTAS_SEM_ANIMACAO_PROPRIA.has(location.pathname);
  const chaveAtual = semAnimacaoPropria
    ? "__sem_animacao__"
    : location.pathname + location.search;

  // Estado inicial jÃ¡ com a rota atual: o primeiro carregamento nÃ£o anima.
  const [estado, setEstado] = useState({ chave: chaveAtual, classe: "" });

  // Ajuste de estado durante o render: React refaz o render antes de
  // pintar, entÃ£o chave e classe chegam juntas na tela. Sem frame solto.
  if (estado.chave !== chaveAtual) {
    setEstado({
      chave: chaveAtual,
      classe: tipoNav === "POP" ? "tela-anima-voltar" : "tela-anima-avancar",
    });
  }

  // Terminou de animar: solta a classe (e o willChange junto).
  // A animaÃ§Ã£o usa fill "both", entÃ£o o ponto final Ã© igual ao estado
  // natural do elemento â€” remover nÃ£o muda nada visualmente.
  function aoTerminarAnimacao(e) {
    if (e.target !== e.currentTarget) return;
    setEstado((anterior) => ({ ...anterior, classe: "" }));
  }

  const animando = estado.classe !== "";

  return (
    <div
      key={estado.chave}
      className={estado.classe}
      onAnimationEnd={aoTerminarAnimacao}
      style={{
        height: "100%",
        willChange: animando ? "transform, opacity" : "auto",
      }}
    >
      {children}
    </div>
  );
}




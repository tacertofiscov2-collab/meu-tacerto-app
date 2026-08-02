import { useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * TransicaoTela — desliza a tela ao navegar.
 *
 * Envolve as <Routes /> e aplica uma classe de animação
 * a cada mudança de rota. Sem biblioteca externa: CSS puro.
 *
 * - Avançar (PUSH)  → tela entra deslizando da direita
 * - Voltar (POP)    → tela entra deslizando da esquerda
 *
 * A chave e a classe mudam SEMPRE no mesmo render. Se a classe
 * entrasse um frame depois, a tela nova apareceria no lugar final
 * e só então pularia pra trás pra animar — que era a "vibrada".
 */
/* Estas rotas já têm o próprio gesto de transição (framer-motion) e
   não devem passar pela animação CSS daqui — se passassem, as duas
   animações rodariam juntas (uma por cima da outra) e ainda forçariam
   um remount extra pela troca de key, causando a travadinha geral. */
const ROTAS_DO_TRILHO = new Set(["/dashboard", "/perfil"]);

const ROTAS_COM_VOLTAR_REAL = new Set([
  "/editar-perfil", "/preferencias", "/contas", "/alterar-senha",
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

  /* Nessas rotas, a chave é sempre a mesma: assim o React não
     remonta nada ao trocar de tela, e nenhuma animação daqui é
     disparada — quem cuida da transição é o AbasDeslizantes ou o
     TelaComVoltarReal, conforme o caso. */
  const semAnimacaoPropria = ROTAS_SEM_ANIMACAO_PROPRIA.has(location.pathname);
  const chaveAtual = semAnimacaoPropria
    ? "__sem_animacao__"
    : location.pathname + location.search;

  // Estado inicial já com a rota atual: o primeiro carregamento não anima.
  const [estado, setEstado] = useState({ chave: chaveAtual, classe: "" });

  // Ajuste de estado durante o render: React refaz o render antes de
  // pintar, então chave e classe chegam juntas na tela. Sem frame solto.
  if (estado.chave !== chaveAtual) {
    setEstado({
      chave: chaveAtual,
      classe: tipoNav === "POP" ? "tela-anima-voltar" : "tela-anima-avancar",
    });
  }

  // Terminou de animar: solta a classe (e o willChange junto).
  // A animação usa fill "both", então o ponto final é igual ao estado
  // natural do elemento — remover não muda nada visualmente.
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
import { useEffect, useRef, useState, memo, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useMotionValue, animate, useDragControls } from "framer-motion";

import Dashboard from "@/pages/Dashboard.jsx";
import Perfil from "@/pages/Perfil.jsx";
import BottomNav from "@/components/BottomNav.jsx";
import { TrilhoContext } from "@/components/TrilhoContext.js";

/**
 * AbasDeslizantes — o par Início ↔ Perfil, deslizável com o dedo.
 *
 * As DUAS telas ficam montadas lado a lado num trilho de 200%. O dedo
 * arrasta o trilho de verdade (framer-motion), e ao soltar ele decide
 * se completa a troca ou volta, com física natural.
 *
 * A URL acompanha: ao assentar numa aba, faz replace para /dashboard
 * ou /perfil, então o resto do app (e o botão voltar do navegador)
 * continua funcionando normalmente.
 *
 * Só cuida dessas duas rotas. Todo o resto segue com o SwipeBack.
 */

const ABAS = ["/dashboard", "/perfil"];

/* As telas são memoizadas: quando a URL troca ao fim do gesto, o React
   re-renderiza este componente, e sem o memo as duas telas inteiras
   seriam repintadas — é isso que provoca a tremida no assentamento.
   Como Dashboard e Perfil não recebem props, o memo trava o conteúdo. */
const DashboardMemo = memo(Dashboard);
const PerfilMemo = memo(Perfil);

/* Mola criticamente amortecida: chega no destino e PARA, sem passar do
   ponto e voltar (era isso que dava a sensação de vibração no fim).
   O restDelta baixo evita micro-ajustes visíveis no assentamento. */
const TRANSICAO = {
  type: "spring",
  stiffness: 190,
  damping: 30,
  mass: 1.05,
  restDelta: 0.4,
  restSpeed: 4,
};

export default function AbasDeslizantes() {
  const navigate = useNavigate();
  const location = useLocation();

  const indiceDaRota = Math.max(0, ABAS.indexOf(location.pathname));
  const [indice, setIndice] = useState(indiceDaRota);

  const [largura, setLargura] = useState(
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  /* Começa já na aba da rota atual: abrir /perfil direto não deve
     mostrar o Dashboard e depois pular. */
  const x = useMotionValue(-indiceDaRota * largura);
  const larguraRef = useRef(largura);
  const arrastandoRef = useRef(false);
  const dragControls = useDragControls();
  const indiceRef = useRef(indice);
  indiceRef.current = indice;

  /* Mede a largura só em rotação/resize. NÃO depende do índice: se
     dependesse, cada troca de aba re-executaria o efeito e o x.set()
     cortaria a animação no meio — causando a tremida no assentamento. */
  useEffect(() => {
    function medir() {
      const w = window.innerWidth;
      larguraRef.current = w;
      setLargura(w);
      if (!arrastandoRef.current) {
        x.set(-indiceRef.current * w);
      }
    }
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [x]);

  /* Se a rota mudar POR FORA (rodapé, botão voltar do navegador),
     o trilho acompanha. Quando a mudança veio do próprio arrasto, o
     índice já está certo e nada acontece aqui. */
  useEffect(() => {
    if (arrastandoRef.current) return;
    if (indiceDaRota === indice) return;
    setIndice(indiceDaRota);
    animate(x, -indiceDaRota * larguraRef.current, TRANSICAO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceDaRota]);

  /* Objeto estável: recriar os limites a cada render fazia o
     framer-motion reavaliar a posição e dar micro-solavancos. */
  const restricoes = useMemo(
    () => ({ left: -(ABAS.length - 1) * largura, right: 0 }),
    [largura],
  );

  /* O carrossel A/B do velocímetro tem arrasto próprio. Se o toque
     começa dentro dele, o trilho das abas NÃO deve capturar o gesto —
     senão arrastar o card levava a tela inteira para a outra aba. */
  function talvezIniciarArrasto(e) {
    const alvo = e.target;
    if (alvo && alvo.closest && alvo.closest("[data-carrossel-velocimetro]")) {
      return;
    }
    dragControls.start(e);
  }

  function irPara(novo, velocidade = 0) {
    const destino = Math.max(0, Math.min(ABAS.length - 1, novo));
    setIndice(destino);

    /* A URL só muda QUANDO a animação termina. Trocar a rota no meio do
       movimento fazia o React re-renderizar durante a animação — era
       isso que causava a "piscada" ao soltar o dedo. */
    animate(x, -destino * larguraRef.current, {
      ...TRANSICAO,
      velocity: velocidade,
      onComplete: () => {
        if (ABAS[destino] !== window.location.pathname) {
          navigate(ABAS[destino], { replace: true });
        }
      },
    });
  }

  function aoSoltar(_, info) {
    arrastandoRef.current = false;
    const largura = larguraRef.current;
    const deslocou = info.offset.x;
    const velocidade = info.velocity.x;

    const passouMetade = Math.abs(deslocou) > largura * 0.22;
    const flick = Math.abs(velocidade) > 300;

    if (passouMetade || flick) {
      // Arrastar para a esquerda avança de aba; para a direita, volta.
      irPara(deslocou < 0 ? indice + 1 : indice - 1, velocidade);
    } else {
      irPara(indice, velocidade);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "var(--bg)",
      }}
    >
      <TrilhoContext.Provider value={true}>
      <motion.div
        drag="x"
        dragListener={false}
        dragControls={dragControls}
        onPointerDown={talvezIniciarArrasto}
        dragElastic={0}
        dragMomentum={false}
        dragConstraints={restricoes}
        onDragStart={() => {
          arrastandoRef.current = true;
        }}
        onDragEnd={aoSoltar}
        style={{
          x,
          display: "flex",
          width: `${ABAS.length * 100}%`,
          height: "100%",
          touchAction: "pan-y",
          willChange: "transform",
        }}
      >
        <div
          style={{
            flex: "0 0 50%",
            width: "50%",
            height: "100%",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          <DashboardMemo />
        </div>
        <div
          style={{
            flex: "0 0 50%",
            width: "50%",
            height: "100%",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          <PerfilMemo />
        </div>
      </motion.div>
      </TrilhoContext.Provider>

      {/* Rodapé ÚNICO e fixo: fica parado enquanto as telas deslizam. */}
      <BottomNav ativo={indice === 0 ? "inicio" : "perfil"} />
    </div>
  );
}




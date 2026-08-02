import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useMotionValue, animate, useDragControls } from "framer-motion";

import Dashboard from "@/pages/Dashboard.jsx";
import Perfil from "@/pages/Perfil.jsx";
import { VoltarAnimadoContext } from "@/components/VoltarAnimadoContext.js";

/**
 * TelaComVoltarReal — mostra a tela ANTERIOR de verdade por trás da
 * tela atual, com a mesma física (framer-motion) usada no
 * AbasDeslizantes. Arrastar a partir da borda esquerda revela a tela
 * anterior de verdade; soltar decide se completa a volta ou assenta
 * de novo na tela atual.
 *
 * A tela de trás é decidida pela ORIGEM da navegação:
 *
 *   navigate("/historico", { state: { de: "dashboard" } })
 *   navigate("/preferencias", { state: { de: "perfil" } })
 *
 * Assim, uma tela aberta pelo Dashboard mostra o Dashboard atrás, e a
 * mesma tela aberta pelo Perfil mostra o Perfil. Sem o state, usa o
 * padrão informado em `padrao` (ou o Perfil).
 *
 * A tela anterior só é MONTADA quando o gesto realmente começa (borda
 * arrastada ou botão de voltar apertado) — navegar normalmente, sem
 * arrastar nada, não paga o custo de montar o Dashboard/Perfil inteiro
 * por trás. Antes disso ela ficava sempre montada, o que deixava
 * qualquer troca de tela nessas rotas pesada, não só o gesto em si.
 *
 * Uso:
 *   <TelaComVoltarReal><Preferencias /></TelaComVoltarReal>
 *   <TelaComVoltarReal padrao="dashboard"><Historico /></TelaComVoltarReal>
 */
const EDGE_PX = 24;

const TRANSICAO = {
  type: "spring",
  stiffness: 190,
  damping: 30,
  mass: 1.05,
  restDelta: 0.4,
  restSpeed: 4,
};

/* Ao COMPLETAR a volta (arrastando ou pelo botão), o movimento é mais
   longo e desacelerado — sem isso a tela "sumia de uma vez". */
const TRANSICAO_SAIDA = {
  type: "spring",
  stiffness: 130,
  damping: 26,
  mass: 1.1,
  restDelta: 0.5,
};

export default function TelaComVoltarReal({ children, padrao = "perfil" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);
  const larguraRef = useRef(
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  const dragControls = useDragControls();

  /* Só true enquanto o gesto está de fato acontecendo (arrastando ou
     saindo animado). É isso que decide se a tela anterior é montada. */
  const [revelando, setRevelando] = useState(false);

  /* De onde o usuário veio. O state vence; sem ele, usa o padrão. */
  const origem = location.state?.de || padrao;

  function iniciarNaBorda(e) {
    setRevelando(true);
    dragControls.start(e);
  }

  /* Sair animando: usada pelo gesto E pelo botão de voltar da tela
     filha (via VoltarAnimadoContext). Sem isso, o clique no botão
     trocava a tela de uma vez, sem deslizar. */
  function sairAnimando() {
    setRevelando(true);
    animate(x, larguraRef.current, {
      ...TRANSICAO_SAIDA,
      onComplete: () => navigate(-1),
    });
  }

  function aoSoltar(_, info) {
    const largura = larguraRef.current;
    const deslocou = info.offset.x;
    const velocidade = info.velocity.x;
    const passouMetade = deslocou > largura * 0.3;
    const flick = velocidade > 300;

    if (passouMetade || flick) {
      animate(x, largura, {
        ...TRANSICAO_SAIDA,
        velocity: velocidade,
        onComplete: () => navigate(-1),
      });
    } else {
      /* Voltou pro lugar: o gesto não completou, então desmonta a
         tela anterior de novo assim que o assentamento termina. */
      animate(x, 0, {
        ...TRANSICAO,
        velocity: velocidade,
        onComplete: () => setRevelando(false),
      });
    }
  }

  return (
    <VoltarAnimadoContext.Provider value={sairAnimando}>
    <div style={{ position: "relative", height: "100dvh", overflow: "hidden" }}>
      {/* Tela anterior, parada, revelada pelo arrasto — só existe
          enquanto o gesto está acontecendo. */}
      {revelando && (
        <div style={{ position: "absolute", inset: 0 }}>
          {origem === "dashboard" ? <Dashboard /> : <Perfil />}
        </div>
      )}

      {/* Tela atual, arrastável só a partir da faixa da borda esquerda */}
      <motion.div
        drag="x"
        dragListener={false}
        dragControls={dragControls}
        dragElastic={0}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: larguraRef.current }}
        onDragEnd={aoSoltar}
        style={{
          x,
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--bg)",
          boxShadow: "-10px 0 28px rgba(0,0,0,0.55)",
          willChange: "transform",
        }}
      >
        {children}

        {/* Faixa invisível: só ela inicia o arrasto, o resto da tela
            continua normal (botões, campos, rolagem) */}
        <div
          onPointerDown={iniciarNaBorda}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: EDGE_PX,
            zIndex: 100,
            touchAction: "pan-y",
          }}
        />
      </motion.div>
    </div>
    </VoltarAnimadoContext.Provider>
  );
}
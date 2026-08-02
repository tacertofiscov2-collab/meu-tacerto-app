import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, animate, useDragControls } from "framer-motion";

/**
 * TelaComVoltarReal — mostra a tela ANTERIOR de verdade por trás da
 * tela atual, com a mesma física (framer-motion) usada no
 * AbasDeslizantes. Arrastar a partir da borda esquerda revela a tela
 * anterior de verdade; soltar decide se completa a volta ou assenta
 * de novo na tela atual.
 *
 * Uso: <TelaComVoltarReal anterior={<Perfil />}><EditarPerfil /></TelaComVoltarReal>
 *
 * PILOTO: por enquanto só usado no par Perfil → Editar Perfil.
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

export default function TelaComVoltarReal({ anterior, children }) {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const larguraRef = useRef(
    typeof window !== "undefined" ? window.innerWidth : 390,
  );
  const dragControls = useDragControls();

  function iniciarNaBorda(e) {
    dragControls.start(e);
  }

  function aoSoltar(_, info) {
    const largura = larguraRef.current;
    const deslocou = info.offset.x;
    const velocidade = info.velocity.x;
    const passouMetade = deslocou > largura * 0.3;
    const flick = velocidade > 300;

    if (passouMetade || flick) {
      animate(x, largura, {
        ...TRANSICAO,
        velocity: velocidade,
        onComplete: () => navigate(-1),
      });
    } else {
      animate(x, 0, { ...TRANSICAO, velocity: velocidade });
    }
  }

  return (
    <div style={{ position: "relative", height: "100dvh", overflow: "hidden" }}>
      {/* Tela anterior, parada, revelada pelo arrasto */}
      <div style={{ position: "absolute", inset: 0 }}>{anterior}</div>

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
  );
}
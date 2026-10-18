/* FOLHADEBAIXO v1 — painel que sobe de baixo, no estilo vidro; fecha tocando fora ou arrastando para baixo */
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ===================================================================
   FOLHA DE BAIXO (04/10/2026 — piloto)

   Usada no "Emitir boleto" do card do DAS (FolhaPagarDas). Serve para
   qualquer lista de opcoes que sobe de baixo.

   - Vive num portal (document.body), por cima de tudo: o zIndex 81 fica
     acima do BottomNav (50), entao a folha nunca fica atras da barra.
   - Fecha: tocando no fundo escuro, ou arrastando a folha para baixo
     (mais de 90px, ou um puxao rapido). Arrasto curto volta sozinho.
   - Respeita a "barra de baixo" do iPhone (safe-area) no fim da folha.
   - Enquanto aberta, a tela de tras nao rola (mesma tecnica dos
     paineis do Dashboard).
   - NAO e para folha com campo de texto: para isso existe a tecnica do
     visualViewport (FolhaLancarSaida em Saidas.jsx).
   =================================================================== */

/* Vidro do app (mesmo do painel "Media limite" do Dashboard) */
const VIDRO_FOLHA = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-2) 0%, var(--vidro-brilho-3) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  borderBottom: "none",
  boxShadow: "inset 0 1px 0 0 var(--vidro-topo-medio), 0 -12px 36px var(--vidro-sombra-forte)",
};

/* Arrasto que fecha a folha: mais de 90px, ou um puxao rapido de pelo
   menos 30px (um toque com o dedo tremendo nao fecha). */
const ARRASTO_FECHA_PX = 90;
const PUXAO_FECHA = 500;
const PUXAO_MINIMO_PX = 30;

export default function FolhaDeBaixo({ aberto, onFechar, titulo, children }) {
  /* Trava a rolagem da tela de tras enquanto aberta */
  useEffect(() => {
    if (!aberto) return undefined;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const oh = htmlEl.style.overflow;
    const ob = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";
    return () => {
      htmlEl.style.overflow = oh;
      bodyEl.style.overflow = ob;
    };
  }, [aberto]);

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <motion.div
          key="fundo-folha"
          className="fixed inset-0"
          style={{ zIndex: 80, background: "rgba(0,0,0,0.55)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onFechar}
        />
      )}
      {aberto && (
        <motion.div
          key="folha"
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className="fixed left-0 right-0 bottom-0 mx-auto flex flex-col rounded-t-3xl"
          style={{
            ...VIDRO_FOLHA,
            zIndex: 81,
            maxWidth: 480,
            maxHeight: "88dvh",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "tween", duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(_, info) => {
            const longe = info.offset.y > ARRASTO_FECHA_PX;
            const puxao = info.velocity.y > PUXAO_FECHA && info.offset.y > PUXAO_MINIMO_PX;
            if (longe || puxao) onFechar();
          }}
        >
          {/* pegador: mostra que da para arrastar */}
          <div className="shrink-0 flex justify-center" style={{ paddingTop: 10, paddingBottom: 6 }}>
            <span className="rounded-full" style={{ width: 40, height: 5, backgroundColor: "var(--border)" }} />
          </div>

          {titulo && (
            <p
              className="shrink-0 text-center font-bold"
              style={{ color: "var(--text)", fontSize: 17, padding: "4px 20px 12px" }}
            >
              {titulo}
            </p>
          )}

          <div className="min-h-0 overflow-y-auto hide-scrollbar" style={{ padding: "0 16px" }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

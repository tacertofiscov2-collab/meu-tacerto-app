import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* O par /dashboard ↔ /perfil NÃO é tratado aqui: ele vive no
   componente AbasDeslizantes, com gesto próprio (framer-motion).
   Este arquivo cuida apenas do "arrastar da borda para voltar"
   nas demais telas.

   As rotas que usam TelaComVoltarReal (framer-motion, com o conteúdo
   real da tela anterior por trás) também saem daqui — senão os dois
   mecanismos competem pelo mesmo gesto e a tela "vaza". */
const ROTAS_ABA = {};
const ROTAS_SEM_VOLTAR = new Set([
  "/", "/onboarding", "/dashboard", "/perfil",
  // usam TelaComVoltarReal:
  "/editar-perfil", "/preferencias", "/contas", "/alterar-senha",
]);

const EDGE_PX = 30;
const MIN_DELTA_ATIVAR = 8;

export default function SwipeBack() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    const path = location.pathname;
    const ehAba = Object.prototype.hasOwnProperty.call(ROTAS_ABA, path);
    const podeVoltar = !ROTAS_SEM_VOLTAR.has(path);
    if (!ehAba && !podeVoltar) return;

    let startX = null;
    let startY = null;
    let startTime = 0;
    let tracking = false;
    let ativado = false;
    let cancelado = false;
    let modo = null;

    function prepararArrasto() {
      root.style.willChange = "transform";
      root.style.backgroundColor = "var(--bg)";
      root.style.minHeight = "100dvh";
      /* Sombra na borda: dá a sensação de uma folha deslizando por cima
         em vez de um bloco solto revelando o vazio. */
      root.style.boxShadow = "-10px 0 28px rgba(0,0,0,0.55)";
      document.body.style.backgroundColor = "var(--bg)";
    }

    function limparEstilos() {
      root.style.willChange = "";
      root.style.transform = "";
      root.style.boxShadow = "";
    }

    function voltarSuave() {
      root.style.transition = "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      root.style.transform = "";
      setTimeout(() => {
        root.style.transition = "";
        limparEstilos();
      }, 260);
    }

    function onTouchStart(e) {
      const t = e.touches[0];
      if (!t) return;

      const alvo = e.target;
      if (alvo && alvo.closest && alvo.closest("[data-carrossel-velocimetro]")) {
        cancelado = true;
        tracking = false;
        return;
      }
      cancelado = false;

      if (ehAba) {
        modo = "aba";
      } else if (podeVoltar && t.clientX <= EDGE_PX) {
        modo = "voltar";
      } else {
        tracking = false;
        modo = null;
        return;
      }

      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      tracking = true;
      ativado = false;
    }

    function onTouchMove(e) {
      if (!tracking || cancelado || startX == null) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (!ativado) {
        if (Math.abs(dx) < MIN_DELTA_ATIVAR && Math.abs(dy) < MIN_DELTA_ATIVAR) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking = false;
          return;
        }
        ativado = true;
        root.style.transition = "none";
        prepararArrasto();
      }

      /* Arrasto mais curto: expõe menos área vazia atrás da tela. */
      const limite = window.innerWidth * 0.34;

      if (modo === "voltar") {
        if (dx <= 0) {
          root.style.transform = "";
          return;
        }
        root.style.transform = `translateX(${Math.min(dx, limite)}px)`;
      } else if (modo === "aba") {
        const aba = ROTAS_ABA[path];
        const permitido =
          (aba === "inicio" && dx < 0) || (aba === "perfil" && dx > 0);
        const d = permitido
          ? Math.max(-limite, Math.min(dx, limite))
          : dx * 0.15;
        root.style.transform = `translateX(${d}px)`;
      }
    }

    function onTouchEnd(e) {
      if (!tracking || cancelado || startX == null) {
        startX = null;
        startY = null;
        tracking = false;
        ativado = false;
        modo = null;
        return;
      }
      const t = e.changedTouches[0];
      const dx = t ? t.clientX - startX : 0;
      const dt = Date.now() - startTime;
      const velocidade = Math.abs(dx) / Math.max(1, dt);
      const threshold = window.innerWidth * 0.3;
      const flick = velocidade > 0.45 && Math.abs(dx) > 30;
      const passou = Math.abs(dx) > threshold || flick;

      if (ativado && modo === "voltar" && dx > 0 && passou) {
        root.style.transition = "none";
        root.style.transform = "";
        limparEstilos();
        navigate(-1);
      } else if (ativado && modo === "aba" && passou) {
        const aba = ROTAS_ABA[path];
        if (aba === "inicio" && dx < 0) {
          root.style.transition = "none";
          root.style.transform = "";
          limparEstilos();
          navigate("/perfil");
        } else if (aba === "perfil" && dx > 0) {
          root.style.transition = "none";
          root.style.transform = "";
          limparEstilos();
          navigate("/dashboard");
        } else {
          voltarSuave();
        }
      } else if (ativado) {
        voltarSuave();
      }

      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
      modo = null;
    }

    function onTouchCancel() {
      if (ativado) voltarSuave();
      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
      cancelado = false;
      modo = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
      if (root) {
        root.style.transform = "";
        root.style.transition = "";
        root.style.willChange = "";
        root.style.boxShadow = "";
      }
    };
  }, [location.pathname, navigate]);

  return null;
}
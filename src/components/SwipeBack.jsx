import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * SwipeBack — swipe da borda esquerda pra direita = voltar (navigate(-1)).
 *
 * Comportamento estilo tela inicial do celular:
 * - Gesto começa nos primeiros ~30px da borda esquerda.
 * - Enquanto arrasta, aplica translate no <#root> pra dar sensação de "puxar".
 * - Volta se: soltar passando do meio da tela OU se for gesto rápido (flick).
 * - Se soltar sem atingir o threshold, retorna suavemente à posição original.
 * - Se o gesto começar sobre o carrossel do velocímetro (data-carrossel-velocimetro),
 *   deixa o próprio carrossel tratar. Não interfere.
 * - Desativado em rotas raiz: /dashboard, /perfil, /, /onboarding.
 */
const ROTAS_EXCLUIDAS = new Set([
  "/",
  "/dashboard",
  "/perfil",
  "/onboarding",
]);

const EDGE_PX = 30;
const MIN_DELTA_ATIVAR = 8;

export default function SwipeBack() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (ROTAS_EXCLUIDAS.has(location.pathname)) return;

    const root = document.getElementById("root");
    if (!root) return;

    let startX = null;
    let startY = null;
    let startTime = 0;
    let tracking = false;
    let ativado = false; // eixo confirmado como horizontal
    let cancelado = false; // gesto sobre carrossel do velocímetro

    function resetTransform(comTransicao = true) {
      root.style.transition = comTransicao
        ? "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)"
        : "none";
      root.style.transform = "";
      // limpa a transição após o fim, pra não travar renders futuros
      setTimeout(() => {
        root.style.transition = "";
      }, 300);
    }

    function onTouchStart(e) {
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX > EDGE_PX) {
        tracking = false;
        return;
      }
      // Se o toque começou dentro do carrossel do velocímetro, ignora
      const alvo = e.target;
      if (alvo && alvo.closest && alvo.closest("[data-carrossel-velocimetro]")) {
        cancelado = true;
        tracking = false;
        return;
      }
      cancelado = false;
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
        if (Math.abs(dx) < MIN_DELTA_ATIVAR && Math.abs(dy) < MIN_DELTA_ATIVAR) {
          return;
        }
        // Se o gesto é mais vertical que horizontal, deixa o scroll rolar
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking = false;
          return;
        }
        ativado = true;
        root.style.transition = "none";
      }

      if (dx <= 0) {
        root.style.transform = "";
        return;
      }
      // Aplica translate; leve resistência pra dar sensação natural
      const move = Math.min(dx, window.innerWidth);
      root.style.transform = `translateX(${move}px)`;
    }

    function onTouchEnd(e) {
      if (!tracking || cancelado || startX == null) {
        startX = null;
        startY = null;
        tracking = false;
        ativado = false;
        return;
      }
      const t = e.changedTouches[0];
      const dx = t ? t.clientX - startX : 0;
      const dt = Date.now() - startTime;
      const velocidade = Math.abs(dx) / Math.max(1, dt); // px/ms
      const threshold = window.innerWidth * 0.5;
      const isFlick = velocidade > 0.5 && dx > 30;

      if (ativado && (dx > threshold || isFlick)) {
        // Anima até o fim e volta
        root.style.transition =
          "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        root.style.transform = `translateX(${window.innerWidth}px)`;
        setTimeout(() => {
          root.style.transition = "none";
          root.style.transform = "";
          navigate(-1);
          setTimeout(() => {
            root.style.transition = "";
          }, 50);
        }, 200);
      } else {
        resetTransform(true);
      }

      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
    }

    function onTouchCancel() {
      if (ativado) resetTransform(true);
      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
      cancelado = false;
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
      // Garante que nada fique preso
      if (root) {
        root.style.transform = "";
        root.style.transition = "";
      }
    };
  }, [location.pathname, navigate]);

  return null;
}
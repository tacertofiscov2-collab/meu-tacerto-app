import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * SwipeBack — gestos horizontais globais.
 *
 * 1) /dashboard e /perfil: swipe em QUALQUER ponto da tela.
 *    - esquerda em /dashboard  -> /perfil
 *    - direita  em /perfil     -> /dashboard
 *    Nunca cai em /lancar por swipe.
 *
 * 2) Demais telas internas: swipe da borda esquerda -> voltar (navigate(-1)),
 *    com arrasto acompanhando o dedo, threshold no meio ou flick rápido.
 *
 * 3) Gestos que começam sobre [data-carrossel-velocimetro] são ignorados —
 *    o carrossel trata o próprio swipe.
 */
const ROTAS_ABA = { "/dashboard": "inicio", "/perfil": "perfil" };
const ROTAS_SEM_VOLTAR = new Set(["/", "/onboarding", "/dashboard", "/perfil"]);

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
    let modo = null; // "aba" | "voltar"

    function limparTransform(comTransicao = true) {
      root.style.transition = comTransicao
        ? "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)"
        : "none";
      root.style.transform = "";
      setTimeout(() => {
        root.style.transition = "";
      }, 300);
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
      }

      if (modo === "voltar") {
        if (dx <= 0) {
          root.style.transform = "";
          return;
        }
        root.style.transform = `translateX(${Math.min(dx, window.innerWidth)}px)`;
      } else if (modo === "aba") {
        const aba = ROTAS_ABA[path];
        const permitido =
          (aba === "inicio" && dx < 0) || (aba === "perfil" && dx > 0);
        const d = permitido ? dx : dx * 0.2;
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
      const threshold = window.innerWidth * 0.35;
      const isFlick = velocidade > 0.5 && Math.abs(dx) > 30;
      const passou = Math.abs(dx) > threshold || isFlick;

      if (ativado && modo === "voltar" && dx > 0 && passou) {
        root.style.transition = "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        root.style.transform = `translateX(${window.innerWidth}px)`;
        setTimeout(() => {
          root.style.transition = "none";
          root.style.transform = "";
          navigate(-1);
          setTimeout(() => {
            root.style.transition = "";
          }, 50);
        }, 200);
      } else if (ativado && modo === "aba" && passou) {
        const aba = ROTAS_ABA[path];
        if (aba === "inicio" && dx < 0) {
          limparTransform(false);
          navigate("/perfil");
        } else if (aba === "perfil" && dx > 0) {
          limparTransform(false);
          navigate("/dashboard");
        } else {
          limparTransform(true);
        }
      } else {
        limparTransform(true);
      }

      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
      modo = null;
    }

    function onTouchCancel() {
      if (ativado) limparTransform(true);
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
      }
    };
  }, [location.pathname, navigate]);

  return null;
}
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTransicao } from "./TransicaoTela.jsx";

const ROTAS_ABA = { "/dashboard": "inicio", "/perfil": "perfil" };
const ROTAS_SEM_VOLTAR = new Set(["/", "/onboarding", "/dashboard", "/perfil"]);

const EDGE_PX = 30;
const MIN_DELTA_ATIVAR = 8;

export default function SwipeBack() {
  const location = useLocation();
  const navigate = useNavigate();
  const transicao = useTransicao();

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
    let comCamadas = false; // arrasto com a tela de destino visível

    function prepararArrasto() {
      root.style.willChange = "transform";
      root.style.backgroundColor = "var(--bg)";
      root.style.minHeight = "100dvh";
      document.body.style.backgroundColor = "var(--bg)";
    }

    function limparEstilos() {
      root.style.willChange = "";
      root.style.transform = "";
    }

    function voltarSuave() {
      root.style.transition = "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      root.style.transform = "";
      setTimeout(() => {
        root.style.transition = "";
        limparEstilos();
      }, 260);
    }

    /* Decide para onde o gesto leva, já sabendo a direção do dedo.
       Retorna { loc, lado, ir } ou null. */
    function alvoDoGesto(dx) {
      if (modo === "voltar" && dx > 0) {
        const ant = transicao && transicao.rotaAnterior();
        if (!ant) return null;
        return { loc: ant, lado: "esquerda", ir: () => navigate(-1) };
      }
      if (modo === "aba") {
        const aba = ROTAS_ABA[path];
        if (aba === "inicio" && dx < 0) {
          return {
            loc: { pathname: "/perfil", search: "", hash: "" },
            lado: "direita",
            ir: () => navigate("/perfil"),
          };
        }
        if (aba === "perfil" && dx > 0) {
          return {
            loc: { pathname: "/dashboard", search: "", hash: "" },
            lado: "esquerda",
            ir: () => navigate("/dashboard"),
          };
        }
      }
      return null;
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

      // A borda esquerda tem prioridade: em tela que também é aba,
      // o gesto de voltar ganha do gesto de trocar de aba.
      if (podeVoltar && t.clientX <= EDGE_PX) {
        modo = "voltar";
      } else if (ehAba) {
        modo = "aba";
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
      comCamadas = false;
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

        // Tenta o arrasto com a tela de destino montada atrás.
        // Sem destino conhecido, cai no arrasto simples do #root.
        const alvo = transicao ? alvoDoGesto(dx) : null;
        if (alvo) {
          comCamadas = transicao.iniciar(alvo.loc, alvo.lado, alvo.ir);
        }
        if (!comCamadas) {
          root.style.transition = "none";
          prepararArrasto();
        }
      }

      if (comCamadas) {
        transicao.mover(dx);
        return;
      }

      const limite = window.innerWidth * 0.55;

      if (modo === "voltar") {
        if (dx <= 0) {
          root.style.transform = "";
          return;
        }
        root.style.transform = `translateX(${Math.min(dx, limite)}px)`;
      } else if (modo === "aba") {
        // Sem destino (direção não permitida): resistência, só pra
        // mostrar que o gesto foi percebido mas não leva a lugar nenhum.
        root.style.transform = `translateX(${dx * 0.15}px)`;
      }
    }

    function onTouchEnd(e) {
      if (!tracking || cancelado || startX == null) {
        startX = null;
        startY = null;
        tracking = false;
        ativado = false;
        comCamadas = false;
        modo = null;
        return;
      }
      const t = e.changedTouches[0];
      const dx = t ? t.clientX - startX : 0;
      const dt = Date.now() - startTime;
      const velocidade = Math.abs(dx) / Math.max(1, dt);

      if (comCamadas) {
        // O TransicaoTela decide se completa ou devolve, e navega sozinho.
        transicao.soltar(dx, velocidade);
        startX = null;
        startY = null;
        tracking = false;
        ativado = false;
        comCamadas = false;
        modo = null;
        return;
      }

      if (ativado) voltarSuave();

      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
      modo = null;
    }

    function onTouchCancel() {
      if (comCamadas && transicao) {
        transicao.soltar(0, 0);
      } else if (ativado) {
        voltarSuave();
      }
      startX = null;
      startY = null;
      tracking = false;
      ativado = false;
      cancelado = false;
      comCamadas = false;
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
      }
    };
  }, [location.pathname, navigate, transicao]);

  return null;
}
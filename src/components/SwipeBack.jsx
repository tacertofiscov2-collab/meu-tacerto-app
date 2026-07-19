import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * SwipeBack — habilita gesto de deslizar da borda esquerda para direita
 * como equivalente a "voltar" (navigate(-1)).
 *
 * Regras:
 * - Só ativa se o gesto começar nos primeiros ~30px da borda esquerda.
 * - Delta X mínimo de 50px, e |dx| > |dy| (evita conflito com scroll vertical).
 * - Desativado nas rotas raiz: /dashboard, /perfil, /, /onboarding.
 */
const ROTAS_EXCLUIDAS = new Set([
  "/",
  "/dashboard",
  "/perfil",
  "/onboarding",
]);

const EDGE_PX = 30;
const MIN_DELTA_X = 50;

export default function SwipeBack() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (ROTAS_EXCLUIDAS.has(location.pathname)) return;

    let startX = null;
    let startY = null;
    let tracking = false;

    function onTouchStart(e) {
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX <= EDGE_PX) {
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      } else {
        tracking = false;
      }
    }

    function onTouchEnd(e) {
      if (!tracking || startX == null) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (dx > MIN_DELTA_X && Math.abs(dx) > Math.abs(dy)) {
        navigate(-1);
      }
      startX = null;
      startY = null;
      tracking = false;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [location.pathname, navigate]);

  return null;
}

import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";

/**
 * SplashScreen — tela de abertura do TaCerto!.
 *
 * Minimalista: só o símbolo do app no centro, surgindo e sumindo
 * com fade. Evita o "flash" de tela vazia enquanto o app inicia.
 *
 * Uso, no App.jsx:  <SplashScreen />
 */
export default function SplashScreen({ duracao = 900 }) {
  const [saindo, setSaindo] = useState(false);
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSaindo(true), duracao);
    const t2 = setTimeout(() => setOculta(true), duracao + 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [duracao]);

  if (oculta) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: saindo ? 0 : 1,
        transition: "opacity 400ms ease-out",
        pointerEvents: saindo ? "none" : "auto",
      }}
    >
      <style>{`
        @keyframes splashFade {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        /* Depois de aparecer, fica pulsando devagar — sinaliza que o
           app está carregando, em vez de parecer travado. */
        @keyframes splashPulsa {
          0%, 100% { opacity: 1;    transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.94); }
        }
        .splash-simbolo {
          animation:
            splashFade 500ms ease-out both,
            splashPulsa 1.6s ease-in-out 500ms infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-simbolo { animation: splashFade 1ms both; }
        }
      `}</style>

      <Gauge
        className="splash-simbolo"
        size={78}
        strokeWidth={2.2}
        style={{ color: "var(--primary)" }}
      />
    </div>
  );
}




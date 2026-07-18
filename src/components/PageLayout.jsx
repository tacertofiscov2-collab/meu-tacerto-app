import BottomNav from "./BottomNav.jsx";

/**
 * PageLayout — wrapper canônico das telas internas do TaCerto!.
 *
 * - Aplica cor de fundo e texto padrão.
 * - Reserva padding-bottom fixo para acomodar a navbar (~80px) + 24px de folga.
 * - Renderiza a <BottomNav /> fixa na base.
 *
 * Props:
 * - ativo: chave da navbar (inicio | menu | lancar | historico | perfil).
 * - semNav: quando true, não renderiza a navbar (usado em telas sem barra).
 */
export default function PageLayout({
  children,
  ativo,
  semNav = false,
  className = "",
  style,
}) {
  return (
    <div
      className={`min-h-screen min-h-[100dvh] w-full ${className}`}
      style={{ backgroundColor: "var(--bg)", color: "var(--text)", ...style }}
    >
      <div
        style={{
          paddingBottom: semNav
            ? "env(safe-area-inset-bottom)"
            : "calc(104px + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
      {!semNav && <BottomNav ativo={ativo} />}
    </div>
  );
}

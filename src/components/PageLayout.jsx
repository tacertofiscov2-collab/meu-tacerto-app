import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";

const ROTAS_COM_NAVBAR = ["/dashboard"];

/**
 * PageLayout — wrapper canônico das telas internas do TaCerto!.
 * A navbar (e o padding-bottom pra ela) só aparece em /dashboard.
 */
export default function PageLayout({
  children,
  ativo,
  semNav = false,
  className = "",
  style,
}) {
  const location = useLocation();
  const mostrarNavbar = !semNav && ROTAS_COM_NAVBAR.includes(location.pathname);

  return (
    <div
      className={`min-h-screen min-h-[100dvh] w-full ${className}`}
      style={{ backgroundColor: "var(--bg)", color: "var(--text)", ...style }}
    >
      <div
        style={{
          paddingBottom: mostrarNavbar
            ? "calc(90px + env(safe-area-inset-bottom))"
            : "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </div>
      {!semNav && <BottomNav ativo={ativo} />}
    </div>
  );
}

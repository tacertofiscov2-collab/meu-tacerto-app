import { useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Plus, Receipt, User } from "lucide-react";

/**
 * Navbar inferior compartilhada — usar em TODAS as telas internas.
 *
 * Props:
 * - ativo: "inicio" | "menu" | "lancar" | "historico" | "perfil" | undefined
 */
export default function BottomNav({ ativo }) {
  const navigate = useNavigate();

  const itens = [
    { key: "inicio", label: "Início", Icon: Home, route: "/dashboard" },
    { key: "menu", label: "Menu", Icon: LayoutGrid, route: "/menu" },
    { key: "lancar", label: "Lançar", Icon: Plus, route: "/lancar", center: true },
    { key: "historico", label: "Histórico", Icon: Receipt, route: "/historico" },
    { key: "perfil", label: "Perfil", Icon: User, route: "/perfil" },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        backgroundColor: "rgba(24,24,27,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Curva orgânica no topo — arco simétrico sobre o botão central */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: "-1px",
          left: 0,
          right: 0,
          width: "100%",
          height: "40px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <path
          d="M 0 39 L 168 39 C 184 39 188 8 200 8 C 212 8 216 39 232 39 L 400 39"
          stroke="var(--border)"
          strokeWidth="1"
          fill="none"
          opacity="0.55"
        />
      </svg>
      <div className="max-w-xl mx-auto grid grid-cols-5 px-2 pt-2 pb-2">
        {itens.map(({ key, label, Icon, route, center }) => {
          const ehAtivo = key === ativo;
          const cor = center
            ? "var(--primary)"
            : ehAtivo
            ? "var(--primary)"
            : "var(--text-secondary)";

          return (
            <button
              key={key}
              onClick={() => navigate(route)}
              aria-label={label}
              className="flex flex-col items-center justify-end gap-1 py-1 active:scale-95 transition"
            >
              {center ? (
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--primary)",
                    boxShadow: "0 6px 16px rgba(34,197,94,0.35)",
                  }}
                >
                  <Plus
                    size={26}
                    strokeWidth={2.8}
                    style={{ color: "var(--primary-contrast)" }}
                  />
                </span>
              ) : (
                <span className="w-11 h-11 flex items-center justify-center">
                  <Icon
                    size={26}
                    strokeWidth={ehAtivo ? 2.5 : 2}
                    style={{ color: cor }}
                  />
                </span>
              )}
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: cor }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

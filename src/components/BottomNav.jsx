import { useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Plus, Receipt, User } from "lucide-react";
import { useUserState } from "@/lib/userState";

/**
 * Navbar inferior compartilhada — usar em TODAS as telas internas.
 *
 * Props:
 * - ativo: "inicio" | "menu" | "lancar" | "historico" | "perfil" | undefined
 */
export default function BottomNav({ ativo }) {
  const navigate = useNavigate();
  const { nome } = useUserState();
  // foto de perfil (base64/URL) — se algum dia existir no storage
  const foto =
    typeof window !== "undefined"
      ? localStorage.getItem("tacerto_foto") || null
      : null;
  const inicial =
    nome && nome !== "Usuário" ? String(nome).trim().charAt(0).toUpperCase() : null;

  const itens = [
    { key: "inicio", label: "Início", Icon: Home, route: "/dashboard" },
    { key: "menu", label: "Menu", Icon: LayoutGrid, route: "/menu" },
    { key: "lancar", label: "Lançar", Icon: Plus, route: "/lancar", center: true },
    { key: "historico", label: "Histórico", Icon: Receipt, route: "/historico" },
    { key: "perfil", label: "Perfil", Icon: User, route: "/perfil", avatar: true },
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
      {/* Curva orgânica no topo — reta → Bezier simétrico → reta */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 10"
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
          d="M 0 9.5 L 42 9.5 C 45 9.5 45 1 50 1 C 55 1 55 9.5 58 9.5 L 100 9.5"
          stroke="var(--border)"
          strokeWidth="0.4"
          fill="none"
          opacity="0.55"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative z-10 max-w-xl mx-auto grid grid-cols-5 px-2 pt-2 pb-2">
        {itens.map(({ key, label, Icon, route, center, avatar }) => {
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
              ) : avatar ? (
                <span className="w-11 h-11 flex items-center justify-center">
                  <span
                    className="rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: "var(--field)",
                      border: ehAtivo
                        ? "1.5px solid var(--primary)"
                        : "1.5px solid transparent",
                    }}
                  >
                    {foto ? (
                      <img
                        src={foto}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                    ) : inicial ? (
                      <span
                        className="text-[13px] font-semibold leading-none"
                        style={{ color: "var(--primary)" }}
                      >
                        {inicial}
                      </span>
                    ) : (
                      <User size={16} style={{ color: "var(--text-secondary)" }} />
                    )}
                  </span>
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

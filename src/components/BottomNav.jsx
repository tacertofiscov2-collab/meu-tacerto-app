import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Plus, Receipt, User } from "lucide-react";
import { useUserState } from "@/lib/userState";

const ROTAS_COM_NAVBAR = ["/dashboard", "/menu"];

/**
 * Navbar inferior — barra reta fosca (glass).
 * Visível APENAS em /dashboard e /menu.
 *
 * Props:
 * - ativo: "inicio" | "menu" | "lancar" | "historico" | "perfil" | undefined
 */
export default function BottomNav({ ativo }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { nome, visitante } = useUserState();

  if (!ROTAS_COM_NAVBAR.includes(location.pathname)) return null;


  const foto =
    typeof window !== "undefined"
      ? localStorage.getItem("tacerto_foto_usuario") ||
        localStorage.getItem("tacerto_foto") ||
        null
      : null;
  const inicial =
    !visitante && nome && nome !== "Usuário"
      ? String(nome).trim().charAt(0).toUpperCase()
      : null;

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
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(15, 15, 17, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(63, 63, 70, 0.15)",
        paddingTop: 10,
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingLeft: 16,
        paddingRight: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
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
            className="flex flex-col items-center justify-end gap-1 active:scale-95 transition"
            style={{ background: "none", border: "none", padding: 0 }}
          >
            {center ? (
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus
                  size={26}
                  strokeWidth={2.8}
                  style={{ color: "var(--primary-contrast, #000)" }}
                />
              </span>
            ) : avatar ? (
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "var(--field)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: ehAtivo ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                }}
              >
                {foto ? (
                  <img
                    src={foto}
                    alt=""
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : inicial ? (
                  <span
                    style={{
                      color: "var(--primary)",
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {inicial}
                  </span>
                ) : (
                  <User size={14} style={{ color: "var(--text-secondary)" }} />
                )}
              </span>
            ) : (
              <Icon size={24} strokeWidth={ehAtivo ? 2.5 : 2} style={{ color: cor }} />
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
    </nav>
  );
}

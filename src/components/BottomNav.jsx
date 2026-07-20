import { useNavigate, useLocation } from "react-router-dom";
import { Home, Plus, User } from "lucide-react";
import { useUserState } from "@/lib/userState";

const ROTAS_COM_NAVBAR = ["/dashboard", "/perfil"];

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

  const ICON_SIZE = 32;
  const AVATAR_SIZE = 34;
  const LABEL_SIZE = 13;

  const corTexto = (isAtivo) =>
    isAtivo ? "var(--primary)" : "var(--text-secondary)";

  return (
    <nav
      aria-label="Navegação principal"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--nav-border)",
        paddingTop: 10,
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingLeft: 16,
        paddingRight: 16,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
      }}
    >
      <button
        onClick={() => navigate("/dashboard")}
        aria-label="Início"
        className="flex flex-col items-center gap-1 active:scale-95 transition"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <Home
          size={ICON_SIZE}
          strokeWidth={ativo === "inicio" ? 2.5 : 2}
          style={{ color: corTexto(ativo === "inicio") }}
        />
        <span
          className="font-medium leading-none"
          style={{ color: corTexto(ativo === "inicio"), fontSize: LABEL_SIZE }}
        >
          Início
        </span>
      </button>

      <button
        onClick={() => navigate("/lancar")}
        aria-label="Lançar"
        className="flex flex-col items-center active:scale-95 transition"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus
            size={ICON_SIZE}
            strokeWidth={2.8}
            style={{ color: "var(--primary-contrast)" }}
          />
        </span>
      </button>

      <button
        onClick={() => navigate("/perfil")}
        aria-label="Perfil"
        className="flex flex-col items-center gap-1 active:scale-95 transition"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            backgroundColor: "var(--field)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border:
              ativo === "perfil"
                ? "1.5px solid var(--primary)"
                : "1.5px solid transparent",
          }}
        >
          {foto ? (
            <img
              src={foto}
              alt=""
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : inicial ? (
            <span
              style={{
                color: "var(--primary)",
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {inicial}
            </span>
          ) : (
            <User size={20} style={{ color: corTexto(ativo === "perfil") }} />
          )}
        </span>
        <span
          className="font-medium leading-none"
          style={{ color: corTexto(ativo === "perfil"), fontSize: LABEL_SIZE }}
        >
          Perfil
        </span>
      </button>
    </nav>
  );
}
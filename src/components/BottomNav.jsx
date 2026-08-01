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

  const ICON_SIZE = 26;
  const AVATAR_SIZE = 30;
  const LABEL_SIZE = 11;

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
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(8,8,10,0.88)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "inset 0 1px 0 0 rgba(255,255,255,0.26), inset 0 7px 16px -8px rgba(255,255,255,0.17)",
        paddingTop: 10,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
        paddingLeft: 13,
        paddingRight: 13,
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
            width: 48,
            height: 48,
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
        {foto ? (
          <span
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: "50%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border:
                ativo === "perfil"
                  ? "1.5px solid var(--primary)"
                  : "1.5px solid transparent",
            }}
          >
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
          </span>
        ) : inicial ? (
          <span
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: corTexto(ativo === "perfil"),
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {inicial}
          </span>
        ) : (
          <User
            size={ICON_SIZE}
            strokeWidth={ativo === "perfil" ? 2.5 : 2}
            style={{ color: corTexto(ativo === "perfil") }}
          />
        )}
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
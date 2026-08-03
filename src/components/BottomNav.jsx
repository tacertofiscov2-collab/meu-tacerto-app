import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TrilhoContext } from "./TrilhoContext.js";
import { Home, Plus, User } from "lucide-react";
import { useUserState } from "@/lib/userState";

const ROTAS_COM_NAVBAR = ["/dashboard", "/perfil"];

export default function BottomNav({ ativo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dentroDoTrilho = useContext(TrilhoContext);
  const { nome, visitante } = useUserState();

  /* Dentro do trilho deslizante (AbasDeslizantes), cada tela traria o
     seu próprio rodapé e os dois andariam junto com o arrasto. Nesse
     caso quem desenha o rodapé é o AbasDeslizantes, por fora.
     (Todos os hooks acima desta linha: React exige ordem fixa.) */
  if (dentroDoTrilho) return null;

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
  /* Ilusão de ótica: um círculo cheio (a foto) parece menor que um
     ícone vazado do mesmo tamanho. Por isso a foto ganha alguns px. */
  const FOTO_SIZE = 34;
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
        /* Cores vêm das variáveis --vidro-* do index.css: mudam
           sozinhas entre o tema escuro e o claro. */
        background:
          "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        borderTop: "1px solid var(--vidro-borda)",
        boxShadow:
          "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco)",
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
        className="flex flex-col items-center gap-1 transition"
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
        className="flex flex-col items-center transition"
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
        className="flex flex-col items-center gap-1 transition"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        {foto ? (
          <span
            style={{
              /* box-sizing: sem ele a borda somava ao tamanho e a foto
                 era espremida, ficando menor que o círculo da inicial.
                 O marginTop negativo compensa os px extras da foto,
                 mantendo o rótulo "Perfil" alinhado com o "Início". */
              marginTop: -(FOTO_SIZE - AVATAR_SIZE),
              width: FOTO_SIZE,
              height: FOTO_SIZE,
              boxSizing: "border-box",
              borderRadius: "50%",
              overflow: "hidden",
              display: "block",
              flexShrink: 0,
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
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
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
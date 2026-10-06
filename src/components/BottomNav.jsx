/* BOTTOMNAV v5 — "simples": a casinha (e o Perfil) nao ficam verdes na pagina atual; cinza sempre, so o + e verde (v4: "simples": + maior (56), no meio da altura da barra e no centro exato da tela (3 colunas iguais); botoes sem contorno de foco (o Safari podia desenhar um anel em volta da casinha) (v3: visual "simples" (Inicio F): o "+" sem circulo, so o + verde e maior, alinhado com os icones (v2: prop visual: "vidro" (padrao) | "linha" (lisa com risca fina, + em contorno) | "solta" (lisa sem risca, + verde cheio) | "lisa" (sem risca, + em contorno) — variacoes do Inicio */
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TrilhoContext } from "./TrilhoContext.js";
import { Home, Plus, User } from "lucide-react";

const ROTAS_COM_NAVBAR = ["/dashboard", "/perfil"];

/* v2: visuais lisos (sem vidro) para as variacoes do Inicio */
const FUNDO_LISO = { background: "var(--bg)", backdropFilter: "none", WebkitBackdropFilter: "none", boxShadow: "none" };
const RISCA = "1px solid color-mix(in srgb, var(--border) 55%, transparent)";

/* v4: nenhum anel/contorno em volta dos botoes ao tocar (foco do
   navegador). Pedido do Fernando: "tira o circulo verde da casinha". */
const SEM_CONTORNO = { outline: "none", boxShadow: "none", WebkitTapHighlightColor: "transparent" };

export default function BottomNav({ ativo, visual = "vidro" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dentroDoTrilho = useContext(TrilhoContext);

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

  const ICON_SIZE = 26;
  const AVATAR_SIZE = 30;
  /* Ilusão de ótica: um círculo cheio (a foto) parece menor que um
     ícone vazado do mesmo tamanho. Por isso a foto ganha alguns px. */
  const FOTO_SIZE = 34;
  const LABEL_SIZE = 11;
  /* v3: tamanho do "+" sem circulo (visual "simples"). v4: 40 -> 56 */
  const PLUS_SIMPLES_SIZE = 56;
  /* v4: altura de Inicio/Perfil (icone + espaco + rotulo). O "+" ocupa
     essa mesma altura e fica centrado nela: no meio da barra. */
  const ALTURA_ITEM = ICON_SIZE + 4 + LABEL_SIZE;
  /* v4: no "simples", 3 colunas iguais: o "+" fica no centro exato */
  const COLUNA = visual === "simples" ? { flex: "1 1 0" } : null;

  /* v5: no "simples" nada fica destacado na pagina atual (pedido do
     Fernando: a casinha verde no Inicio era o "contorno verde") */
  const semDestaque = visual === "simples";
  const corTexto = (isAtivo) =>
    isAtivo && !semDestaque ? "var(--primary)" : "var(--text-secondary)";
  const espessura = (isAtivo) => (isAtivo && !semDestaque ? 2.5 : 2);

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
        /* v2: visuais lisos por cima do vidro */
        ...(visual !== "vidro" ? FUNDO_LISO : null),
        ...(visual === "linha" ? { borderTop: RISCA } : null),
        ...(visual === "solta" || visual === "lisa" || visual === "simples" ? { borderTop: "none" } : null),
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
        style={{ background: "none", border: "none", padding: 0, ...SEM_CONTORNO, ...COLUNA }}
      >
        <Home
          size={ICON_SIZE}
          strokeWidth={espessura(ativo === "inicio")}
          style={{ color: corTexto(ativo === "inicio") }}
        />
        <span
          className="font-medium leading-none"
          style={{ color: corTexto(ativo === "inicio"), fontSize: LABEL_SIZE }}
        >
          Início
        </span>
      </button>

      {/* v3: "simples" = so o + verde, sem circulo, maior.
          v4: o botao tem a altura de Inicio/Perfil e o + (maior que ela)
          fica centrado: no meio da barra, nem colado no topo nem embaixo. */}
      {visual === "simples" ? (
      <button
        onClick={() => navigate("/lancar")}
        aria-label="Lançar"
        className="flex items-center justify-center transition"
        style={{ background: "none", border: "none", padding: 0, height: ALTURA_ITEM, overflow: "visible", ...SEM_CONTORNO, ...COLUNA }}
      >
        <Plus size={PLUS_SIMPLES_SIZE} strokeWidth={1.9} style={{ color: "var(--primary)", flexShrink: 0 }} />
      </button>
      ) : (
      <button
        onClick={() => navigate("/lancar")}
        aria-label="Lançar"
        className="flex flex-col items-center transition"
        style={{ background: "none", border: "none", padding: 0, ...SEM_CONTORNO }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            /* v2: "+" em contorno nos visuais linha e lisa */
            backgroundColor: visual === "linha" || visual === "lisa" ? "transparent" : "var(--primary)",
            border: visual === "linha" || visual === "lisa" ? "1.5px solid var(--primary)" : "none",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus
            size={ICON_SIZE}
            strokeWidth={2.8}
            style={{ color: visual === "linha" || visual === "lisa" ? "var(--primary)" : "var(--primary-contrast)" }}
          />
        </span>
      </button>
      )}

      <button
        onClick={() => navigate("/perfil")}
        aria-label="Perfil"
        className="flex flex-col items-center gap-1 transition"
        style={{ background: "none", border: "none", padding: 0, ...SEM_CONTORNO, ...COLUNA }}
      >
        {foto ? (
          <span
            style={{
              /* box-sizing: sem ele a borda somava ao tamanho e a foto
                 era espremida, ficando menor que o ícone. O marginTop
                 negativo compensa os px extras da foto, mantendo o
                 rótulo "Perfil" alinhado com o "Início". */
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
        ) : (
          /* Sem foto: o boneco simples, no mesmo tamanho da casinha e
             sem círculo em volta (antes aqui aparecia a inicial do nome). */
          <User
            size={ICON_SIZE}
            strokeWidth={espessura(ativo === "perfil")}
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
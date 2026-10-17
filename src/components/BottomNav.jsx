/* BOTTOMNAV v6 — rodape com 5 itens: Inicio | Notas | ( + ) | Isa | Mais. 5 colunas iguais (o "+" no centro exato, maior, como acao e nao aba); igual em todas as abas; aba atual so com o icone/rotulo mais claro (sem verde); troca de aba so pelo toque (Bloco 3 da tarefa final do piloto) (v5: "simples": a casinha (e o Perfil) nao ficam verdes na pagina atual; cinza sempre, so o + e verde (v4: "simples": + maior (56), no meio da altura da barra e no centro exato da tela (3 colunas iguais); botoes sem contorno de foco (v3: visual "simples" (Inicio F): o "+" sem circulo (v2: prop visual: "vidro" (padrao) | "linha" | "solta" | "lisa")))) */
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TrilhoContext } from "./TrilhoContext.js";
import { Home, Plus, FileText, MessageCircle, Menu } from "lucide-react";

/* ===================================================================
   RODAPE DAS ABAS (16/10/2026 — tarefa final do piloto, Bloco 3)

   Inicio | Notas | ( + ) | Isa | Mais

   - As 4 abas tem endereco proprio: /dashboard, /notas, /isa e /mais
     (/perfil continua abrindo o Mais). O "+" abre o /lancar (acao).
   - O rodape e o MESMO em todas as abas: mesmas pecas, mesma altura,
     nada aparece e some. A aba atual so fica com o icone e o rotulo
     mais claros (menos cor: verde so no "+").
   - Troca de aba SO pelo toque (sem deslizar de lado, padrao dos apps).
     Saindo do Inicio a troca entra no historico (o "voltar" do iPhone
     volta para o Inicio); entre as outras abas ela substitui, para o
     voltar nao ficar pulando de aba em aba.
   - ALTURA_RODAPE: quanto o rodape ocupa (sem a area do gesto do
     iPhone). Telas com rodape somam isto no espaco de baixo.
   =================================================================== */

export const ABAS = {
  inicio: "/dashboard",
  notas: "/notas",
  isa: "/isa",
  mais: "/mais",
};
const ROTAS_COM_NAVBAR = ["/dashboard", "/notas", "/isa", "/mais", "/perfil"];

/* qual aba esta acesa em cada endereco */
const ABA_DA_ROTA = {
  "/dashboard": "inicio", "/notas": "notas", "/isa": "isa", "/mais": "mais", "/perfil": "mais",
};

const ICON_SIZE = 26;
const LABEL_SIZE = 11;
/* altura de um item (icone + espaco + rotulo); o "+" fica centrado nela */
const ALTURA_ITEM = ICON_SIZE + 4 + LABEL_SIZE;
const PADDING_TOPO = 10;
const PADDING_BAIXO = 18;
export const ALTURA_RODAPE = PADDING_TOPO + ALTURA_ITEM + PADDING_BAIXO;
/* "+" maior que os outros itens (acao principal) */
const PLUS_CIRCULO = 52;
const PLUS_SIMPLES_SIZE = 56;

/* v2: visuais lisos (sem vidro) para as variacoes do Inicio */
const FUNDO_LISO = { background: "var(--bg)", backdropFilter: "none", WebkitBackdropFilter: "none", boxShadow: "none" };
const RISCA = "1px solid color-mix(in srgb, var(--border) 55%, transparent)";

/* v4: nenhum anel/contorno em volta dos botoes ao tocar (foco do navegador) */
const SEM_CONTORNO = { outline: "none", boxShadow: "none", WebkitTapHighlightColor: "transparent" };
const COLUNA = { flex: "1 1 0", minWidth: 0 };

function ItemAba({ Icon, rotulo, ativo, onClick, alvo }) {
  const cor = ativo ? "var(--text)" : "var(--text-secondary)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      aria-current={ativo ? "page" : undefined}
      data-alvo={alvo}
      className="flex flex-col items-center gap-1 transition"
      style={{ background: "none", border: "none", padding: 0, ...SEM_CONTORNO, ...COLUNA }}
    >
      <Icon size={ICON_SIZE} strokeWidth={ativo ? 2.4 : 2} style={{ color: cor }} />
      <span className="font-medium leading-none" style={{ color: cor, fontSize: LABEL_SIZE }}>
        {rotulo}
      </span>
    </button>
  );
}

/* exemplo: o MESMO rodape desenhado dentro do celular de exemplo do
   tutorial e da Apresentacao da Isa (sem ficar preso no pe da tela,
   sem navegar e com data-alvo para o circulo verde do tutorial) */
export default function BottomNav({ ativo, visual = "vidro", exemplo = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dentroDoTrilho = useContext(TrilhoContext);

  /* Dentro do trilho deslizante antigo (AbasDeslizantes, desligado)
     quem desenha o rodape e ele. (Hooks acima desta linha.) */
  if (dentroDoTrilho && !exemplo) return null;
  if (!exemplo && !ROTAS_COM_NAVBAR.includes(location.pathname)) return null;

  const abaAtual = ativo && ABAS[ativo] ? ativo : ABA_DA_ROTA[location.pathname];

  function irPara(aba) {
    const destino = ABAS[aba];
    if (exemplo) return;
    if (location.pathname === destino) return;
    navigate(destino, { replace: location.pathname !== ABAS.inicio });
  }

  const plusEmContorno = visual === "linha" || visual === "lisa";

  return (
    <nav
      aria-label="Navegação principal"
      aria-hidden={exemplo || undefined}
      style={{
        ...(exemplo ? { position: "relative", flexShrink: 0 } : { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }),
        /* Cores das variaveis --vidro-* do index.css (tema escuro e claro) */
        background:
          "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        borderTop: "1px solid var(--vidro-borda)",
        boxShadow:
          "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco)",
        ...(visual !== "vidro" ? FUNDO_LISO : null),
        ...(visual === "linha" ? { borderTop: RISCA } : null),
        ...(visual === "solta" || visual === "lisa" || visual === "simples" ? { borderTop: "none" } : null),
        paddingTop: PADDING_TOPO,
        paddingBottom: exemplo ? PADDING_BAIXO : `calc(env(safe-area-inset-bottom, 0px) + ${PADDING_BAIXO}px)`,
        paddingLeft: 6,
        paddingRight: 6,
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <ItemAba Icon={Home} rotulo="Início" ativo={abaAtual === "inicio"} onClick={() => irPara("inicio")} alvo="inicio" />
      <ItemAba Icon={FileText} rotulo="Notas" ativo={abaAtual === "notas"} onClick={() => irPara("notas")} alvo="notas" />

      {/* "+": acao (nao e aba), no centro exato, maior; centrado na
          altura dos itens (sobra um pouco para cima e para baixo) */}
      <button
        type="button"
        onClick={() => !exemplo && navigate("/lancar")}
        aria-label="Lançar"
        className="flex items-center justify-center transition"
        style={{ background: "none", border: "none", padding: 0, height: ALTURA_ITEM, overflow: "visible", ...SEM_CONTORNO, ...COLUNA }}
      >
        {visual === "simples" ? (
          <Plus data-alvo="mais" size={PLUS_SIMPLES_SIZE} strokeWidth={1.9} style={{ color: "var(--primary)", flexShrink: 0 }} />
        ) : (
          <span
            data-alvo="mais"
            style={{
              width: PLUS_CIRCULO,
              height: PLUS_CIRCULO,
              flexShrink: 0,
              borderRadius: "50%",
              backgroundColor: plusEmContorno ? "transparent" : "var(--primary)",
              border: plusEmContorno ? "1.5px solid var(--primary)" : "none",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus
              size={28}
              strokeWidth={2.8}
              style={{ color: plusEmContorno ? "var(--primary)" : "var(--primary-contrast)" }}
            />
          </span>
        )}
      </button>

      <ItemAba Icon={MessageCircle} rotulo="Isa" ativo={abaAtual === "isa"} onClick={() => irPara("isa")} alvo="isa" />
      <ItemAba Icon={Menu} rotulo="Mais" ativo={abaAtual === "mais"} onClick={() => irPara("mais")} alvo="menu" />
    </nav>
  );
}

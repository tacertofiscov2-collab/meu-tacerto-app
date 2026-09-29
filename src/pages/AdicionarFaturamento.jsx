/* ADICIONARFATURAMENTO v2 — agora "Adicionar movimentações": conectar banco + lancar entrada/saida + as formas de antes */
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  FileUp,
  ClipboardPaste,
  ChevronRight,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";

/* ===================================================================
   ADICIONAR MOVIMENTAÇÕES (antes "Adicionar faturamento") — 28/09/2026

   O nome mudou porque a tela passou a cobrir ENTRADAS e SAIDAS (e o
   banco traz as duas). O caminho continua /adicionar-faturamento, para
   nada quebrar.

   OPCOES, na ordem:
     1. Conectar banco (Open Finance) — em destaque: entradas e saidas
        chegam sozinhas
     2. Lançar entrada  -> Historico de entradas
     3. Lançar saída    -> Historico de saidas
     4. Digitar o total, 5. Enviar extrato, 6. Colar texto (como antes)

   Topo que rola (TopoRolavel): com 6 opcoes, em celular pequeno a tela
   pode rolar; o titulo sobe e a setinha fica.
   =================================================================== */

function OpcaoCard({ Icon, titulo, descricao, onClick, destaque = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="toque toque-escala card-tacerto w-full flex items-start gap-3 rounded-2xl text-left"
      style={{
        paddingLeft: 14,
        paddingRight: 12,
        paddingTop: 12,
        paddingBottom: 12,
        ...(destaque
          ? { backgroundColor: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.5)" }
          : {}),
      }}
    >
      <Icon
        size={20}
        strokeWidth={1.9}
        style={{ color: "var(--primary)" }}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold leading-tight"
          style={{ color: "var(--text)", fontSize: 14.5 }}
        >
          {titulo}
        </p>
        <p
          className="leading-snug"
          style={{ color: "var(--text-secondary)", fontSize: 11.5, marginTop: 3 }}
        >
          {descricao}
        </p>
      </div>
      <ChevronRight
        size={16}
        style={{ color: "var(--text-tertiary)" }}
        className="shrink-0"
      />
    </button>
  );
}

export default function AdicionarFaturamento() {
  const navigate = useNavigate();

  const opcoes = [
    {
      Icon: Landmark,
      titulo: "Conectar banco",
      descricao: "Pelo Open Finance. As entradas e as saídas chegam sozinhas.",
      onClick: () => navigate("/conectar-banco"),
      destaque: true,
    },
    {
      Icon: ArrowDownLeft,
      titulo: "Lançar entrada",
      descricao: "Uma por uma, direto no Histórico de entradas.",
      onClick: () => navigate("/historico"),
    },
    {
      Icon: ArrowUpRight,
      titulo: "Lançar saída",
      descricao: "O que foi pago em dinheiro ou fora do banco.",
      onClick: () => navigate("/saidas"),
    },
    {
      Icon: Pencil,
      titulo: "Digitar o total",
      descricao: "Já sabe quanto faturou este ano? Digite o valor e pronto.",
      onClick: () => navigate("/adicionar-faturamento/digitar"),
    },
    {
      Icon: FileUp,
      titulo: "Enviar extrato bancário",
      descricao: "PDFs, fotos ou OFX/CSV. A IA lê e soma as entradas.",
      onClick: () => navigate("/adicionar-faturamento/enviar"),
    },
    {
      Icon: ClipboardPaste,
      titulo: "Colar texto do extrato",
      descricao: "Copie o texto do extrato e cole aqui. A IA identifica.",
      onClick: () => navigate("/adicionar-faturamento/colar"),
    },
  ];

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{
          fontSize: 16,
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        <TopoRolavel titulo="Adicionar movimentações" onVoltar={() => navigate(-1)} />

        <p
          className="leading-relaxed"
          style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 6, marginBottom: 16 }}
        >
          Traga o que já entrou e saiu este ano.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opcoes.map((op) => (
            <OpcaoCard key={op.titulo} {...op} />
          ))}
        </div>

        <p
          className="leading-relaxed text-center"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 10.5,
            paddingLeft: 8,
            paddingRight: 8,
            marginTop: 24,
          }}
        >
          O TaCerto! é seu assistente fiscal. As informações servem pra alimentar
          seu velocímetro. Não substituímos seu contador.
        </p>
      </div>
    </div>
  );
}
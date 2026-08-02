import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Info,
  Pencil,
  FileUp,
  Plus,
  ClipboardPaste,
  ChevronRight,
} from "lucide-react";

function OpcaoCard({ Icon, titulo, descricao, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="toque toque-escala w-full flex items-start gap-3 rounded-2xl text-left"
      style={{
        paddingLeft: 14,
        paddingRight: 12,
        paddingTop: 11,
        paddingBottom: 11,
        backgroundColor: "var(--surface-raised)",
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
      Icon: Plus,
      titulo: "Somar valores",
      descricao: "Entrada por entrada, direto pelo Histórico.",
      onClick: () => navigate("/historico"),
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
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="toque toque-escala w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1
          className="text-lg font-bold flex-1 text-center pr-10"
          style={{ color: "var(--text)" }}
        >
          Adicionar faturamento
        </h1>
      </header>

      {/* Bloco de tamanho fixo: não escala com a preferência de fonte,
          então cabe tudo sem rolagem nos 3 tamanhos. */}
      <div
        className="flex-1 min-h-0 flex flex-col px-5 overflow-hidden"
        style={{
          fontSize: 16,
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <p
          className="leading-snug shrink-0"
          style={{ color: "var(--text-secondary)", fontSize: 12.5 }}
        >
          Começou a usar o app no meio do ano? Registre aqui o que já faturou
          antes. Você tem 4 formas de fazer isso:
        </p>

        <div
          className="flex items-start gap-2 rounded-xl shrink-0"
          style={{
            marginTop: 10,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 9,
            paddingBottom: 9,
            backgroundColor: "var(--field)",
          }}
        >
          <Info
            size={14}
            style={{ color: "var(--primary)" }}
            className="shrink-0"
          />
          <p
            className="leading-snug"
            style={{ color: "var(--text-secondary)", fontSize: 11 }}
          >
            Registre todo tipo de receita — dinheiro, Pix, cartão, transferência.
            Não importa se emitiu nota fiscal ou não.
          </p>
        </div>

        <div
          className="shrink-0"
          style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}
        >
          {opcoes.map((op) => (
            <OpcaoCard key={op.titulo} {...op} />
          ))}
        </div>

        {/* Respiro elástico empurra o disclaimer pra base */}
        <div className="flex-1 min-h-0" aria-hidden />

        <p
          className="leading-relaxed text-center shrink-0"
          style={{
            color: "var(--text-tertiary)",
            fontSize: 10.5,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          O TaCerto! é seu assistente fiscal. As informações servem pra alimentar
          seu velocímetro. Não substituímos seu contador.
        </p>
      </div>
    </div>
  );
}


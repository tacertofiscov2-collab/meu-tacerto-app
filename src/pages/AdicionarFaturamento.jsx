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
      className="w-full flex items-start gap-3 py-4 text-left active:opacity-70"
    >
      <Icon
        size={22}
        strokeWidth={1.75}
        style={{ color: "var(--primary)" }}
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[16px] leading-tight" style={{ color: "var(--text)" }}>
          {titulo}
        </p>
        <p
          className="text-[13px] mt-1 leading-snug"
          style={{ color: "var(--text-secondary)" }}
        >
          {descricao}
        </p>
      </div>
      <ChevronRight
        size={18}
        style={{ color: "var(--text-secondary)" }}
        className="shrink-0 mt-1"
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
      descricao:
        "Você já sabe quanto faturou este ano? Digite o valor total e pronto.",
      onClick: () => navigate("/adicionar-faturamento/digitar"),
    },
    {
      Icon: FileUp,
      titulo: "Enviar extrato bancário",
      descricao:
        "Envie PDFs, fotos ou arquivos OFX/CSV. Nossa IA lê e soma automaticamente as entradas.",
      onClick: () => navigate("/adicionar-faturamento/enviar"),
    },
    {
      Icon: Plus,
      titulo: "Somar valores",
      descricao:
        "Prefere adicionar entrada por entrada? Faça direto pelo Histórico com o botão 'Fazer novo lançamento'.",
      onClick: () => navigate("/historico"),
    },
    {
      Icon: ClipboardPaste,
      titulo: "Colar texto do extrato",
      descricao:
        "Copie o texto do seu extrato bancário e cole aqui. Nossa IA identifica as entradas automaticamente.",
      onClick: () => navigate("/adicionar-faturamento/colar"),
    },
  ];

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ backgroundColor: "var(--field)" }}
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

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <p
          className="text-sm leading-relaxed mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Se você começou a usar o app no meio do ano, use esta tela pra
          registrar o que já faturou antes. Você tem 4 formas de fazer isso:
        </p>

        <div
          className="mt-4 flex items-start gap-2 rounded-xl px-3 py-3"
          style={{ backgroundColor: "var(--field)" }}
        >
          <Info
            size={16}
            style={{ color: "var(--primary)" }}
            className="shrink-0 mt-0.5"
          />
          <p
            className="text-[12px] leading-snug"
            style={{ color: "var(--text-secondary)" }}
          >
            Registre todo tipo de receita — dinheiro, Pix, cartão, transferência.
            Não importa se você emitiu nota fiscal ou não.
          </p>
        </div>

        <div className="mt-4">
          {opcoes.map((op, i) => (
            <div key={op.titulo}>
              {i > 0 && (
                <div
                  style={{
                    marginLeft: 34,
                    borderTop: "1px solid var(--border)",
                    opacity: 0.3,
                  }}
                />
              )}
              <OpcaoCard {...op} />
            </div>
          ))}
        </div>

        <p
          className="text-[11px] leading-relaxed text-center mt-8"
          style={{ color: "var(--text-secondary)" }}
        >
          O TaCerto! é seu assistente fiscal. Todas as informações servem
          apenas pra alimentar seu velocímetro. Não substituímos seu contador.
        </p>
      </div>
    </div>
  );
}

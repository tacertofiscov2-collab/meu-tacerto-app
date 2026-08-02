import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  LIMITES_ANUAIS, limiteAte20Percent, excedenteAcimaDoLimite, vocab,
} from "@/lib/fiscal";

export default function RegraVinte() {
  const navigate = useNavigate();
  const { tipoMEI, faturamentoAtual, limiteAtual } = useAppState();

  const v = vocab(tipoMEI);
  const excedente = excedenteAcimaDoLimite(faturamentoAtual, limiteAtual);
  const tetoDos20 = limiteAte20Percent(tipoMEI);
  const passouDos20 = excedente && !excedente.dentroDos20;
  const cor = passouDos20 ? "#dc2626" : "#ef4444";
  const anoAtual = new Date().getFullYear();
  const pctExcesso = excedente ? Math.round(excedente.percentualExcesso) : 0;

  const passos = passouDos20
    ? [
        {
          titulo: "Procure um contador agora",
          texto: `Como você passou de ${pctExcesso}% do limite, o desenquadramento é retroativo a 1º de janeiro de ${anoAtual}. Um contador vai recalcular seus impostos do ano como Microempresa.`,
        },
        {
          titulo: "Faça o desenquadramento no Portal do Simples",
          texto: "O pedido é feito pelo próprio empreendedor, no Portal do Simples Nacional. O contador te ajuda a escolher o motivo correto.",
        },
        {
          titulo: "Separe uma reserva",
          texto: "Vão existir guias de impostos do ano inteiro, com multa e juros. Quanto antes regularizar, menor o acúmulo.",
        },
        {
          titulo: `Continue registrando ${v.receitaPlural}`,
          texto: "Mesmo desenquadrado, manter o controle facilita muito a vida do contador e evita pagar imposto a mais.",
        },
      ]
    : [
        {
          titulo: `Você continua MEI até 31 de dezembro de ${anoAtual}`,
          texto: "Passar do limite não te tira do MEI na hora. Você segue pagando o DAS normalmente até o fim do ano.",
        },
        {
          titulo: "Em janeiro, você vira Microempresa",
          texto: `A partir de 1º de janeiro de ${anoAtual + 1} sua empresa passa a ser ME automaticamente. Vale procurar um contador antes disso pra se organizar.`,
        },
        {
          titulo: "Vai ter um DAS complementar",
          texto: "Na declaração anual (DASN-SIMEI), o sistema gera uma guia extra sobre o valor que passou do limite. É pago uma vez só.",
        },
        {
          titulo: "Cuidado pra não passar dos 20%",
          texto: `Se o total do ano passar de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(tetoDos20)}, a regra muda completamente: o desenquadramento vira retroativo, com multa e juros.`,
        },
      ];

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="toque toque-escala w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Passou do limite
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        {/* Faixa de destaque */}
        <div
          className="rounded-3xl px-5 py-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(150deg, ${cor}26 0%, ${cor}0d 55%, transparent 100%), var(--surface)`,
            border: `1px solid ${cor}3d`,
          }}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="rounded-2xl flex items-center justify-center shrink-0"
              style={{
                width: 52,
                height: 52,
                backgroundColor: `${cor}22`,
              }}
            >
              <AlertTriangle size={26} strokeWidth={2.2} style={{ color: cor }} />
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-bold uppercase mb-1"
                style={{ color: cor, letterSpacing: "0.08em" }}
              >
                {passouDos20 ? "Situação crítica" : "Dentro da margem legal"}
              </p>
              <p
                className="text-[15px] font-semibold leading-snug"
                style={{ color: "var(--text)" }}
              >
                {passouDos20
                  ? `Passei ${pctExcesso}% do limite anual.`
                  : "Passei do limite, mas ainda dentro dos 20% que a lei permite."}
              </p>
            </div>
          </div>
        </div>

        {/* Situação em números */}
        <div
          className="rounded-2xl px-4 py-3.5 mt-2.5"
          style={{
            backgroundColor: `${cor}14`,
            border: `1px solid ${cor}44`,
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase mb-2.5"
            style={{ color: cor, letterSpacing: "0.06em" }}
          >
            Como estou hoje
          </p>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Faturei
            </span>
            <Valor tamanho="md" autoAjustar>{faturamentoAtual}</Valor>
          </div>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Meu limite
            </span>
            <Valor tamanho="md" autoAjustar>{limiteAtual}</Valor>
          </div>
          <div
            className="flex items-baseline justify-between gap-3 pt-2"
            style={{ borderTop: `1px solid ${cor}33` }}
          >
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Passei
            </span>
            <Valor tamanho="md" autoAjustar cor={cor}>
              {excedente?.valor || 0}
            </Valor>
          </div>
        </div>

        {/* Explicação da régua */}
        <div
          className="rounded-2xl px-4 py-3.5 mt-2.5"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <p
            className="text-[11px] font-semibold uppercase mb-2"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
          >
            Como a lei enxerga
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span
                className="rounded-full shrink-0 mt-1.5"
                style={{ width: 8, height: 8, backgroundColor: "#ef4444" }}
              />
              <p className="text-[13px] leading-snug" style={{ color: "var(--text)" }}>
                Até <Valor tamanho="sm">{tetoDos20}</Valor> (20% acima): continua MEI até
                dezembro e paga uma guia complementar.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span
                className="rounded-full shrink-0 mt-1.5"
                style={{ width: 8, height: 8, backgroundColor: "#dc2626" }}
              />
              <p className="text-[13px] leading-snug" style={{ color: "var(--text)" }}>
                Acima disso: deixa de ser MEI desde janeiro deste ano, com recálculo de
                impostos, multa e juros.
              </p>
            </div>
          </div>
        </div>

        {/* Passos */}
        <p
          className="text-[12px] font-semibold uppercase mt-6 mb-2"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          O que fazer agora
        </p>

        <div className="space-y-2">
          {passos.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl px-4 py-3.5 flex gap-3"
              style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
            >
              <span
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-semibold leading-snug"
                  style={{ color: "var(--text)" }}
                >
                  {p.titulo}
                </p>
                <p
                  className="text-[13px] leading-relaxed mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {p.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-[11px] leading-relaxed text-center mt-4 px-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          O TaCerto! é parceiro do seu contador, não substituto. As informações acima são
          baseadas no que você registrou no app e servem como orientação geral.
        </p>
      </div>
    </div>
  );
}


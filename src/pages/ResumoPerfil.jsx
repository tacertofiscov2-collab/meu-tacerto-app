import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";

import { useAppState } from "@/context/AppStateContext";
import {
  faixaDoVelocimetro, FAIXA_INFO, calcularFaltamOuExcedeu,
} from "@/lib/fiscal";

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function Bloco({ label, children, cor }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex-1 min-w-0"
      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
    >
      <p className="text-[11px]" style={{ color: cor || "var(--text-tertiary)" }}>
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function ResumoPerfil() {
  const navigate = useNavigate();
  const {
    lancamentos, faturamentoAtual, limiteAtual, percentualAtual,
    faturamentoDoMes, mediaMensal, projecaoFimDoAno,
  } = useAppState();

  const anoCorrente = new Date().getFullYear();

  const totalLancamentos = useMemo(
    () => lancamentos.filter((l) => new Date(l.data).getFullYear() === anoCorrente).length,
    [lancamentos, anoCorrente],
  );

  const restante = calcularFaltamOuExcedeu(faturamentoAtual, limiteAtual);
  const corFaixa = FAIXA_INFO[faixaDoVelocimetro(percentualAtual)].cor;

  const dadosMensais = useMemo(() => {
    const arr = [];
    for (let m = 1; m <= 12; m++) {
      arr.push({ mes: MESES_ABREV[m - 1], valor: faturamentoDoMes(m, anoCorrente) });
    }
    return arr;
  }, [faturamentoDoMes, anoCorrente]);

  const maxMes = Math.max(1, ...dadosMensais.map((d) => d.valor));
  const mesAtualIdx = new Date().getMonth() + 1;

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="toque toque-escala w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Resumo de {anoCorrente}
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <p
          className="text-[12px] font-semibold uppercase mt-3 mb-2"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Este ano
        </p>

        <div className="flex gap-2.5">
          <Bloco label="Faturado">
            <Valor tamanho="lg" autoAjustar>{faturamentoAtual}</Valor>
          </Bloco>
          <Bloco label="Limite">
            <Valor tamanho="lg" autoAjustar>{limiteAtual}</Valor>
          </Bloco>
        </div>

        <div className="flex gap-2.5 mt-2.5">
          <Bloco
            label={restante.tipo === "excedeu" ? "Excedeu" : "Faltam"}
            cor={restante.tipo === "excedeu" ? "var(--danger)" : undefined}
          >
            <Valor
              tamanho="md"
              autoAjustar
              cor={restante.tipo === "excedeu" ? "var(--danger)" : undefined}
            >
              {restante.valor}
            </Valor>
          </Bloco>
          <Bloco label="Lançamentos">
            <p className="text-[1rem] font-semibold" style={{ color: "var(--text)" }}>
              {totalLancamentos}
            </p>
          </Bloco>
        </div>

        <p
          className="text-[12px] font-semibold uppercase mt-4 mb-2"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Meu ritmo
        </p>

        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: "var(--primary)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Com base nos meses lançados
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Média por mês
            </span>
            <Valor tamanho="md" autoAjustar>{mediaMensal}</Valor>
          </div>
          <div
            className="flex items-baseline justify-between gap-3 pt-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Fecha o ano em
            </span>
            <Valor tamanho="md" autoAjustar cor={corFaixa}>{projecaoFimDoAno}</Valor>
          </div>
        </div>

        <p
          className="text-[12px] font-semibold uppercase mt-4 mb-2"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          Por mês
        </p>

        <div
          className="rounded-2xl px-3 pt-3 pb-3"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <div
            className="flex items-end justify-between gap-1"
            style={{ height: 132 }}
            role="img"
            aria-label="Faturamento mês a mês"
          >
            {dadosMensais.map((d, i) => {
              const altura = d.valor > 0 ? (d.valor / maxMes) * 108 : 0;
              const isFuturo = i + 1 > mesAtualIdx;
              const cor = isFuturo
                ? "var(--border)"
                : d.valor > 0
                  ? "var(--primary)"
                  : "var(--surface)";
              return (
                <div
                  key={d.mes}
                  className="flex-1 flex flex-col items-center justify-end gap-1.5"
                  style={{ minWidth: 0 }}
                >
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: Math.max(altura, d.valor > 0 ? 4 : 3),
                      backgroundColor: cor,
                      opacity: isFuturo ? 0.35 : 1,
                      transition: "height 400ms ease-out",
                    }}
                  />
                  <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                    {d.mes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav ativo="perfil" />
    </div>
  );
}


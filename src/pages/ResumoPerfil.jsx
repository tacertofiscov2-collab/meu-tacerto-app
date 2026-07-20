import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { SectionTitle } from "../components/FlatList.jsx";

import { useAppState } from "@/context/AppStateContext";
import {
  faixaDoVelocimetro,
  FAIXA_INFO,
  calcularFaltamOuExcedeu,
} from "@/lib/fiscal";

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function ResumoPerfil() {
  const navigate = useNavigate();
  const {
    lancamentos,
    faturamentoAtual,
    limiteAtual,
    percentualAtual,
    faturamentoDoMes,
  } = useAppState();

  const anoCorrente = new Date().getFullYear();

  // Conta TODOS os lançamentos do ano corrente (feitos em /lancar + Adicionar faturamento)
  const totalLancamentos = useMemo(
    () =>
      lancamentos.filter(
        (l) => new Date(l.data).getFullYear() === anoCorrente,
      ).length,
    [lancamentos, anoCorrente],
  );

  const restante = calcularFaltamOuExcedeu(faturamentoAtual, limiteAtual);
  const faixa = faixaDoVelocimetro(percentualAtual);
  const corFaixa = FAIXA_INFO[faixa].cor;

  // Faturamento por mês (Jan → Dez do ano corrente)
  const dadosMensais = useMemo(() => {
    const arr = [];
    for (let m = 1; m <= 12; m++) {
      arr.push({
        mes: MESES_ABREV[m - 1],
        valor: faturamentoDoMes(m, anoCorrente),
      });
    }
    return arr;
  }, [faturamentoDoMes, anoCorrente]);

  const maxMes = Math.max(1, ...dadosMensais.map((d) => d.valor));

  const percFmt = Math.round(percentualAtual);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
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
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Resumo de {anoCorrente}
          </h1>
        </header>

        <div className="px-5">
          {/* Bloco superior — flat estilo Pierre */}
          <SectionTitle className="mt-2">Este ano</SectionTitle>

          {/* Faturado + % lado a lado */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Faturado
              </p>
              <div className="mt-1">
                <Valor tamanho="lg" autoAjustar>
                  {faturamentoAtual}
                </Valor>
              </div>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Do limite
              </p>
              <p
                className="mt-1 font-bold"
                style={{ color: corFaixa, fontSize: "1.5rem", lineHeight: 1.1 }}
              >
                {percFmt}%
              </p>
            </div>
          </div>

          {/* Limite + Faltam/Excedeu */}
          <div className="grid grid-cols-2 gap-4 pt-5">
            <div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Limite
              </p>
              <div className="mt-1">
                <Valor tamanho="md" autoAjustar>{limiteAtual}</Valor>
              </div>
            </div>
            <div>
              <p
                className="text-xs"
                style={{
                  color:
                    restante.tipo === "excedeu"
                      ? "#ef4444"
                      : "var(--text-secondary)",
                }}
              >
                {restante.tipo === "excedeu" ? "Excedeu" : "Faltam"}
              </p>
              <div className="mt-1">
                <Valor
                  tamanho="md"
                  autoAjustar
                  cor={restante.tipo === "excedeu" ? "#ef4444" : undefined}
                >
                  {restante.valor}
                </Valor>
              </div>
            </div>
          </div>

          {/* Total de lançamentos — discreto */}
          <div className="pt-5">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Total de lançamentos no ano
            </p>
            <p className="mt-1 text-lg font-bold" style={{ color: "var(--text)" }}>
              {totalLancamentos}
            </p>
          </div>

          {/* Gráfico de barras por mês */}
          <SectionTitle className="mt-8">Por mês</SectionTitle>

          <div
            className="pt-3"
            style={{
              borderTop: "1px solid var(--border)",
              opacity: 1,
            }}
          >
            <div
              className="flex items-end justify-between gap-1"
              style={{ height: 160 }}
              role="img"
              aria-label="Faturamento mês a mês"
            >
              {dadosMensais.map((d) => {
                const altura = d.valor > 0 ? (d.valor / maxMes) * 140 : 0;
                const mesAtualIdx = new Date().getMonth() + 1;
                const idxMes = MESES_ABREV.indexOf(d.mes) + 1;
                const isFuturo = idxMes > mesAtualIdx;
                const cor = isFuturo
                  ? "var(--border)"
                  : d.valor > 0
                    ? "var(--primary)"
                    : "var(--field)";
                return (
                  <div
                    key={d.mes}
                    className="flex-1 flex flex-col items-center justify-end gap-1.5"
                    style={{ minWidth: 0 }}
                  >
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: Math.max(altura, d.valor > 0 ? 4 : 2),
                        backgroundColor: cor,
                        opacity: isFuturo ? 0.4 : 1,
                        transition: "height 400ms ease-out",
                      }}
                      title={
                        d.valor > 0
                          ? `${d.mes}: R$ ${d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : `${d.mes}: sem lançamentos`
                      }
                    />
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {d.mes}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BottomNav ativo="perfil" />
    </div>
  );
}
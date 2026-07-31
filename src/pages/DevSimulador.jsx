import { useNavigate } from "react-router-dom";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import Valor from "../components/Valor.jsx";
import {
  LIMITES_ANUAIS,
  LABEL_TIPO,
  calcularPercentual,
  faixaDoVelocimetro,
  FAIXA_INFO,
} from "@/lib/fiscal";

const PRESETS = [
  { label: "0% — Zerado", pct: 0 },
  { label: "30% — Tranquilo", pct: 30 },
  { label: "60% — Fique de olho", pct: 60 },
  { label: "80% — Atenção", pct: 80 },
  { label: "95% — Perto do limite", pct: 95 },
  { label: "110% — Estourou (dentro dos 20%)", pct: 110 },
  { label: "125% — Crítico (retroativo)", pct: 125 },
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DevSimulador() {
  const navigate = useNavigate();
  const {
    tipoMEI: tipo,
    faturamentoAtual: faturado,
    limiteAtual: limite,
    mesAnoAbertura,
    modoSimulacao,
    lancamentos,
    setTipoMEI,
    setFaturamentoSimulado,
    setMesAnoAbertura,
    setModoSimulacao,
    removerTodosLancamentos,
  } = useAppState();
  const mesAbertura = mesAnoAbertura?.mes ?? null;
  const anoAbertura = mesAnoAbertura?.ano ?? null;
  const anoAtual = new Date().getFullYear();

  const percentual = calcularPercentual(faturado, limite);
  const chave = faixaDoVelocimetro(percentual);
  const faixa = FAIXA_INFO[chave];

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };
  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  function aplicarPreset(pct) {
    setFaturamentoSimulado(Math.round((limite * pct) / 100));
  }


  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div style={{ paddingBottom: "calc(130px + env(safe-area-inset-bottom))" }}>
        <header className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Voltar para o Dashboard"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </button>
          <div className="flex items-center gap-2">
            <FlaskConical size={20} style={{ color: "var(--primary)" }} />
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Modo de teste — Simulador de Cenários
            </h1>
          </div>
        </header>

        <div className="px-5 space-y-4">
          <div
            className="rounded-2xl p-4 text-sm leading-relaxed"
            style={{
              backgroundColor: "rgba(245,158,11,0.10)",
              border: "1px solid rgba(245,158,11,0.35)",
              color: "#fbbf24",
            }}
          >
            Esta tela é apenas para testes. Os valores aqui alteram o faturamento
            exibido em todo o app.
          </div>

          {/* Tipo de MEI */}
          <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Tipo de MEI
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["MEI", "MEI_CAMINHONEIRO"].map((t) => {
                const sel = tipo === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTipoMEI(t)}
                    className="py-2.5 rounded-xl text-sm font-semibold"
                    style={{
                      backgroundColor: sel ? "var(--primary)" : "var(--field)",
                      color: sel ? "var(--primary-contrast)" : "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {LABEL_TIPO[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Faturamento */}
          <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
            <label className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Faturamento atual do ano (R$)
            </label>
            <input
              type="number"
              min="0"
              value={faturado}
              onChange={(e) => setFaturamentoSimulado(Number(e.target.value) || 0)}
              className="w-full px-4 py-4 rounded-xl text-2xl font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            />
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Modo simulação
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {modoSimulacao ? "ON — usando valor acima" : "OFF — somando lançamentos reais"}
                </p>
              </div>
              <button
                onClick={() => setModoSimulacao(!modoSimulacao)}
                aria-pressed={modoSimulacao}
                className="relative w-12 h-7 rounded-full transition-colors"
                style={{
                  backgroundColor: modoSimulacao ? "var(--primary)" : "var(--border)",
                }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all"
                  style={{ left: modoSimulacao ? "22px" : "2px" }}
                />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.pct}
                  onClick={() => aplicarPreset(p.pct)}
                  className="py-2.5 rounded-xl text-sm font-medium text-left px-4"
                  style={{
                    backgroundColor: "var(--field)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Abertura MEI */}
          <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Abertura do MEI (para limite proporcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={mesAbertura ?? ""}
                onChange={(e) =>
                  setMesAnoAbertura(
                    e.target.value ? Number(e.target.value) : null,
                    e.target.value ? (anoAbertura ?? anoAtual) : null,
                  )
                }
                className="w-full px-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={fieldStyle}
              >
                <option value="">Mês (opcional)</option>
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>{`${i + 1} — ${m}`}</option>
                ))}
              </select>
              <input
                type="number"
                min="2000"
                max={anoAtual}
                value={anoAbertura ?? ""}
                placeholder="Ano"
                onChange={(e) =>
                  setMesAnoAbertura(
                    mesAbertura,
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full px-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={fieldStyle}
              />
            </div>
            <button
              onClick={() => setMesAnoAbertura(null, null)}
              className="text-xs underline"
              style={{ color: "var(--text-secondary)" }}
            >
              Limpar abertura (usar limite cheio)
            </button>
          </div>

          {/* Resumo em tempo real */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ ...cardStyle, borderLeft: `4px solid ${faixa.cor}` }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Resumo em tempo real
            </p>
            <Linha rotulo="Tipo" valor={LABEL_TIPO[tipo]} />
            <Linha rotulo="Limite anual aplicado" valor={<Valor tamanho="sm">{limite}</Valor>} />
            <Linha rotulo="Limite cheio" valor={<Valor tamanho="sm">{LIMITES_ANUAIS[tipo]}</Valor>} />
            <Linha rotulo="Faturado" valor={<Valor tamanho="sm">{faturado}</Valor>} />
            <Linha rotulo="%" valor={`${percentual.toFixed(1)}%`} />
            <Linha rotulo="Faixa" valor={faixa.label} cor={faixa.cor} />
            <p className="text-sm leading-relaxed pt-1" style={{ color: "var(--text)" }}>
              {faixa.mensagem}
            </p>
          </div>

          {/* Ações destrutivas */}
          <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Dados
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {lancamentos.length} lançamento(s) registrado(s).
            </p>
            <button
              onClick={() => {
                if (confirm("Apagar todos os lançamentos? Esta ação não pode ser desfeita.")) {
                  removerTodosLancamentos();
                }
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#ef4444",
              }}
            >
              Limpar todos os lançamentos (teste)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor, cor }) {
  return (
    <div className="flex justify-between text-sm gap-3">
      <span style={{ color: "var(--text-secondary)" }}>{rotulo}</span>
      <span className="font-semibold text-right" style={{ color: cor || "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}


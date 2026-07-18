import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Valor from "./Valor.jsx";
import { useUserState } from "@/lib/userState";
import { faixaDoVelocimetro, FAIXA_INFO, calcularPercentual } from "@/lib/fiscal";

// Mocks provisórios — mesmos valores usados anteriormente no Menu.
const INSS_MEI = 75.9;
const INSS_MEI_CAMINHONEIRO = 182.16;
const ICMS = 1.0;
const ISS = 5.0;

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export function CalculadoraDAS() {
  const { tipo } = useUserState();
  const [uf, setUf] = useState("SP");
  const [tipoAtividade, setTipoAtividade] = useState("comercio");

  const inss = tipo === "MEI_CAMINHONEIRO" ? INSS_MEI_CAMINHONEIRO : INSS_MEI;
  const imposto = tipoAtividade === "servicos" ? ISS : ICMS;
  const total = inss + imposto;

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs" style={{ color: "var(--text-secondary)" }}>Estado (UF)</label>
        <select
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          style={fieldStyle}
        >
          {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs" style={{ color: "var(--text-secondary)" }}>Atividade principal</label>
        <select
          value={tipoAtividade}
          onChange={(e) => setTipoAtividade(e.target.value)}
          className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
          style={fieldStyle}
        >
          <option value="comercio">Comércio/Indústria (ICMS)</option>
          <option value="servicos">Serviços (ISS)</option>
        </select>
      </div>

      <div className="pt-2 space-y-2">
        <div className="flex justify-between text-sm items-center">
          <span style={{ color: "var(--text-secondary)" }}>INSS</span>
          <Valor tamanho="sm" decimais={2}>{inss}</Valor>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span style={{ color: "var(--text-secondary)" }}>
            {tipoAtividade === "servicos" ? "ISS" : "ICMS"}
          </span>
          <Valor tamanho="sm" decimais={2}>{imposto}</Valor>
        </div>
        <div
          className="flex justify-between items-center pt-3 mt-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="font-bold" style={{ color: "var(--text)" }}>Total DAS</span>
          <Valor tamanho="md" decimais={2}>{total}</Valor>
        </div>
      </div>

      <div
        className="flex items-start gap-2 pt-3 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
        <span>Valores estimados. Consulte gov.br/mei para o boleto oficial.</span>
      </div>
    </div>
  );
}

export function GuiaPagamento() {
  const passos = [
    "Acesse gov.br/mei e faça login com sua conta gov.br.",
    "No menu, escolha 'Já sou MEI' e depois 'Pagamento de contribuição mensal (DAS)'.",
    "Selecione o ano e clique em 'Emitir guia de pagamento (DAS)'.",
    "Pague o boleto até o dia 20 pelo internet banking, PIX ou lotérica.",
  ];
  return (
    <ol className="space-y-4">
      {passos.map((p, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: "var(--field)", color: "var(--primary)" }}
          >
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {p}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CalendarioFiscal() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>DAS</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Contribuição mensal</p>
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
          Todo dia 20
        </span>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", opacity: 0.3 }} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
            DASN — Declaração Anual
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Obrigatória para todo MEI
          </p>
        </div>
        <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>
          31 de maio
        </span>
      </div>
    </div>
  );
}

export function SimuladorDesenquadramento() {
  const { faturado, limite } = useUserState();
  const restante = limite - faturado;

  const mesAtual1a12 = new Date().getMonth() + 1;
  const mesesRestantes = Math.max(1, 12 - mesAtual1a12 + 1);
  const mesesDecorridos = Math.max(1, mesAtual1a12);
  const podeFaturarPorMes = restante / mesesRestantes;
  const estourouAnual = restante <= 0;

  const mediaMensal = faturado / mesesDecorridos;
  const projecaoAnual = mediaMensal * 12;

  const percentualProjetado = calcularPercentual(projecaoAnual, limite);
  const chaveProjecao = faixaDoVelocimetro(percentualProjetado);
  const faixaProjecao = FAIXA_INFO[chaveProjecao];
  const projecaoEstoura = projecaoAnual > limite;

  const percentualAtual = calcularPercentual(faturado, limite);
  const faixaAtual = FAIXA_INFO[faixaDoVelocimetro(percentualAtual)];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Limite anual</p>
          <div className="mt-1"><Valor tamanho="sm">{limite}</Valor></div>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Faturado</p>
          <div className="mt-1"><Valor tamanho="sm">{faturado}</Valor></div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", opacity: 0.3 }} />

      {estourouAnual ? (
        <div>
          <p className="text-sm font-bold" style={{ color: faixaAtual.cor }}>
            Você já ultrapassou o limite anual
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {faixaAtual.mensagem}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Quanto você pode faturar por mês, sem estourar
          </p>
          <div className="mt-1"><Valor tamanho="xl">{podeFaturarPorMes}</Valor></div>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Considerando {mesesRestantes}{" "}
            {mesesRestantes === 1 ? "mês restante" : "meses restantes"} até dezembro.
          </p>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", opacity: 0.3 }} />

      <div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Se mantiver o ritmo atual, projeção anual:
        </p>
        <div className="mt-1"><Valor tamanho="xl">{projecaoAnual}</Valor></div>
        {projecaoEstoura && (
          <div className="flex items-start gap-2 mt-2">
            <AlertTriangle
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: faixaProjecao.cor }}
            />
            <p className="text-xs leading-relaxed" style={{ color: faixaProjecao.cor }}>
              Nesse ritmo, você deve encerrar o ano em {Math.round(percentualProjetado)}% do
              limite — {faixaProjecao.label.toLowerCase()}.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed pt-1" style={{ color: "var(--text-secondary)" }}>
        Simulação com base no que você registrou no app. Não substitui análise contábil.
      </p>
    </div>
  );
}

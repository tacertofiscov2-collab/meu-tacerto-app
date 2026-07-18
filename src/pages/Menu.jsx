import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bell, HelpCircle, Calculator, FileText, Calendar, TrendingUp,
  ChevronDown, ChevronRight, AlertTriangle, BarChart3, MessageCircle,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

import BottomNav from "../components/BottomNav.jsx";
import { useUserState } from "@/lib/userState";
import { LIMITES_ANUAIS, faixaDoVelocimetro, FAIXA_INFO, calcularPercentual } from "@/lib/fiscal";

// TODO: tabela oficial atualizada
const INSS_MEI = 75.90;             // mock 5% s/ salário mínimo
const INSS_MEI_CAMINHONEIRO = 182.16; // mock 12% s/ salário mínimo
const ICMS = 1.00;
const ISS = 5.00;

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const fmtBRL = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBRL0 = (v) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function Atalho({ Icon, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-3 flex flex-col items-start gap-2 transition-transform active:scale-[0.99] text-left"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "var(--field)" }}
      >
        <Icon size={20} style={{ color: "var(--primary)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
          {label}
        </p>
        {sub && (
          <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "var(--text-secondary)" }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}

function AccordionItem({ Icon, titulo, aberto, onToggle, children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={onToggle}
        aria-expanded={aberto}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:opacity-90"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--field)" }}
        >
          <Icon size={18} style={{ color: "var(--primary)" }} />
        </div>
        <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
          {titulo}
        </span>
        <ChevronDown
          size={20}
          style={{
            color: "var(--text-secondary)",
            transform: aberto ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {aberto && (
        <div
          className="px-4 pb-4 pt-1 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function CalculadoraDAS() {
  const { tipo } = useUserState();
  const [uf, setUf] = useState("SP");
  const [tipoAtividade, setTipoAtividade] = useState("comercio"); // comercio(ICMS) | servicos(ISS)

  const inss = tipo === "MEI_CAMINHONEIRO" ? INSS_MEI_CAMINHONEIRO : INSS_MEI;
  const imposto = tipoAtividade === "servicos" ? ISS : ICMS;
  const total = inss + imposto;

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="space-y-3 pt-2">
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

      <div
        className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
      >
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
          className="flex justify-between items-center pt-2 mt-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="font-bold" style={{ color: "var(--text)" }}>Total DAS</span>
          <Valor tamanho="md" decimais={2}>{total}</Valor>
        </div>
      </div>

      <div
        className="flex items-start gap-2 rounded-xl p-3 text-xs"
        style={{
          backgroundColor: "var(--field)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}
      >
        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
        <span>Valores estimados. Consulte gov.br/mei para o boleto oficial.</span>
      </div>
    </div>
  );
}

function GuiaPagamento() {
  const passos = [
    "Acesse gov.br/mei e faça login com sua conta gov.br.",
    "No menu, escolha 'Já sou MEI' e depois 'Pagamento de contribuição mensal (DAS)'.",
    "Selecione o ano e clique em 'Emitir guia de pagamento (DAS)'.",
    "Pague o boleto até o dia 20 pelo internet banking, PIX ou lotérica.",
  ];
  return (
    <ol className="space-y-3 pt-2">
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

function CalendarioFiscal() {
  return (
    <div className="space-y-2 pt-2">
      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>DAS</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Contribuição mensal</p>
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
          Todo dia 20
        </span>
      </div>
      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(34,197,94,0.10)",
          border: "1px solid rgba(34,197,94,0.35)",
        }}
      >
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

function SimuladorDesenquadramento() {
  const { faturado, limite } = useUserState();
  const restante = limite - faturado;

  const mesAtual1a12 = new Date().getMonth() + 1; // 1-12
  const mesesRestantes = Math.max(1, 12 - mesAtual1a12 + 1); // inclui o mês atual
  const mesesDecorridos = Math.max(1, mesAtual1a12); // para média
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
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Limite anual</p>
          <div className="mt-1"><Valor tamanho="sm">{limite}</Valor></div>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "var(--field)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Faturado</p>
          <div className="mt-1"><Valor tamanho="sm">{faturado}</Valor></div>
        </div>
      </div>

      {/* Quanto pode faturar por mês */}
      {estourouAnual ? (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(239,68,68,0.10)",
            border: `1px solid ${faixaAtual.cor}`,
          }}
        >
          <p className="text-sm font-bold" style={{ color: faixaAtual.cor }}>
            Você já ultrapassou o limite anual
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {faixaAtual.mensagem}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.30)",
          }}
        >
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

      {/* Projeção anual */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--field)",
          border: `1px solid ${projecaoEstoura ? faixaProjecao.cor : "var(--border)"}`,
        }}
      >
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

export default function Menu() {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(null);
  const [modalFaturamento, setModalFaturamento] = useState(false);
  const toggle = (id) => setAberto((a) => (a === id ? null : id));

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[130px]">
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
            Menu
          </h1>
        </header>

        <div className="px-5 space-y-4">
          {/* Atalhos */}
          <div className="grid grid-cols-3 gap-2.5">
            <Atalho Icon={Bell} label="Notificações" onClick={() => navigate("/alertas")} />
            <Atalho Icon={HelpCircle} label="Dúvidas" onClick={() => navigate("/faq")} />
            <Atalho
              Icon={MessageCircle}
              label="Chat IA"
              sub="Sua assistente fiscal"
              onClick={() => navigate("/chat")}
            />
          </div>

          {/* Item permanente: adicionar faturamento */}
          <button
            onClick={() => setModalFaturamento(true)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-transform active:scale-[0.99]"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--field)" }}
            >
              <BarChart3 size={18} style={{ color: "var(--primary)" }} />
            </div>
            <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
              Adicionar faturamento do ano
            </span>
            <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
          </button>

          {/* Accordion */}
          <div className="space-y-2">
            <AccordionItem
              Icon={Calculator}
              titulo="Calculadora DAS"
              aberto={aberto === "das"}
              onToggle={() => toggle("das")}
            >
              <CalculadoraDAS />
            </AccordionItem>

            <AccordionItem
              Icon={FileText}
              titulo="Guia de Pagamento do DAS"
              aberto={aberto === "guia"}
              onToggle={() => toggle("guia")}
            >
              <GuiaPagamento />
            </AccordionItem>

            <AccordionItem
              Icon={Calendar}
              titulo="Calendário Fiscal"
              aberto={aberto === "cal"}
              onToggle={() => toggle("cal")}
            >
              <CalendarioFiscal />
            </AccordionItem>

            <AccordionItem
              Icon={TrendingUp}
              titulo="Simulador de Desenquadramento"
              aberto={aberto === "sim"}
              onToggle={() => toggle("sim")}
            >
              <SimuladorDesenquadramento />
            </AccordionItem>
          </div>
        </div>
      </div>

      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={() => {
          // TODO: persistir faturamento inicial no Supabase
          setModalFaturamento(false);
        }}
      />

      <BottomNav ativo="menu" />
    </div>
  );
}

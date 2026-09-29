/* RESUMOPERFIL v2 — o resumo do ano passa a ter as SAIDAS, o grafico entradas x saidas e o IR (segmento + parte isenta) */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";

import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  faixaDoVelocimetro, FAIXA_INFO, calcularFaltamOuExcedeu,
} from "@/lib/fiscal";
import { listarSaidas, lerSegmento, salvarSegmento } from "@/lib/openfinance";

/* ===================================================================
   RESUMO DO ANO v2 (28/09/2026)

   NOVO:
     - SAIDAS do ano (total e quantidade), ao lado das entradas.
     - GRAFICO "Por mês" com duas barras por mes: entradas (verde) e
       saidas (cinza).
     - IMPOSTO DE RENDA: o SEGMENTO (8% comercio/industria/transporte de
       cargas, 16% passageiros, 32% servicos) e a PARTE ISENTA do
       faturamento (faturado x percentual). Veio da tela de Saidas, que
       ficou igual a de entradas. Fica em perfis.segmento_ir.
     - Topo que rola (TopoRolavel).
   Sem textos de explicacao.
   =================================================================== */

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/* Segmentos e a parcela isenta de cada um (Parte 3-IR do HANDOFF). */
const SEGMENTOS = [
  { valor: "comercio_carga", rotulo: "Comércio, indústria ou transporte de cargas", curto: "Comércio ou transporte de cargas", percentual: 8 },
  { valor: "passageiros", rotulo: "Transporte de passageiros", curto: "Transporte de passageiros", percentual: 16 },
  { valor: "servicos", rotulo: "Serviços", curto: "Serviços", percentual: 32 },
];

function Bloco({ label, children, cor }) {
  return (
    <div className="card-tacerto rounded-2xl px-4 py-3 flex-1 min-w-0">
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

  const [userId, setUserId] = useState(null);
  const [saidas, setSaidas] = useState([]);
  const [segmento, setSegmento] = useState(null);
  const [escolhendoSegmento, setEscolhendoSegmento] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        if (ativo) setUserId(user.id);
        const [lista, seg] = await Promise.all([
          listarSaidas(user.id, anoCorrente).catch(() => []),
          lerSegmento(user.id).catch(() => null),
        ]);
        if (!ativo) return;
        setSaidas(lista.filter((s) => new Date(s.data).getFullYear() === anoCorrente));
        setSegmento(seg);
      } catch {
        /* visitante ou falha de rede: o resumo das entradas continua */
      }
    })();
    return () => { ativo = false; };
  }, [anoCorrente]);

  const totalLancamentos = useMemo(
    () => lancamentos.filter((l) => new Date(l.data).getFullYear() === anoCorrente).length,
    [lancamentos, anoCorrente],
  );

  const totalSaidas = useMemo(() => saidas.reduce((t, s) => t + (Number(s.valor) || 0), 0), [saidas]);

  const restante = calcularFaltamOuExcedeu(faturamentoAtual, limiteAtual);
  const corFaixa = FAIXA_INFO[faixaDoVelocimetro(percentualAtual)].cor;

  const seg = SEGMENTOS.find((s) => s.valor === segmento) || null;
  const parteIsenta = seg ? (Number(faturamentoAtual) || 0) * (seg.percentual / 100) : 0;

  const dadosMensais = useMemo(() => {
    const saidasPorMes = Array(12).fill(0);
    for (const s of saidas) saidasPorMes[new Date(s.data).getMonth()] += Number(s.valor) || 0;
    const arr = [];
    for (let m = 1; m <= 12; m++) {
      arr.push({
        mes: MESES_ABREV[m - 1],
        entrada: faturamentoDoMes(m, anoCorrente),
        saida: saidasPorMes[m - 1],
      });
    }
    return arr;
  }, [faturamentoDoMes, anoCorrente, saidas]);

  const maxMes = Math.max(1, ...dadosMensais.map((d) => Math.max(d.entrada, d.saida)));
  const mesAtualIdx = new Date().getMonth() + 1;

  async function escolherSegmento(valor) {
    const antes = segmento;
    setSegmento(valor);
    setEscolhendoSegmento(false);
    try {
      if (userId) await salvarSegmento(userId, valor);
    } catch {
      setSegmento(antes);
      toast.error("Não consegui salvar o segmento. Tente de novo.");
    }
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo={`Resumo de ${anoCorrente}`} onVoltar={() => navigate(-1)} />

        <p className="text-[14px] mt-2 mb-3" style={{ color: "var(--text-tertiary)" }}>
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
          <Bloco label="Entradas">
            <p className="text-[1rem] font-semibold" style={{ color: "var(--text)" }}>
              {totalLancamentos}
            </p>
          </Bloco>
        </div>

        <div className="flex gap-2.5 mt-2.5">
          <Bloco label="Saídas">
            <Valor tamanho="md" autoAjustar>{totalSaidas}</Valor>
          </Bloco>
          <Bloco label="Pagamentos">
            <p className="text-[1rem] font-semibold" style={{ color: "var(--text)" }}>
              {saidas.length}
            </p>
          </Bloco>
        </div>

        {/* ------------------------- IMPOSTO DE RENDA ------------------------- */}
        <p className="text-[14px] mt-4 mb-3" style={{ color: "var(--text-tertiary)" }}>
          Imposto de Renda
        </p>

        <button
          onClick={() => setEscolhendoSegmento(true)}
          className="card-tacerto w-full rounded-2xl flex items-center text-left active:opacity-80 transition"
          style={{ gap: 10, padding: "12px 16px" }}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              Seu segmento
            </span>
            <span
              className="block truncate font-semibold"
              style={{ fontSize: 14.5, color: seg ? "var(--text)" : "var(--text-tertiary)", marginTop: 2 }}
            >
              {seg ? seg.curto : "Escolha seu segmento"}
            </span>
          </span>
          {seg && (
            <span className="shrink-0 font-semibold" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {seg.percentual}%
            </span>
          )}
          <ChevronDown size={18} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
        </button>

        {seg && (
          <div className="card-tacerto rounded-2xl px-4 py-3 mt-2.5">
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              Parte isenta (aproximado)
            </p>
            <div className="mt-1">
              <Valor tamanho="lg" autoAjustar cor="var(--primary)">{parteIsenta}</Valor>
            </div>
            <div className="flex items-center gap-1.5 mt-1" style={{ color: "var(--text-tertiary)" }}>
              <span className="text-xs">{seg.percentual}% de</span>
              <Valor tamanho="sm">{faturamentoAtual}</Valor>
            </div>
          </div>
        )}

        {/* ---------------------------- MEU RITMO ---------------------------- */}
        <p className="text-[14px] mt-4 mb-3" style={{ color: "var(--text-tertiary)" }}>
          Meu ritmo
        </p>

        <div className="card-tacerto rounded-2xl px-4 py-3">
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

        {/* ----------------------------- POR MES ----------------------------- */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>
            Por mês
          </p>
          <div className="flex items-center gap-3">
            <Legenda cor="var(--primary)">Entradas</Legenda>
            <Legenda cor="var(--text-tertiary)">Saídas</Legenda>
          </div>
        </div>

        <div className="card-tacerto rounded-2xl px-3 pt-3 pb-3">
          <div
            className="flex items-end justify-between gap-1"
            style={{ height: 132 }}
            role="img"
            aria-label="Entradas e saídas mês a mês"
          >
            {dadosMensais.map((d, i) => {
              const isFuturo = i + 1 > mesAtualIdx;
              const alturaE = d.entrada > 0 ? (d.entrada / maxMes) * 108 : 0;
              const alturaS = d.saida > 0 ? (d.saida / maxMes) * 108 : 0;
              return (
                <div
                  key={d.mes}
                  className="flex-1 flex flex-col items-center justify-end gap-1.5"
                  style={{ minWidth: 0 }}
                >
                  <div className="w-full flex items-end justify-center" style={{ gap: 2 }}>
                    <div
                      className="rounded-t-md"
                      style={{
                        width: "45%",
                        height: Math.max(alturaE, d.entrada > 0 ? 4 : 3),
                        backgroundColor: isFuturo ? "var(--border)" : d.entrada > 0 ? "var(--primary)" : "var(--surface)",
                        opacity: isFuturo ? 0.35 : 1,
                        transition: "height 400ms ease-out",
                      }}
                    />
                    <div
                      className="rounded-t-md"
                      style={{
                        width: "45%",
                        height: Math.max(alturaS, d.saida > 0 ? 4 : 3),
                        backgroundColor: isFuturo ? "var(--border)" : d.saida > 0 ? "var(--text-tertiary)" : "var(--surface)",
                        opacity: isFuturo ? 0.35 : 1,
                        transition: "height 400ms ease-out",
                      }}
                    />
                  </div>
                  <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                    {d.mes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------- ESCOLHER SEGMENTO ------------------------- */}
      {escolhendoSegmento && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", padding: 20 }}
          onClick={() => setEscolhendoSegmento(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-3xl"
            style={{
              maxWidth: 380,
              backgroundColor: "var(--bg)",
              border: "1px solid var(--card-borda)",
              padding: 20,
            }}
          >
            <p className="font-bold" style={{ fontSize: 16.5 }}>
              Seu segmento
            </p>
            <div className="space-y-2" style={{ marginTop: 14 }}>
              {SEGMENTOS.map((o) => {
                const marcado = o.valor === segmento;
                return (
                  <button
                    key={o.valor}
                    onClick={() => escolherSegmento(o.valor)}
                    className="w-full rounded-2xl flex items-center text-left transition active:scale-[0.99]"
                    style={{
                      gap: 12,
                      padding: "12px 14px",
                      backgroundColor: marcado ? "rgba(34,197,94,0.12)" : "var(--surface)",
                      border: `1px solid ${marcado ? "rgba(34,197,94,0.6)" : "var(--border)"}`,
                    }}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold" style={{ fontSize: 14.5, color: "var(--text)" }}>
                        {o.rotulo}
                      </span>
                      <span className="block text-[12.5px]" style={{ color: "var(--text-tertiary)", marginTop: 1 }}>
                        {o.percentual}% isento
                      </span>
                    </span>
                    {marcado && <Check size={18} className="shrink-0" style={{ color: "var(--primary)" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BottomNav ativo="perfil" />
    </div>
  );
}

function Legenda({ cor, children }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: cor }} />
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {children}
      </span>
    </span>
  );
}
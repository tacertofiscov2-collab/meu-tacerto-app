/* RESUMOPERFIL v3 — vira "Meu lucro" (/meu-lucro): Mês | Ano com Recebido, Gastos e Sobrou (%); Ano com o grafico por mes (recebido x gastos); tocar em Gastos abre por categoria; sem dados de gastos, so o Recebido + "Envie o extrato para ver quanto sobrou." (v2: o resumo do ano passa a ter as SAIDAS, o grafico entradas x saidas e o IR (segmento + parte isenta)) */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Wallet, FileUp } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  listarSaidasDoAno, resumoDoMes, resumoDoAno, temDadosDeGastos,
} from "@/lib/lucro";

/* ===================================================================
   MEU LUCRO (v3 — 10/10/2026, tarefa de 08-10, Etapa 4)

   Abre por Perfil > Meu MEI > "Meu lucro". Regras e contas em
   src/lib/lucro.js (nada de conta solta aqui).
   - Alternador "Mês | Ano" no topo (o mes e o ano ficam no endereco:
     o gesto de voltar do iPhone funciona).
   - MES: setinhas para trocar o mes (so de janeiro — ou da abertura do
     MEI, se abriu este ano — ate o mes atual: regra dos anos). Linhas:
     Recebido · Gastos · Sobrou (e %). Tocar em Gastos abre os gastos
     por categoria (/meu-lucro/gastos).
   - ANO: as mesmas 3 linhas do ano e o grafico por mes (recebido em
     verde, gastos em cinza). O total digitado do ano (sem mes) entra so
     no Recebido do ano; uma linha pequena diz quanto e.
   - SEM DADOS DE GASTOS (nenhuma saida no ano = nunca mandou extrato):
     so o Recebido + "Envie o extrato para ver quanto sobrou."
   O antigo Resumo (segmento do IR, ritmo) saiu: o IR esta na Declaracao
   anual e a projecao no Simulador.
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_ABREV = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function ResumoPerfil() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { lancamentos, tipoMEI, mesAnoAbertura } = useAppState();
  const ano = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const mesInicio = Number(mesAnoAbertura?.ano) === ano ? Math.min(Math.max(1, Number(mesAnoAbertura?.mes) || 1), mesAtual) : 1;

  const ver = params.get("ver") === "ano" ? "ano" : "mes";
  const mes = Math.min(mesAtual, Math.max(mesInicio, Number(params.get("mes")) || mesAtual));
  const irPara = (novo) => setParams({ ver, mes: String(mes), ...novo }, { replace: true });

  const [saidas, setSaidas] = useState(null);
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) { if (ativo) setSaidas([]); return; }
        const lista = await listarSaidasDoAno(data.user.id, ano);
        if (ativo) setSaidas(lista);
      } catch {
        if (ativo) setSaidas([]);
      }
    })();
    return () => { ativo = false; };
  }, [ano]);

  const doMes = useMemo(
    () => resumoDoMes({ lancamentos, saidas: saidas || [], ano, mes, tipoMEI }),
    [lancamentos, saidas, ano, mes, tipoMEI],
  );
  const doAno = useMemo(
    () => resumoDoAno({ lancamentos, saidas: saidas || [], ano, tipoMEI }),
    [lancamentos, saidas, ano, tipoMEI],
  );
  const r = ver === "ano" ? doAno : doMes;
  const comGastos = temDadosDeGastos(saidas || []);

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  const valor = (v, cor) => <Valor px={15.5} peso={600} cor={cor || "var(--text)"}>{v}</Valor>;

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="conteudo-rolavel hide-scrollbar px-5" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
        <TopoRolavel titulo="Meu lucro" onVoltar={voltar} />

        {/* Mes | Ano (escolhido: so a borda mais clara, sem cor) */}
        <div className="flex rounded-full" style={{ padding: 3, border: "1px solid var(--border)", marginTop: 6 }}>
          {[["mes", "Mês"], ["ano", "Ano"]].map(([v, rotulo]) => {
            const ativo = ver === v;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={ativo}
                onClick={() => !ativo && irPara({ ver: v })}
                className="flex-1 rounded-full font-medium"
                style={{
                  fontSize: 15,
                  padding: "8px 0",
                  background: "none",
                  boxShadow: ativo ? "inset 0 0 0 1px var(--text-secondary)" : "none",
                  color: ativo ? "var(--text)" : "var(--text-tertiary)",
                }}
              >
                {rotulo}
              </button>
            );
          })}
        </div>

        {/* Mes: setinhas */}
        {ver === "mes" ? (
          <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
            <BotaoSeta Icon={ChevronLeft} rotulo="Mês anterior" desativado={mes <= mesInicio} onClick={() => irPara({ mes: String(mes - 1) })} />
            <p className="font-bold" style={{ fontSize: 18 }}>{MESES[mes - 1]}</p>
            <BotaoSeta Icon={ChevronRight} rotulo="Próximo mês" desativado={mes >= mesAtual} onClick={() => irPara({ mes: String(mes + 1) })} />
          </div>
        ) : (
          <p className="font-bold text-center" style={{ fontSize: 18, marginTop: 18 }}>{ano}</p>
        )}

        <SecaoLista style={{ marginTop: 10 }}>
          <LinhaLista
            Icon={ArrowDownLeft}
            rotulo="Recebido"
            detalhe={ver === "ano" && doAno.semMes > 0 ? <span>Inclui <Valor px={13.5} cor="var(--text-tertiary)">{doAno.semMes}</Valor> do total digitado</span> : null}
            valor={valor(r.recebido)}
          />
          {comGastos && (
            <LinhaLista
              Icon={ArrowUpRight}
              rotulo="Gastos"
              valor={valor(r.gastos)}
              onClick={() => navigate(`/meu-lucro/gastos?ver=${ver}&mes=${mes}`, { state: { de: "lucro" } })}
            />
          )}
          {comGastos && (
            <LinhaLista
              Icon={Wallet}
              rotulo="Sobrou"
              detalhe={r.pct != null ? `${Math.round(r.pct)}% do recebido` : null}
              valor={valor(r.sobrou, r.sobrou < 0 ? "var(--danger)" : "var(--text)")}
            />
          )}
        </SecaoLista>

        {saidas && !comGastos && (
          <div className="flex flex-col items-center text-center" style={{ marginTop: 26 }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>Envie o extrato para ver quanto sobrou.</p>
            <button
              type="button"
              onClick={() => navigate("/enviar-extrato", { state: { de: "lucro" } })}
              className="botao-confirmar toque rounded-full font-semibold flex items-center"
              style={{ marginTop: 14, gap: 7, padding: "10px 18px", fontSize: 15 }}
            >
              <FileUp size={17} strokeWidth={2.1} />
              Enviar extrato
            </button>
          </div>
        )}

        {ver === "ano" && comGastos && <GraficoPorMes meses={doAno.meses} mesAtual={mesAtual} />}
      </div>
    </div>
  );
}

function BotaoSeta({ Icon, rotulo, desativado, onClick }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      disabled={desativado}
      onClick={onClick}
      className="toque rounded-full flex items-center justify-center disabled:opacity-25"
      style={{ width: 40, height: 40, border: "1px solid var(--border)", background: "none" }}
    >
      <Icon size={20} style={{ color: "var(--text)" }} />
    </button>
  );
}

/* Grafico simples: por mes, a barra verde (recebido) e a cinza (gastos) */
function GraficoPorMes({ meses, mesAtual }) {
  const maior = Math.max(1, ...meses.map((m) => Math.max(m.recebido, m.gastos)));
  return (
    <div style={{ marginTop: 28 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <p className="font-semibold uppercase" style={{ color: "var(--text-tertiary)", fontSize: 12.5, letterSpacing: "0.08em" }}>
          Por mês
        </p>
        <div className="flex items-center" style={{ gap: 12 }}>
          <Legenda cor="var(--primary)">Recebido</Legenda>
          <Legenda cor="var(--text-tertiary)">Gastos</Legenda>
        </div>
      </div>
      <div
        className="flex items-end justify-between"
        style={{ height: 140, gap: 3, padding: "12px 8px 8px", border: "1px solid var(--border)", borderRadius: 16 }}
        role="img"
        aria-label="Recebido e gastos mês a mês"
      >
        {meses.map((m, i) => {
          const futuro = m.mes > mesAtual;
          const altura = (v) => (v > 0 ? Math.max(4, (v / maior) * 100) : 2);
          return (
            <div key={m.mes} className="flex-1 flex flex-col items-center justify-end" style={{ minWidth: 0, gap: 5, opacity: futuro ? 0.3 : 1 }}>
              <div className="w-full flex items-end justify-center" style={{ gap: 2 }}>
                <div className="rounded-t" style={{ width: "42%", height: altura(m.recebido), backgroundColor: m.recebido > 0 ? "var(--primary)" : "var(--border)" }} />
                <div className="rounded-t" style={{ width: "42%", height: altura(m.gastos), backgroundColor: m.gastos > 0 ? "var(--text-tertiary)" : "var(--border)" }} />
              </div>
              <span style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{MESES_ABREV[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legenda({ cor, children }) {
  return (
    <span className="flex items-center" style={{ gap: 5 }}>
      <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: cor }} />
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{children}</span>
    </span>
  );
}

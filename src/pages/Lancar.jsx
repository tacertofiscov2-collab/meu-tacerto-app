/* LANCAR v8 — setinha de voltar maior (bolinha 46, seta 24; sem bolinha, seta 26) (v7: modo "Total do ano": digitar so o faturamento do ano e o velocimetro fica igual a ele (um lancamento de ajuste, sem contar em dobro); /lancar?modo=total abre direto nele (v6: padrao do Perfil: rotulos em cinza maiusculo, campos com 16px (sem zoom no iPhone), "Ultimo lancamento" em linha simples, letras maiores, botao em contorno (botao-confirmar))) */
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/context/AppStateContext";
import Valor from "../components/Valor.jsx";
import Calendario from "../components/Calendario.jsx";
import PendenciasEntradas from "../components/PendenciasEntradas.jsx";
import { dataMinimaLancamento, LIMITE_VALOR_LANCAMENTO } from "@/lib/fiscal";

/* ===================================================================
   LANCAR v7 (05/10/2026) — MODO "TOTAL DO ANO" (pedido do Fernando)

   No topo, duas opcoes: "Recebimento" (o lancamento de sempre) e
   "Total do ano". No total do ano a pessoa digita SO o quanto ja
   faturou no ano e o velocimetro fica igual a esse valor.

   Como funciona, sem mudar o banco e sem contar em dobro:
   - Os lancamentos de AJUSTE sao os que tem a descricao
     DESCRICAO_AJUSTE_ANO ou a do Onboarding (DESCRICAO_ESTIMADO,
     "Faturamento estimado ate hoje").
   - Soma dos recebimentos do ano (todos os outros) = S.
   - Ajuste = total digitado - S. Fica UM lancamento de ajuste so, com a
     data de hoje (os outros ajustes do ano sao apagados). Ajuste zero =
     nenhum lancamento de ajuste.
   - Total menor que S nao da: a tela avisa quanto ja foi lancado em
     recebimentos (para diminuir, editar no Historico).
   A pessoa digitou o valor, entao e ela confirmando (regra do app).
   /lancar?modo=total abre direto neste modo (notificacao "Atualize seu
   velocimetro").
   =================================================================== */
const DESCRICAO_AJUSTE_ANO = "Ajuste do total do ano";
/* Mesma descricao do Onboarding (DESCRICAO_ESTIMADO em Onboarding.jsx) */
const DESCRICAO_ESTIMADO = "Faturamento estimado até hoje";
const DESCRICOES_DE_AJUSTE = [DESCRICAO_AJUSTE_ANO, DESCRICAO_ESTIMADO];

/* LANCAR v5 — faixa de pendencias do Open Finance no topo

   Acima do campo Valor entra o <PendenciasEntradas />: a faixa que
   avisa o que caiu na conta e ainda nao foi classificado. Ela so
   aparece quando HA pendencia — sem nada pendente, o componente nao
   renderiza e a tela fica exatamente como era.

   Nao aparece no modo edicao: ali a pessoa esta consertando um
   lancamento especifico, nao registrando entrada nova.

   A pergunta feita ali é so "isso é faturamento?". A pergunta sobre
   emitir nota fiscal acontece no WhatsApp, depois.

   Da v4: barras no padrao .card-tacerto, botao de salvar sem brilho.
   A SETA DE VOLTAR nao foi alterada. */

// Teto em centavos, derivado da constante única em fiscal.js
const MAX_CENTAVOS = Math.round(LIMITE_VALOR_LANCAMENTO * 100);
const MAX_DIGITOS = String(MAX_CENTAVOS).length;
const LIMITE_DESCRICAO = 60;

/* v6: rotulo dos campos no padrao do Perfil (titulo de secao: cinza,
   maiusculo, com espacamento) */
const ROTULO_CAMPO = {
  color: "var(--text-tertiary)",
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
};
const LIMITE_VISITANTE = 8;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatBRLFromCentavos(centavos) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  return `${reais.toLocaleString("pt-BR")},${String(cents).padStart(2, "0")}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function hojeISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

function isoToBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

function brToISO(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function mascararData(raw) {
  const digits = String(raw).replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}

function diasNoMes(mes, ano) {
  return new Date(ano, mes, 0).getDate();
}

function labelDataCurta(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]}`;
}

export default function Lancar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const {
    lancamentos,
    adicionarLancamento,
    atualizarLancamento,
    removerLancamento,
    setModoSimulacao,
    mesAnoAbertura,
    visitante,
    faturamentoAtual,
  } = useAppState();

  /* v7: "recebimento" (de sempre) ou "total" (total do ano) */
  const [modo, setModo] = useState(params.get("modo") === "total" && !editId ? "total" : "recebimento");
  const modoTotal = modo === "total";
  const anoAtual = new Date().getFullYear();

  /* v7: lancamentos do ano separados em ajustes e recebimentos (ver topo) */
  const { ajustesDoAno, recebimentosCentavos } = useMemo(() => {
    const doAno = (lancamentos || []).filter((l) => new Date(l.data).getFullYear() === anoAtual);
    const ajustes = doAno.filter((l) => DESCRICOES_DE_AJUSTE.includes(l.descricao));
    const soma = doAno
      .filter((l) => !DESCRICOES_DE_AJUSTE.includes(l.descricao))
      .reduce((s, l) => s + Math.round((Number(l.valor) || 0) * 100), 0);
    return { ajustesDoAno: ajustes, recebimentosCentavos: soma };
  }, [lancamentos, anoAtual]);

  const dataMin = dataMinimaLancamento(
    mesAnoAbertura?.mes,
    mesAnoAbertura?.ano,
  );

  const lancamentoAtual = useMemo(
    () => (editId ? lancamentos.find((l) => l.id === editId) : null),
    [editId, lancamentos],
  );
  const modoEdicao = Boolean(lancamentoAtual);

  const ultimoLancamento = useMemo(() => {
    if (!lancamentos || lancamentos.length === 0) return null;
    const lista = modoEdicao
      ? lancamentos.filter((l) => l.id !== editId)
      : lancamentos;
    if (lista.length === 0) return null;
    return [...lista].sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  }, [lancamentos, modoEdicao, editId]);

  useEffect(() => {
    if (modoEdicao) return;
    if (visitante && lancamentos.length >= LIMITE_VISITANTE) {
      navigate("/lancar/limite-atingido", { replace: true });
    }
  }, [modoEdicao, lancamentos.length, visitante, navigate]);

  const [centavos, setCentavos] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [dataBR, setDataBR] = useState(isoToBR(hojeISO()));
  const [salvando, setSalvando] = useState(false);
  const [preenchido, setPreenchido] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [atingiuTeto, setAtingiuTeto] = useState(false);

  useEffect(() => {
    if (lancamentoAtual && !preenchido) {
      setCentavos(Math.round((Number(lancamentoAtual.valor) || 0) * 100));
      setDescricao((lancamentoAtual.descricao || "").slice(0, LIMITE_DESCRICAO));
      const d = new Date(lancamentoAtual.data);
      setDataBR(isoToBR(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`));
      setPreenchido(true);
    }
  }, [lancamentoAtual, preenchido]);

  function validarDataBR(br) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
    if (!m) return false;
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    const ano = Number(m[3]);
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > diasNoMes(mes, ano)) return false;
    const iso = `${m[3]}-${m[2]}-${m[1]}`;
    if (iso > hojeISO()) return false;
    if (iso < dataMin) return false;
    return true;
  }

  const valorFmt = useMemo(() => formatBRLFromCentavos(centavos), [centavos]);
  const digitando = centavos > 0;

  const dataCompleta = dataBR.length === 10;
  const dataValida = dataCompleta && validarDataBR(dataBR);
  const mostrarErroData = dataCompleta && !dataValida;

  const msgErroData = (() => {
    if (!mostrarErroData) return "";
    const iso = brToISO(dataBR);
    if (iso && iso > hojeISO()) return "Não dá pra lançar uma data futura";
    if (iso && iso < dataMin) {
      const [y, m] = dataMin.split("-");
      return `Seu MEI abriu em ${MESES[Number(m) - 1]} de ${y} — escolha uma data a partir daí`;
    }
    return "Data inválida";
  })();

  function handleValor(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITOS);
    const n = digits ? parseInt(digits, 10) : 0;
    const limitado = Math.min(n, MAX_CENTAVOS);
    setAtingiuTeto(n > MAX_CENTAVOS);
    setCentavos(limitado);
  }

  /* v7: total do ano menor que os recebimentos ja lancados nao da */
  const totalAbaixoDosRecebimentos = modoTotal && centavos > 0 && centavos < recebimentosCentavos;
  const podeSalvar = modoTotal
    ? centavos > 0 && !totalAbaixoDosRecebimentos
    : centavos > 0 && dataValida;

  /* v7: salva o total do ano como UM lancamento de ajuste (ver topo) */
  async function salvarTotalDoAno() {
    if (!podeSalvar || salvando) return;
    const ajusteCentavos = centavos - recebimentosCentavos;
    const [primeiro, ...sobrando] = ajustesDoAno;
    if (!primeiro && ajusteCentavos > 0 && visitante && lancamentos.length >= LIMITE_VISITANTE) {
      navigate("/lancar/limite-atingido", { replace: true });
      return;
    }
    setSalvando(true);
    setModoSimulacao(false);
    const hoje = new Date().toISOString();
    if (ajusteCentavos <= 0) {
      ajustesDoAno.forEach((l) => removerLancamento(l.id));
    } else if (primeiro) {
      atualizarLancamento(primeiro.id, { descricao: DESCRICAO_AJUSTE_ANO, valor: ajusteCentavos / 100, data: hoje });
      sobrando.forEach((l) => removerLancamento(l.id));
    } else {
      adicionarLancamento({ descricao: DESCRICAO_AJUSTE_ANO, valor: ajusteCentavos / 100, data: hoje });
    }
    await new Promise((r) => setTimeout(r, 200));
    setSalvando(false);
    toast.success("Velocímetro atualizado");
    navigate("/dashboard");
  }

  async function handleSalvar() {
    if (modoTotal) return salvarTotalDoAno();
    if (centavos <= 0 || !dataValida || salvando) return;

    if (!modoEdicao && visitante && lancamentos.length >= LIMITE_VISITANTE) {
      navigate("/lancar/limite-atingido", { replace: true });
      return;
    }

    setSalvando(true);
    const iso = brToISO(dataBR);
    const payload = {
      descricao: descricao.trim().slice(0, LIMITE_DESCRICAO),
      valor: centavos / 100,
      data: new Date(iso + "T12:00:00").toISOString(),
    };
    if (modoEdicao) {
      atualizarLancamento(lancamentoAtual.id, payload);
    } else {
      setModoSimulacao(false);
      adicionarLancamento(payload);
    }
    await new Promise((r) => setTimeout(r, 200));
    setSalvando(false);
    navigate("/dashboard");
  }

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-4 pt-5 pb-2 flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="toque toque-escala w-[46px] h-[46px] rounded-full flex items-center justify-center"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={24} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="font-bold" style={{ color: "var(--text)", fontSize: 20 }}>
          {modoEdicao ? "Editar lançamento" : modoTotal ? "Atualizar velocímetro" : "Novo lançamento"}
        </h1>
      </header>

      {/* v7: Recebimento | Total do ano (so para lancamento novo) */}
      {!modoEdicao && (
        <div className="shrink-0 px-5" style={{ paddingTop: 6, paddingBottom: 10 }}>
          <div className="max-w-md mx-auto flex rounded-full" style={{ padding: 3, border: "1px solid var(--border)" }}>
            {[["recebimento", "Recebimento"], ["total", "Total do ano"]].map(([valor, rotulo]) => {
              const ativo = modo === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => {
                    if (ativo) return;
                    setModo(valor);
                    setCentavos(0);
                    setAtingiuTeto(false);
                  }}
                  className="flex-1 rounded-full font-medium transition-colors"
                  style={{
                    fontSize: 15,
                    padding: "8px 0",
                    backgroundColor: ativo ? "var(--field)" : "transparent",
                    color: ativo ? "var(--text)" : "var(--text-tertiary)",
                  }}
                >
                  {rotulo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conteúdo: rola só se precisar, mas cabe tudo em tela normal */}
      <div
        className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5"
        style={{ paddingBottom: 4 }}
      >
        <div
          className="max-w-md mx-auto"
          style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}
        >
          {/* PENDÊNCIAS DO OPEN FINANCE
              Só aparece quando há entrada esperando classificação. Sem
              nada pendente, o componente não renderiza e os campos
              ficam no lugar de sempre. */}
          {!modoEdicao && !modoTotal && <PendenciasEntradas />}

          <div>
            <label
              className="block"
              style={ROTULO_CAMPO}
            >
              {modoTotal ? `Total faturado em ${anoAtual}` : "Valor"}
            </label>
            <div
              className="card-tacerto flex items-center rounded-xl overflow-hidden"
              style={{ color: "var(--text)" }}
            >
              <span
                className="font-bold"
                style={{
                  color: "var(--text)",
                  paddingLeft: 16,
                  paddingRight: 8,
                  fontSize: 22,
                }}
              >
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={digitando ? valorFmt : ""}
                onChange={handleValor}
                placeholder="0,00"
                className="flex-1 bg-transparent font-bold focus:outline-none placeholder:opacity-40"
                style={{
                  color: "var(--text)",
                  fontSize: 27,
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingRight: 16,
                }}
              />
            </div>
            <p
              style={{
                color: atingiuTeto || totalAbaixoDosRecebimentos ? "#ef4444" : "var(--text-secondary)",
                fontSize: 13.5,
                marginTop: 7,
              }}
            >
              {atingiuTeto
                ? `Valor máximo por lançamento: R$ ${formatBRLFromCentavos(MAX_CENTAVOS)}`
                : totalAbaixoDosRecebimentos
                ? `Você já lançou R$ ${formatBRLFromCentavos(recebimentosCentavos)} em recebimentos este ano. Digite pelo menos esse valor.`
                : modoTotal
                ? `Hoje o velocímetro marca R$ ${formatBRLFromCentavos(Math.round((Number(faturamentoAtual) || 0) * 100))}`
                : "Digite o valor recebido"}
            </p>
          </div>

          {/* v7: no "Total do ano" fica so o valor */}
          {!modoTotal && (
          <>
          <div>
            <label
              className="block"
              style={ROTULO_CAMPO}
            >
              Descrição
            </label>
            <input
              type="text"
              value={descricao}
              maxLength={LIMITE_DESCRICAO}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="campo-tacerto card-tacerto w-full rounded-xl placeholder:opacity-70"
              style={{
                color: "var(--text)",
                minHeight: 50,
                paddingLeft: 16,
                paddingRight: 16,
                fontSize: 16,
              }}
            />
          </div>

          <div>
            <label
              className="block"
              style={ROTULO_CAMPO}
            >
              Data
            </label>
            <div
              className="card-tacerto flex items-center rounded-xl"
              style={{
                color: "var(--text)",
                /* Só o erro sobrescreve a moldura padrão do card. */
                borderColor: mostrarErroData ? "#ef4444" : undefined,
                minHeight: 50,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                value={dataBR}
                onChange={(e) => setDataBR(mascararData(e.target.value))}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="flex-1 bg-transparent focus:outline-none placeholder:opacity-70"
                style={{ color: "var(--text)", fontSize: 16 }}
              />
              <button
                type="button"
                onClick={() => setCalendarioAberto(true)}
                aria-label="Selecionar data"
                className="toque ml-2 shrink-0 flex items-center justify-center"
              >
                <CalendarIcon size={20} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            {mostrarErroData && (
              <p style={{ color: "#ef4444", fontSize: 13.5, marginTop: 7 }}>
                {msgErroData}
              </p>
            )}
          </div>

          <div style={{ marginTop: 4 }}>
            <p
              style={ROTULO_CAMPO}
            >
              Último lançamento
            </p>
            {ultimoLancamento ? (
              <div
                className="w-full flex items-center"
                style={{ gap: 14, paddingTop: 6, paddingBottom: 6 }}
              >
                <TrendingUp
                  size={20}
                  strokeWidth={1.75}
                  style={{ color: "var(--primary)" }}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="leading-tight truncate"
                    style={{ color: "var(--text)", fontSize: 16.5, fontWeight: 500 }}
                  >
                    {ultimoLancamento.descricao}
                  </p>
                  <p
                    style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 2 }}
                  >
                    {labelDataCurta(ultimoLancamento.data)}
                  </p>
                </div>
                <div className="shrink-0">
                  <Valor px={15.5} peso={600} sinal="+">{ultimoLancamento.valor}</Valor>
                </div>
              </div>
            ) : (
              <div className="w-full" style={{ paddingTop: 4 }}>
                <p style={{ color: "var(--text-tertiary)", fontSize: 15 }}>
                  Nenhum lançamento ainda
                </p>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      <Calendario
        aberto={calendarioAberto}
        modo="dia"
        valorISO={brToISO(dataBR) || hojeISO()}
        minISO={dataMin}
        onFechar={() => setCalendarioAberto(false)}
        onSelecionar={(iso) => {
          setDataBR(isoToBR(iso));
          setCalendarioAberto(false);
        }}
      />

      {/* Botão fixo no fluxo — nunca fica atrás da barra do navegador */}
      <div
        className="shrink-0 px-5"
        style={{
          paddingTop: 14,
          backgroundColor: "var(--bg)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
        }}
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSalvar}
            disabled={salvando || !podeSalvar}
            className="botao-confirmar toque toque-escala w-full rounded-2xl font-bold disabled:opacity-40"
            style={{
              paddingTop: 16,
              paddingBottom: 16,
              fontSize: 16.5,
              letterSpacing: "0.01em",
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
              transition: "opacity 200ms ease",
            }}
          >
            {salvando ? "Salvando..." : modoTotal ? "Atualizar velocímetro" : "Salvar lançamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
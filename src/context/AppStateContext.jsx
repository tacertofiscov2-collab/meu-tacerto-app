import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  LIMITES_ANUAIS,
  limiteProporcional,
  calcularPercentual,
  faixaDoVelocimetro,
} from "@/lib/fiscal";

const STORAGE_KEY = "tacerto_app_state";
const EVT = "tacerto-user-changed"; // mantém compat com useUserState

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function ordinal(n) {
  return `${n}º`;
}

function normalizarTipo(v) {
  return String(v || "MEI").toUpperCase() === "MEI_CAMINHONEIRO"
    ? "MEI_CAMINHONEIRO"
    : "MEI";
}

const DEFAULT_STATE = {
  lancamentos: [],
  tipoMEI: "MEI",
  mesAnoAbertura: null,
  modoSimulacao: false,
  faturamentoSimulado: 0,
};

function hidratar() {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        tipoMEI: normalizarTipo(parsed.tipoMEI),
        lancamentos: Array.isArray(parsed.lancamentos) ? parsed.lancamentos : [],
      };
    }
    // migração das chaves antigas do useUserState
    const tipoLeg = localStorage.getItem("tacerto_tipo") || localStorage.getItem("tacerto_perfil");
    const mes = localStorage.getItem("tacerto_mes_abertura");
    const ano = localStorage.getItem("tacerto_ano_abertura");
    const fatLeg = localStorage.getItem("tacerto_faturado");
    return {
      ...DEFAULT_STATE,
      tipoMEI: normalizarTipo(tipoLeg),
      mesAnoAbertura: mes && ano ? { mes: Number(mes), ano: Number(ano) } : null,
      // se havia um faturado legado, iniciamos em modo simulação para não perder o cenário
      modoSimulacao: fatLeg != null && Number(fatLeg) > 0,
      faturamentoSimulado: fatLeg != null ? Number(fatLeg) : 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, setState] = useState(hidratar);
  const first = useRef(true);

  // Migração única: descrições antigas "Xº Recebimento/Frete de Mês" → "Xº Lançamento de Mês".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("tacerto_migracao_descricoes") === "true") return;
    const re = /^(\d+º) (Recebimento|Frete) de /;
    setState((s) => {
      let mudou = false;
      const novos = s.lancamentos.map((l) => {
        if (l.descricao && re.test(l.descricao)) {
          mudou = true;
          return { ...l, descricao: l.descricao.replace(re, "$1 Lançamento de ") };
        }
        return l;
      });
      if (mudou) return { ...s, lancamentos: novos };
      return s;
    });
    localStorage.setItem("tacerto_migracao_descricoes", "true");
  }, []);


  // Persistência + bridge para as chaves antigas (useUserState continua reativo)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      const anoCorrente = new Date().getFullYear();
      const faturamento = state.modoSimulacao
        ? Number(state.faturamentoSimulado) || 0
        : state.lancamentos
            .filter((l) => new Date(l.data).getFullYear() === anoCorrente)
            .reduce((s, l) => s + (Number(l.valor) || 0), 0);

      localStorage.setItem("tacerto_tipo", state.tipoMEI);
      localStorage.setItem("tacerto_faturado", String(faturamento));
      if (state.mesAnoAbertura) {
        localStorage.setItem("tacerto_mes_abertura", String(state.mesAnoAbertura.mes));
        localStorage.setItem("tacerto_ano_abertura", String(state.mesAnoAbertura.ano));
      } else {
        localStorage.removeItem("tacerto_mes_abertura");
        localStorage.removeItem("tacerto_ano_abertura");
      }
      window.dispatchEvent(new Event(EVT));
    } catch {}
    first.current = false;
  }, [state]);

  // Sincroniza com escritas legadas (Onboarding/EditarPerfil via userState.js)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const tipoLeg = localStorage.getItem("tacerto_tipo");
      const mes = localStorage.getItem("tacerto_mes_abertura");
      const ano = localStorage.getItem("tacerto_ano_abertura");
      setState((s) => {
        const novoTipo = normalizarTipo(tipoLeg || s.tipoMEI);
        const novaAb = mes && ano ? { mes: Number(mes), ano: Number(ano) } : null;
        const mesmoTipo = novoTipo === s.tipoMEI;
        const mesmaAb =
          (novaAb && s.mesAnoAbertura &&
            novaAb.mes === s.mesAnoAbertura.mes &&
            novaAb.ano === s.mesAnoAbertura.ano) ||
          (novaAb == null && s.mesAnoAbertura == null);
        if (mesmoTipo && mesmaAb) return s;
        return { ...s, tipoMEI: novoTipo, mesAnoAbertura: novaAb };
      });
    };
    window.addEventListener("tacerto-user-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tacerto-user-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const adicionarLancamento = useCallback((l) => {
    setState((s) => {
      const data = l.data || new Date().toISOString();
      const d = new Date(data);
      const mesmoMes = s.lancamentos.filter((x) => {
        const dx = new Date(x.data);
        return dx.getMonth() === d.getMonth() && dx.getFullYear() === d.getFullYear();
      }).length;
      const descricao =
        (l.descricao && l.descricao.trim()) ||
        `${ordinal(mesmoMes + 1)} Lançamento de ${MESES[d.getMonth()]}`;
      const novo = {
        id: uuid(),
        descricao,
        valor: Number(l.valor) || 0,
        data,
      };
      return { ...s, lancamentos: [novo, ...s.lancamentos] };
    });
  }, []);

  const atualizarLancamento = useCallback((id, dados) => {
    setState((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((l) => (l.id === id ? { ...l, ...dados } : l)),
    }));
  }, []);

  const removerLancamento = useCallback((id) => {
    setState((s) => ({ ...s, lancamentos: s.lancamentos.filter((l) => l.id !== id) }));
  }, []);

  const removerTodosLancamentos = useCallback(() => {
    setState((s) => ({ ...s, lancamentos: [] }));
  }, []);

  const setTipoMEI = useCallback((t) => {
    setState((s) => ({ ...s, tipoMEI: normalizarTipo(t) }));
  }, []);

  const setMesAnoAbertura = useCallback((mes, ano) => {
    setState((s) => ({
      ...s,
      mesAnoAbertura: mes && ano ? { mes: Number(mes), ano: Number(ano) } : null,
    }));
  }, []);

  const setModoSimulacao = useCallback((b) => {
    setState((s) => ({ ...s, modoSimulacao: !!b }));
  }, []);

  const setFaturamentoSimulado = useCallback((v) => {
    setState((s) => ({ ...s, faturamentoSimulado: Number(v) || 0, modoSimulacao: true }));
  }, []);

  const resetarConta = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // Selectors
  const anoCorrente = new Date().getFullYear();

  const faturamentoReal = useMemo(
    () =>
      state.lancamentos
        .filter((l) => new Date(l.data).getFullYear() === anoCorrente)
        .reduce((s, l) => s + (Number(l.valor) || 0), 0),
    [state.lancamentos, anoCorrente],
  );

  const faturamentoAtual = state.modoSimulacao
    ? Number(state.faturamentoSimulado) || 0
    : faturamentoReal;

  const limiteAtual = state.mesAnoAbertura
    ? limiteProporcional(
        state.tipoMEI,
        state.mesAnoAbertura.mes,
        state.mesAnoAbertura.ano,
        anoCorrente,
      )
    : LIMITES_ANUAIS[state.tipoMEI];

  const percentualAtual = calcularPercentual(faturamentoAtual, limiteAtual);
  const faltamAtual = Math.max(0, limiteAtual - faturamentoAtual);
  const faixaAtual = faixaDoVelocimetro(percentualAtual);

  const faturamentoDoMes = useCallback(
    (mes, ano) =>
      state.lancamentos
        .filter((l) => {
          const d = new Date(l.data);
          return d.getMonth() + 1 === mes && d.getFullYear() === ano;
        })
        .reduce((s, l) => s + (Number(l.valor) || 0), 0),
    [state.lancamentos],
  );

  const value = {
    ...state,
    adicionarLancamento,
    atualizarLancamento,
    removerLancamento,
    removerTodosLancamentos,
    setTipoMEI,
    setMesAnoAbertura,
    setModoSimulacao,
    setFaturamentoSimulado,
    resetarConta,
    // selectors
    faturamentoReal,
    faturamentoAtual,
    limiteAtual,
    percentualAtual,
    faltamAtual,
    faixaAtual,
    faturamentoDoMes,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState precisa estar dentro de <AppStateProvider>");
  return ctx;
}

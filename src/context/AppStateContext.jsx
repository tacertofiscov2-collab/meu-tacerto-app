/* APPSTATE v3 — campos novos do perfil (CNPJ, CNAE, MEI desde, CNPJ confirmado, atualizacao do velocimetro, lembrete do DAS, nota automatica) lidos numa consulta separada e guardados no aparelho ate o SQL de 08-10 rodar; "Atualizado em" do velocimetro marcado a cada lancamento (v2: mediaMensal vira o RITMO do ano (faturado / meses que passaram) + mediaLimite) */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  LIMITES_ANUAIS,
  limiteProporcional,
  calcularPercentual,
  faixaDoVelocimetro,
} from "@/lib/fiscal";
import { supabase } from "@/lib/supabase";
import {
  COLUNAS_PERFIL_NOVAS, perfilNovoDoBanco, gravarPerfilNovo,
} from "@/lib/perfil";

/* ===================================================================
   CAMPOS NOVOS DO PERFIL (v3 — 10/10/2026)

   CNPJ, CNAE, "MEI desde", CNPJ confirmado, data/hora da ultima
   atualizacao do velocimetro, dias/horario do lembrete do DAS e "nota
   automatica ligada". Vem de colunas novas de `perfis` (SQL de 08-10).

   ANTES DO SQL RODAR as colunas nao existem: a leitura delas e SEPARADA
   (se falhar, o resto do perfil carrega normal) e o que a pessoa
   preencher fica guardado no aparelho, marcado com o id da conta
   (`donoExtras`) — assim outra conta no mesmo celular nao herda o CNPJ.
   DEPOIS DO SQL, ao abrir o app, o que so existia no aparelho vai para
   o banco sozinho ("empurrar"), e dali em diante o banco manda.
   =================================================================== */
const EXTRAS_VAZIOS = {
  cnpj: "",
  cnae: "",
  cnaesSecundarios: [],
  dataOpcaoMei: null,
  cnpjConfirmado: false,
  velocimetroAtualizadoEm: null,
  lembreteDasDias: [7, 2, 0],
  lembreteDasHora: null,
  notaAutomaticaAtiva: false,
};

/* Junta o banco com o aparelho: o banco ganha quando tem valor; o
   aparelho so preenche o que o banco ainda nao tem. Devolve tambem o
   que precisa subir para o banco. */
function mesclarExtras(doBanco, local) {
  const mesclado = { ...EXTRAS_VAZIOS };
  const subir = {};
  for (const campo of Object.keys(EXTRAS_VAZIOS)) {
    const b = doBanco[campo];
    const l = local[campo];
    const bancoVazio = b === null || b === undefined || b === "";
    const localTem = !(l === null || l === undefined || l === "" || (Array.isArray(l) && l.length === 0 && campo !== "lembreteDasDias"));
    if (!bancoVazio) mesclado[campo] = b;
    else if (localTem) {
      mesclado[campo] = l;
      subir[campo] = l;
    }
  }
  // CNPJ confirmado no aparelho e "false" no banco (padrao da coluna):
  // vale o do aparelho se o CNPJ tambem veio do aparelho.
  if (subir.cnpj && local.cnpjConfirmado) {
    mesclado.cnpjConfirmado = true;
    subir.cnpjConfirmado = true;
  }
  return { mesclado, subir };
}

const STORAGE_KEY = "tacerto_app_state";
const EVT = "tacerto-user-changed";

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
  nome: "",
  email: null,
  visitante: true,
  lancamentos: [],
  tipoMEI: "MEI",
  mesAnoAbertura: null,
  modoSimulacao: false,
  faturamentoSimulado: 0,
  /* v3: campos novos do perfil + de qual conta eles sao */
  ...EXTRAS_VAZIOS,
  donoExtras: null,
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
    // migração das chaves legadas (Onboarding grava direto nelas via setUserState)
    const tipoLeg = localStorage.getItem("tacerto_tipo") || localStorage.getItem("tacerto_perfil");
    const mes = localStorage.getItem("tacerto_mes_abertura");
    const ano = localStorage.getItem("tacerto_ano_abertura");
    const fatLeg = localStorage.getItem("tacerto_faturado");
    const nomeLeg = localStorage.getItem("tacerto_nome");
    const emailLeg = localStorage.getItem("tacerto_email");
    const visitanteLeg = localStorage.getItem("tacerto_visitante");
    return {
      ...DEFAULT_STATE,
      nome: nomeLeg || "",
      email: emailLeg || null,
      visitante: visitanteLeg === "false" ? false : true,
      tipoMEI: normalizarTipo(tipoLeg),
      mesAnoAbertura: mes && ano ? { mes: Number(mes), ano: Number(ano) } : null,
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
  /* v3: estado atual e conta logada, para os efeitos assincronos */
  const stateRef = useRef(state);
  stateRef.current = state;
  const userIdRef = useRef(null);
  const timerVelocimetroRef = useRef(null);

  // ------------------------------------------------------------------
  // PONTE COM O SUPABASE AUTH
  //
  // O login do Supabase (Login.jsx / Cadastro.jsx) guarda a sessão, mas o
  // resto do app decidia "logado ou não" só pelo localStorage — as duas
  // metades não conversavam. Este efeito conecta as duas:
  //   - Ao logar: busca o perfil na tabela `perfis` e joga pro estado.
  //   - Ao deslogar: marca visitante e limpa identidade.
  // Assim `visitante` passa a refletir a sessão REAL do Supabase.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    let ativo = true;

    async function carregarPerfil(user) {
      if (!user) {
        // Sem sessão → visitante. Não apaga lançamentos locais (modo demo).
        if (!ativo) return;
        userIdRef.current = null;
        setState((s) => ({ ...s, visitante: true, email: null }));
        return;
      }
      userIdRef.current = user.id;
      // Tem sessão → busca o perfil no banco
      try {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("nome, tipo_mei, mes_abertura, ano_abertura, email")
          .eq("id", user.id)
          .single();

        if (!ativo) return;

        setState((s) => ({
          ...s,
          visitante: false,
          email: perfil?.email || user.email || s.email,
          nome: perfil?.nome || s.nome,
          tipoMEI: normalizarTipo(perfil?.tipo_mei || s.tipoMEI),
          mesAnoAbertura:
            perfil?.mes_abertura && perfil?.ano_abertura
              ? { mes: Number(perfil.mes_abertura), ano: Number(perfil.ano_abertura) }
              : s.mesAnoAbertura,
        }));

        // Busca os lançamentos do usuário no banco e substitui os locais.
        // v3: com criado_em (plano B do "Atualizado em" do velocimetro)
        const { data: lancs } = await supabase
          .from("lancamentos")
          .select("id, descricao, valor, data, criado_em")
          .eq("user_id", user.id)
          .order("data", { ascending: false });

        if (!ativo) return;
        setState((s) => ({
          ...s,
          lancamentos: Array.isArray(lancs)
            ? lancs.map((l) => ({ ...l, valor: Number(l.valor) || 0 }))
            : s.lancamentos,
        }));

        // v3: campos novos do perfil, numa consulta SEPARADA (ver topo)
        await carregarExtras(user.id);
      } catch {
        // Falha ao buscar perfil não deve derrubar a sessão.
        if (!ativo) return;
        setState((s) => ({ ...s, visitante: false, email: user.email || s.email }));
      }
    }

    /* v3: le os campos novos. Coluna ainda nao existe (SQL nao rodou):
       fica com o que o aparelho guardou, se for desta conta. Existe:
       junta banco + aparelho e sobe para o banco o que so estava aqui. */
    async function carregarExtras(userId) {
      const local = stateRef.current.donoExtras === userId ? stateRef.current : EXTRAS_VAZIOS;
      let linha = null;
      try {
        const { data, error } = await supabase
          .from("perfis")
          .select(COLUNAS_PERFIL_NOVAS)
          .eq("id", userId)
          .single();
        if (!error) linha = data;
      } catch { /* sem rede */ }
      if (!ativo) return;

      if (!linha) {
        setState((s) => (s.donoExtras === userId ? s : { ...s, ...EXTRAS_VAZIOS, donoExtras: userId }));
        return;
      }
      const { mesclado, subir } = mesclarExtras(perfilNovoDoBanco(linha), local);
      setState((s) => ({ ...s, ...mesclado, donoExtras: userId }));
      if (Object.keys(subir).length) gravarPerfilNovo(subir);
    }

    // 1) Estado inicial: já tem sessão salva?
    supabase.auth.getUser().then(({ data }) => carregarPerfil(data?.user || null));

    // 2) Reage a login/logout em tempo real.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      carregarPerfil(sessao?.user || null);
    });

    return () => {
      ativo = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

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

  // Persistência única — grava tudo em STORAGE_KEY e espelha as chaves legadas
  // (pra Onboarding/EditarPerfil que ainda usam setUserState continuarem lendo certo
  // via getUserState() síncrono, mas sem duplicar cálculo de limite).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      localStorage.setItem("tacerto_nome", state.nome || "");
      if (state.email != null) localStorage.setItem("tacerto_email", state.email);
      localStorage.setItem("tacerto_visitante", state.visitante ? "true" : "false");
      localStorage.setItem("tacerto_tipo", state.tipoMEI);
      if (state.mesAnoAbertura) {
        localStorage.setItem("tacerto_mes_abertura", String(state.mesAnoAbertura.mes));
        localStorage.setItem("tacerto_ano_abertura", String(state.mesAnoAbertura.ano));
      } else {
        localStorage.removeItem("tacerto_mes_abertura");
        localStorage.removeItem("tacerto_ano_abertura");
      }

      if (!first.current) window.dispatchEvent(new Event(EVT));
    } catch {}
    first.current = false;
  }, [state]);

  // Escuta escritas externas (Onboarding chamando setUserState antes de navegar)
  // e absorve para dentro do estado único, evitando ficar com dois valores.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const tipoLeg = localStorage.getItem("tacerto_tipo");
      const mes = localStorage.getItem("tacerto_mes_abertura");
      const ano = localStorage.getItem("tacerto_ano_abertura");
      const nomeLeg = localStorage.getItem("tacerto_nome");
      const emailLeg = localStorage.getItem("tacerto_email");
      const visitanteLeg = localStorage.getItem("tacerto_visitante");

      setState((s) => {
        const novoTipo = normalizarTipo(tipoLeg || s.tipoMEI);
        const novaAb = mes && ano ? { mes: Number(mes), ano: Number(ano) } : null;
        const novoNome = nomeLeg != null ? nomeLeg : s.nome;
        const novoEmail = emailLeg != null ? emailLeg : s.email;
        const novoVisitante = visitanteLeg != null ? visitanteLeg === "true" : s.visitante;

        const mesmoTipo = novoTipo === s.tipoMEI;
        const mesmaAb =
          (novaAb && s.mesAnoAbertura &&
            novaAb.mes === s.mesAnoAbertura.mes &&
            novaAb.ano === s.mesAnoAbertura.ano) ||
          (novaAb == null && s.mesAnoAbertura == null);
        const mesmoNome = novoNome === s.nome;
        const mesmoEmail = novoEmail === s.email;
        const mesmoVisitante = novoVisitante === s.visitante;

        if (mesmoTipo && mesmaAb && mesmoNome && mesmoEmail && mesmoVisitante) return s;
        return {
          ...s,
          tipoMEI: novoTipo,
          mesAnoAbertura: novaAb,
          nome: novoNome,
          email: novoEmail,
          visitante: novoVisitante,
        };
      });
    };
    window.addEventListener("tacerto-user-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tacerto-user-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /* ------------------------------------------------------------------
     v3 — "ATUALIZADO EM" DO VELOCIMETRO
     Toda mudanca nos lancamentos (lancar, editar, apagar, extrato
     conferido) marca a data e hora. Aparece no Inicio ("Atualizado em
     08/10 às 14:32") e vai para perfis.velocimetro_atualizado_em.
     A gravacao no banco espera 0,8 s: a conferencia do extrato cria
     varios lancamentos de uma vez, e assim vai UMA gravacao so.
     ------------------------------------------------------------------ */
  const marcarVelocimetroAtualizado = useCallback(() => {
    const agora = new Date().toISOString();
    setState((s) => ({ ...s, velocimetroAtualizadoEm: agora, donoExtras: userIdRef.current || s.donoExtras }));
    clearTimeout(timerVelocimetroRef.current);
    timerVelocimetroRef.current = setTimeout(() => {
      gravarPerfilNovo({ velocimetroAtualizadoEm: agora });
    }, 800);
  }, []);

  /* v3: CNPJ confirmado (ou so digitado) — Onboarding e Perfil.
     `dados`: { cnpj, cnae, cnaesSecundarios, dataOpcaoMei, cnpjConfirmado } */
  const salvarDadosCnpj = useCallback(async (dados = {}) => {
    const patch = {};
    for (const campo of ["cnpj", "cnae", "cnaesSecundarios", "dataOpcaoMei", "cnpjConfirmado"]) {
      if (dados[campo] !== undefined) patch[campo] = dados[campo];
    }
    setState((s) => ({ ...s, ...patch, donoExtras: userIdRef.current || s.donoExtras }));
    return gravarPerfilNovo(patch);
  }, []);

  /* v3: lembrete do DAS (Preferencias). dias = [] e "nao quero lembretes" */
  const salvarLembreteDas = useCallback(async ({ dias, hora } = {}) => {
    const patch = {};
    if (dias !== undefined) patch.lembreteDasDias = dias;
    if (hora !== undefined) patch.lembreteDasHora = hora;
    setState((s) => ({ ...s, ...patch, donoExtras: userIdRef.current || s.donoExtras }));
    return gravarPerfilNovo(patch);
  }, []);

  const adicionarLancamento = useCallback((l) => {
    // id temporário local — o banco gera o id definitivo; reconciliamos abaixo.
    const idLocal = uuid();
    let novo;
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
      novo = {
        id: idLocal,
        descricao,
        valor: Number(l.valor) || 0,
        data,
        criado_em: new Date().toISOString(),
      };
      return { ...s, lancamentos: [novo, ...s.lancamentos] };
    });
    marcarVelocimetroAtualizado();

    // Grava no banco (se logado) e troca o id local pelo id real do banco.
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user || !novo) return;
        const { data: inserido } = await supabase
          .from("lancamentos")
          .insert({
            user_id: user.id,
            descricao: novo.descricao,
            valor: novo.valor,
            data: novo.data,
          })
          .select("id")
          .single();
        if (inserido?.id) {
          setState((s) => ({
            ...s,
            lancamentos: s.lancamentos.map((x) =>
              x.id === idLocal ? { ...x, id: inserido.id } : x,
            ),
          }));
        }
      } catch {
        /* visitante ou falha de rede — segue só no local */
      }
    })();
  }, [marcarVelocimetroAtualizado]);

  const atualizarLancamento = useCallback((id, dados) => {
    setState((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((l) => (l.id === id ? { ...l, ...dados } : l)),
    }));
    marcarVelocimetroAtualizado();

    // Espelha a edição no banco (só os campos que o banco conhece).
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const patch = {};
        if (dados.descricao !== undefined) patch.descricao = dados.descricao;
        if (dados.valor !== undefined) patch.valor = Number(dados.valor) || 0;
        if (dados.data !== undefined) patch.data = dados.data;
        if (Object.keys(patch).length === 0) return;
        await supabase.from("lancamentos").update(patch).eq("id", id);
      } catch {
        /* visitante ou falha de rede — segue só no local */
      }
    })();
  }, [marcarVelocimetroAtualizado]);

  const removerLancamento = useCallback((id) => {
    setState((s) => ({ ...s, lancamentos: s.lancamentos.filter((l) => l.id !== id) }));
    marcarVelocimetroAtualizado();

    // Espelha a remoção no banco.
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        await supabase.from("lancamentos").delete().eq("id", id);
      } catch {
        /* visitante ou falha de rede — segue só no local */
      }
    })();
  }, [marcarVelocimetroAtualizado]);

  const removerTodosLancamentos = useCallback(() => {
    setState((s) => ({ ...s, lancamentos: [] }));
    marcarVelocimetroAtualizado();

    // Espelha no banco: apaga todos os lançamentos do usuário logado.
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;
        await supabase.from("lancamentos").delete().eq("user_id", user.id);
      } catch {
        /* visitante ou falha de rede — segue só no local */
      }
    })();
  }, [marcarVelocimetroAtualizado]);

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

  const setNome = useCallback((nome) => {
    setState((s) => ({ ...s, nome: String(nome ?? "") }));
  }, []);

  const setEmail = useCallback((email) => {
    setState((s) => ({ ...s, email: email != null ? String(email) : null }));
  }, []);

  const setVisitante = useCallback((v) => {
    setState((s) => ({ ...s, visitante: !!v }));
  }, []);

  const resetarConta = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

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

  const limiteCheio = LIMITES_ANUAIS[state.tipoMEI];

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

  // ------------------------------------------------------------------
  // MÉDIA MENSAL (v2 — 26/09/2026): o RITMO do ano.
  //
  //   faturado no ano ÷ meses que já passaram (contando o mês atual),
  //   a partir de janeiro — ou do mês de abertura, se o MEI abriu este ano.
  //
  // É o que o velocímetro da média (card B do Dashboard) compara com a
  // MÉDIA LIMITE (limite cheio do ano ÷ 12): se a média ficar até ela, o
  // ano fecha dentro do limite. Vale também para o 1º ano, porque o
  // limite proporcional é justamente "média limite × meses ativos".
  //
  // ANTES dividia só pelos meses QUE TINHAM lançamento. Um único mês bom
  // e o resto vazio fazia a média parecer enorme (ex.: R$ 20 mil em um
  // mês = "média de R$ 20 mil", mesmo com 8 meses sem nada).
  // ------------------------------------------------------------------
  const mediaMensal = useMemo(() => {
    const mesAtual = new Date().getMonth() + 1;
    const ab = state.mesAnoAbertura;
    const abriuEsteAno = ab && Number(ab.ano) === anoCorrente;
    const mesInicio = abriuEsteAno
      ? Math.min(Math.max(1, Number(ab.mes) || 1), mesAtual)
      : 1;
    const meses = mesAtual - mesInicio + 1;
    return meses > 0 ? faturamentoAtual / meses : 0;
  }, [state.mesAnoAbertura, anoCorrente, faturamentoAtual]);

  // Média limite: quanto dá para faturar por mês, em média, e fechar o
  // ano dentro do limite. R$ 6.750 (MEI) ou R$ 20.966,67 (Caminhoneiro).
  // NÃO é teto mensal — é só referência de controle.
  const mediaLimite = (LIMITES_ANUAIS[state.tipoMEI] ?? LIMITES_ANUAIS.MEI) / 12;

  // Projeção simples: faturamento atual + média mensal * meses restantes no ano.
  const projecaoFimDoAno = useMemo(() => {
    const mesAtual = new Date().getMonth() + 1;
    const mesesRestantes = 12 - mesAtual;
    return faturamentoAtual + mediaMensal * mesesRestantes;
  }, [faturamentoAtual, mediaMensal]);

  /* v3: quando o velocimetro foi atualizado pela ultima vez. Sem a
     coluna nova (SQL nao rodou) ou sem marca ainda: o lancamento criado
     mais recentemente. Nenhum lancamento: null. */
  const ultimaAtualizacaoVelocimetro = useMemo(() => {
    let maior = state.velocimetroAtualizadoEm ? new Date(state.velocimetroAtualizadoEm).getTime() : 0;
    for (const l of state.lancamentos) {
      const t = l.criado_em ? new Date(l.criado_em).getTime() : 0;
      if (t > maior) maior = t;
    }
    return maior > 0 ? new Date(maior).toISOString() : null;
  }, [state.velocimetroAtualizadoEm, state.lancamentos]);

  const value = {
    ...state,
    marcarVelocimetroAtualizado,
    salvarDadosCnpj,
    salvarLembreteDas,
    ultimaAtualizacaoVelocimetro,
    adicionarLancamento,
    atualizarLancamento,
    removerLancamento,
    removerTodosLancamentos,
    setTipoMEI,
    setMesAnoAbertura,
    setModoSimulacao,
    setFaturamentoSimulado,
    setNome,
    setEmail,
    setVisitante,
    resetarConta,
    faturamentoReal,
    faturamentoAtual,
    limiteAtual,
    limiteCheio,
    percentualAtual,
    faltamAtual,
    faixaAtual,
    faturamentoDoMes,
    mediaMensal,
    mediaLimite,
    projecaoFimDoAno,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState precisa estar dentro de <AppStateProvider>");
  return ctx;
}
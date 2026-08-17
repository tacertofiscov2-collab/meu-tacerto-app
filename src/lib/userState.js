import { useAppState } from "@/context/AppStateContext";
/**
 * userState.js — camada de compatibilidade sobre AppStateContext.
 *
 * Antes havia DOIS sistemas de estado paralelos (este arquivo + AppStateContext),
 * sincronizados por eventos — o que causava limites e faturamento divergentes
 * entre telas (ex: Dashboard mostrando um valor, Resumo mostrando outro).
 *
 * Agora useUserState() é só uma ponte de nomes para useAppState(),
 * garantindo uma ÚNICA fonte de verdade.
 */
const FOTO_KEY = "tacerto_foto_usuario";
export function useUserState() {
  const app = useAppState();
  return {
    nome: app.nome || "",
    email: app.email || null,
    visitante: app.visitante,
    tipo: app.tipoMEI,
    faturado: app.faturamentoAtual,
    mesAbertura: app.mesAnoAbertura?.mes || null,
    anoAbertura: app.mesAnoAbertura?.ano || null,
    limite: app.limiteAtual,
    limiteCheio: app.limiteCheio,
    setTipo: (tipo) => app.setTipoMEI(tipo),
    setFaturado: (v) => app.setFaturamentoSimulado(v),
    setNome: (nome) => app.setNome(nome),
    setEmail: (email) => app.setEmail(email),
    setVisitante: (v) => app.setVisitante(v),
    setAbertura: (mes, ano) => app.setMesAnoAbertura(mes, ano),
  };
}
// Utilitário síncrono para código fora de componentes React (ex: guards de rota).
export function getUserState() {
  if (typeof window === "undefined") {
    return {
      nome: "",
      email: null,
      visitante: true,
      tipo: "MEI",
      faturado: 0,
      mesAbertura: null,
      anoAbertura: null,
    };
  }
  try {
    const raw = localStorage.getItem("tacerto_app_state");
    const s = raw ? JSON.parse(raw) : {};
    const visitanteRaw = localStorage.getItem("tacerto_visitante");
    return {
      nome: s.nome || localStorage.getItem("tacerto_nome") || "",
      email: s.email || localStorage.getItem("tacerto_email") || null,
      visitante: visitanteRaw === "false" ? false : true,
      tipo: s.tipoMEI || "MEI",
      faturado: s.modoSimulacao
        ? Number(s.faturamentoSimulado) || 0
        : (s.lancamentos || [])
            .filter((l) => new Date(l.data).getFullYear() === new Date().getFullYear())
            .reduce((sum, l) => sum + (Number(l.valor) || 0), 0),
      mesAbertura: s.mesAnoAbertura?.mes || null,
      anoAbertura: s.mesAnoAbertura?.ano || null,
    };
  } catch {
    return {
      nome: "",
      email: null,
      visitante: true,
      tipo: "MEI",
      faturado: 0,
      mesAbertura: null,
      anoAbertura: null,
    };
  }
}
export function setUserState(patch) {
  // Mantido por compatibilidade com chamadas antigas fora de componentes
  // (ex: Onboarding antes de navegar). Escreve nas chaves legadas que o
  // AppStateContext lê na migração/sync — o próprio contexto absorve o patch
  // no próximo evento "tacerto-user-changed".
  //
  // IMPORTANTE (mês/ano de abertura): quando o patch traz `null` — caso de
  // quem abriu o MEI em anos anteriores e responde "já faz tempo" no
  // onboarding — a chave precisa ser REMOVIDA, não ignorada. Antes, `null`
  // não fazia nada e uma data antiga do aparelho continuava valendo, fazendo
  // o Editar perfil mostrar uma data em vez de "Não informado".
  if (typeof window === "undefined") return;
  try {
    if (patch.nome != null) localStorage.setItem("tacerto_nome", String(patch.nome));
    if (patch.email != null) localStorage.setItem("tacerto_email", String(patch.email));
    if (patch.tipo != null) localStorage.setItem("tacerto_tipo", String(patch.tipo));
    if (patch.visitante != null)
      localStorage.setItem("tacerto_visitante", patch.visitante ? "true" : "false");

    // mês de abertura: grava quando tem valor, LIMPA quando vem null explícito
    if (patch.mesAbertura != null) {
      localStorage.setItem("tacerto_mes_abertura", String(patch.mesAbertura));
    } else if ("mesAbertura" in patch) {
      localStorage.removeItem("tacerto_mes_abertura");
    }

    // ano de abertura: mesma regra
    if (patch.anoAbertura != null) {
      localStorage.setItem("tacerto_ano_abertura", String(patch.anoAbertura));
    } else if ("anoAbertura" in patch) {
      localStorage.removeItem("tacerto_ano_abertura");
    }

    window.dispatchEvent(new Event("tacerto-user-changed"));
  } catch {}
}
export function setVisitante(v) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("tacerto_visitante", v ? "true" : "false");
    window.dispatchEvent(new Event("tacerto-user-changed"));
  } catch {}
}
export { FOTO_KEY };
import { useEffect, useState, useSyncExternalStore } from "react";
import { LIMITES_ANUAIS, limiteProporcional } from "./fiscal.js";

// Fonte única do estado do usuário (tipo de MEI, faturamento, abertura).
// Persistido em localStorage, com sincronização entre telas via evento custom.

const EVT = "tacerto-user-changed";

const KEYS = {
  nome: "tacerto_nome",
  tipo: "tacerto_tipo",
  faturado: "tacerto_faturado",
  mesAbertura: "tacerto_mes_abertura",
  anoAbertura: "tacerto_ano_abertura",
  // legado
  perfilLegado: "tacerto_perfil",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizarTipo(v) {
  if (!v) return "MEI";
  const s = String(v).toUpperCase();
  return s === "MEI_CAMINHONEIRO" ? "MEI_CAMINHONEIRO" : "MEI";
}

function ler() {
  if (!isBrowser()) {
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
  let tipoRaw = localStorage.getItem(KEYS.tipo);
  if (!tipoRaw) {
    const legado = localStorage.getItem(KEYS.perfilLegado);
    if (legado) tipoRaw = legado;
  }
  const tipo = normalizarTipo(tipoRaw);
  const faturadoRaw = localStorage.getItem(KEYS.faturado);
  const mesRaw = localStorage.getItem(KEYS.mesAbertura);
  const anoRaw = localStorage.getItem(KEYS.anoAbertura);
  const nomeRaw = localStorage.getItem(KEYS.nome);
  return {
    nome: nomeRaw || "",
    email: null, // modo visitante: e-mail nunca vaza; será populado por sessão real
    visitante: !nomeRaw,
    tipo,
    faturado: faturadoRaw != null ? Number(faturadoRaw) : 0,
    mesAbertura: mesRaw ? Number(mesRaw) : null,
    anoAbertura: anoRaw ? Number(anoRaw) : null,
  };
}

function emit() {
  if (isBrowser()) window.dispatchEvent(new Event(EVT));
}

export function setUserState(patch) {
  if (!isBrowser()) return;
  if (patch.nome != null) localStorage.setItem(KEYS.nome, String(patch.nome));
  if (patch.tipo != null) localStorage.setItem(KEYS.tipo, normalizarTipo(patch.tipo));
  if (patch.faturado != null) localStorage.setItem(KEYS.faturado, String(patch.faturado));
  if (patch.mesAbertura != null) localStorage.setItem(KEYS.mesAbertura, String(patch.mesAbertura));
  if (patch.anoAbertura != null) localStorage.setItem(KEYS.anoAbertura, String(patch.anoAbertura));
  emit();
}

export function getUserState() {
  return ler();
}

function subscribe(cb) {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

// Retorna um snapshot estável entre notificações — evita loop do useSyncExternalStore.
let cache = null;
let cacheKey = "";
function snapshot() {
  const s = ler();
  const key = `${s.nome}|${s.tipo}|${s.faturado}|${s.mesAbertura}|${s.anoAbertura}|${s.visitante}`;
  if (key !== cacheKey) {
    cacheKey = key;
    cache = s;
  }
  return cache;
}
function ssrSnapshot() {
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

export function useUserState() {
  const state = useSyncExternalStore(subscribe, snapshot, ssrSnapshot);
  const anoCorrente = new Date().getFullYear();
  const limite = limiteProporcional(
    state.tipo,
    state.mesAbertura,
    state.anoAbertura,
    anoCorrente
  );
  return {
    ...state,
    limite,
    limiteCheio: LIMITES_ANUAIS[state.tipo],
    setTipo: (tipo) => setUserState({ tipo }),
    setFaturado: (faturado) => setUserState({ faturado }),
    setNome: (nome) => setUserState({ nome }),
    setAbertura: (mes, ano) => setUserState({ mesAbertura: mes, anoAbertura: ano }),
  };
}

// Utilitário para telas legadas que ainda usam apenas useState.
export function useUserStateBasic() {
  const [s, setS] = useState(ler);
  useEffect(() => subscribe(() => setS(ler())), []);
  return s;
}

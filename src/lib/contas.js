// Gestão de contas locais (multi-conta) — array em localStorage.
// Nunca sobrescreve o array; sempre faz append.

const CONTAS_KEY = "tacerto_contas";
const CONTA_ATIVA_KEY = "tacerto_conta_ativa";

function isBrowser() {
  return typeof window !== "undefined";
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function lerContas() {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CONTAS_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function lerContaAtivaId() {
  if (!isBrowser()) return null;
  return localStorage.getItem(CONTA_ATIVA_KEY) || null;
}

export function adicionarConta({ nome, email, ...resto }) {
  if (!isBrowser()) return null;
  const contas = lerContas();
  const nova = {
    id: uuid(),
    nome: nome || (email ? email.split("@")[0] : "Conta"),
    email: email || null,
    criadoEm: new Date().toISOString(),
    ...resto,
  };
  contas.push(nova);
  try {
    localStorage.setItem(CONTAS_KEY, JSON.stringify(contas));
    localStorage.setItem(CONTA_ATIVA_KEY, nova.id);
  } catch {}
  return nova;
}

export function ativarConta(id) {
  if (!isBrowser()) return null;
  const contas = lerContas();
  const conta = contas.find((c) => c.id === id);
  if (!conta) return null;
  try { localStorage.setItem(CONTA_ATIVA_KEY, id); } catch {}
  return conta;
}

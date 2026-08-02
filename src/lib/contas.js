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

/**
 * Remove o ACESSO a uma conta neste aparelho.
 *
 * Isto NÃO exclui a conta de verdade — os dados dela continuam
 * existindo. Serve só para tirar a conta da lista deste dispositivo,
 * como o "remover conta" do Gmail. Para excluir a conta em definitivo,
 * o usuário precisa entrar nela e usar "Excluir conta".
 *
 * Retorna { removida, novaAtivaId }:
 *  - removida: a conta que saiu (ou null se o id não existia)
 *  - novaAtivaId: se a conta removida era a ativa, o id da que assumiu
 *    o lugar (ou null se não sobrou nenhuma).
 */
export function removerAcessoConta(id) {
  if (!isBrowser()) return { removida: null, novaAtivaId: null };

  const contas = lerContas();
  const removida = contas.find((c) => c.id === id) || null;
  if (!removida) return { removida: null, novaAtivaId: lerContaAtivaId() };

  const restantes = contas.filter((c) => c.id !== id);
  let novaAtivaId = lerContaAtivaId();

  // Se saiu a conta ativa, a primeira restante assume.
  if (novaAtivaId === id) {
    novaAtivaId = restantes.length > 0 ? restantes[0].id : null;
  }

  try {
    localStorage.setItem(CONTAS_KEY, JSON.stringify(restantes));
    if (novaAtivaId) {
      localStorage.setItem(CONTA_ATIVA_KEY, novaAtivaId);
    } else {
      localStorage.removeItem(CONTA_ATIVA_KEY);
    }
  } catch {}

  return { removida, novaAtivaId };
}
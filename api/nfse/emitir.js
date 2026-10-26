/* API /api/nfse/emitir v2 — no ambiente "simulado" (padrao) responde sempre, com nota de TESTE; ambientes reais so com NFSE_LIGADA=true (v1: função da Vercel (Node). Recebe a nota do app,
   confere quem está logado no Supabase, lê o perfil e emite pela NFS-e Nacional.
   Ambientes reais (producao-restrita/producao) só com NFSE_LIGADA=true).
   Corpo: { valor, descricao, cTribNac, tomador?: { documento, nome, email } } */
import { emitirNota } from "../../server/nfse/emissao.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;

async function pessoaLogada(token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
  });
  return r.ok ? r.json() : null;
}

async function lerPerfil(token, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/perfis?id=eq.${id}&select=cnpj,cnpj_dados`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
  });
  const [p] = r.ok ? await r.json() : [];
  return p || null;
}

/* O código IBGE do município (exigido na nota) vem dos dados públicos do CNPJ. */
async function codigoIbgeDoCnpj(cnpj) {
  const d = String(cnpj ?? "").replace(/\D/g, "");
  if (d.length !== 14) return null;
  const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${d}`);
  if (!r.ok) return null;
  const c = await r.json();
  return c?.codigo_municipio_ibge ? String(c.codigo_municipio_ibge) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, motivo: "metodo" });
  const ambiente = process.env.NFSE_AMBIENTE || "simulado";
  if (ambiente !== "simulado" && process.env.NFSE_LIGADA !== "true") {
    return res.status(503).json({ ok: false, motivo: "desligada" });
  }
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const user = token && await pessoaLogada(token);
    if (!user?.id) return res.status(401).json({ ok: false, motivo: "sem_login" });
    const perfil = await lerPerfil(token, user.id);
    const codMunicipio = await codigoIbgeDoCnpj(perfil?.cnpj);
    const resultado = await emitirNota({ perfil: { cnpj: perfil?.cnpj, codMunicipio }, nota: req.body || {} });
    return res.status(200).json(resultado);
  } catch (e) {
    console.error("nfse/emitir falhou:", e?.name);
    return res.status(200).json({ ok: false, motivo: "erro", mensagem: e?.message || "Erro ao emitir." });
  }
}

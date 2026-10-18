/* _LIB v1 — peças comuns das funções da Central: projeto, senha (cookie
   assinado), chamada ao GitHub e respostas. O token do GitHub fica só na
   Vercel (variável GITHUB_TOKEN); nunca vai para o celular. */
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { projetos } from "../projetos/index.js";

export function projeto() {
  const id = process.env.PROJETO || "tacerto";
  const p = projetos[id];
  if (!p) throw new Error(`Projeto "${id}" não existe em projetos/index.js`);
  return p;
}

// ---------- respostas ----------
export function json(res, status, dados) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(dados));
}

export function erro(res, status, mensagem) {
  json(res, status, { erro: mensagem });
}

export async function corpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const partes = [];
  for await (const p of req) partes.push(p);
  const txt = Buffer.concat(partes).toString("utf8");
  return txt ? JSON.parse(txt) : {};
}

// ---------- senha / sessão ----------
const COOKIE = "central_sessao";
const DIAS = 90;

function segredo() {
  // Sem variável extra: deriva da senha + token (trocar a senha derruba as sessões).
  const base =
    process.env.CENTRAL_SEGREDO ||
    `${process.env.CENTRAL_SENHA || ""}|${process.env.GITHUB_TOKEN || ""}`;
  return createHash("sha256").update(base).digest();
}

function assinar(txt) {
  return createHmac("sha256", segredo()).update(txt).digest("base64url");
}

export function senhaConfere(tentativa) {
  const certa = process.env.CENTRAL_SENHA || "";
  if (!certa) return false;
  const a = createHash("sha256").update(String(tentativa || "")).digest();
  const b = createHash("sha256").update(certa).digest();
  return timingSafeEqual(a, b);
}

export function criarSessao(res) {
  const ate = Date.now() + DIAS * 864e5;
  const valor = `${ate}.${assinar(String(ate))}`;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${valor}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Strict`
  );
}

export function apagarSessao(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
}

function lerCookie(req) {
  const c = req.headers.cookie || "";
  const m = c.split(/;\s*/).find((x) => x.startsWith(COOKIE + "="));
  return m ? m.slice(COOKIE.length + 1) : "";
}

export function logado(req) {
  const [ate, assinatura] = lerCookie(req).split(".");
  if (!ate || !assinatura) return false;
  if (Number(ate) < Date.now()) return false;
  const certa = assinar(ate);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(certa);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Para as funções: devolve false (e já responde 401) se não estiver logado. */
export function exigirLogin(req, res) {
  if (!process.env.CENTRAL_SENHA) {
    erro(res, 500, "Falta a variável CENTRAL_SENHA na Vercel.");
    return false;
  }
  if (!logado(req)) {
    erro(res, 401, "Entre com a senha.");
    return false;
  }
  return true;
}

// ---------- GitHub ----------
export async function gh(caminho, { metodo = "GET", dados, cru = false } = {}) {
  const url = caminho.startsWith("http") ? caminho : `https://api.github.com${caminho}`;
  const cab = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "central-pwa",
  };
  if (process.env.GITHUB_TOKEN) cab.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  if (dados) cab["Content-Type"] = "application/json";
  const r = await fetch(url, {
    method: metodo,
    headers: cab,
    body: dados ? JSON.stringify(dados) : undefined,
    redirect: "follow",
  });
  if (cru) return r;
  if (r.status === 204) return null;
  const txt = await r.text();
  let corpoResp = null;
  try {
    corpoResp = txt ? JSON.parse(txt) : null;
  } catch {
    corpoResp = { message: txt };
  }
  if (!r.ok) {
    const e = new Error(corpoResp?.message || `GitHub respondeu ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return corpoResp;
}

export function repo() {
  return `/repos/${projeto().repo}`;
}

/** "Pedido #12", "pedido 12", "#12" no título/resumo do PR → [12] */
export function pedidosCitados(texto = "") {
  const achados = new Set();
  for (const m of String(texto).matchAll(/pedido\s*#?\s*(\d+)/gi)) achados.add(Number(m[1]));
  return [...achados];
}

/** Envolve a função: trata erro do GitHub e responde em português. */
export function rota(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      const msg =
        e.status === 401
          ? "O token do GitHub na Vercel está errado ou venceu."
          : e.status === 403 || e.status === 404
            ? "O token do GitHub não tem permissão para isso (confira as permissões)."
            : e.message || "Erro inesperado.";
      erro(res, e.status && e.status < 600 ? (e.status === 404 ? 403 : e.status) : 500, msg);
    }
  };
}

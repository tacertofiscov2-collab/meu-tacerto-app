/* ENTRAR v1 — confere a senha e cria a sessão (90 dias). DELETE = sair. */
import { senhaConfere, criarSessao, apagarSessao, json, erro, corpo } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    apagarSessao(res);
    return json(res, 200, { ok: true });
  }
  if (req.method !== "POST") return erro(res, 405, "Use POST.");
  if (!process.env.CENTRAL_SENHA) return erro(res, 500, "Falta a variável CENTRAL_SENHA na Vercel.");
  const { senha } = await corpo(req).catch(() => ({}));
  if (!senhaConfere(senha)) {
    await new Promise((r) => setTimeout(r, 800)); // freia quem tenta adivinhar
    return erro(res, 401, "Senha errada.");
  }
  criarSessao(res);
  json(res, 200, { ok: true });
}

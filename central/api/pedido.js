/* PEDIDO v1 — cria o pedido como issue no GitHub (etiquetas "pedido" e
   "para:chatgpt"/"para:claude") e devolve o texto pronto para colar. */
import { repo, gh, json, erro, corpo, exigirLogin, rota } from "./_lib.js";
import { montarPrompt, MARCA_INI, MARCA_FIM } from "./_prompts.js";

export default rota(async (req, res) => {
  if (!exigirLogin(req, res)) return;
  if (req.method !== "POST") return erro(res, 405, "Use POST.");
  const { para, texto, soResponder } = await corpo(req);
  if (!["chatgpt", "claude"].includes(para)) return erro(res, 400, "Escolha ChatGPT ou Claude.");
  const limpo = String(texto || "").trim();
  if (limpo.length < 5) return erro(res, 400, "Escreva o pedido.");
  if (limpo.length > 8000) return erro(res, 400, "Pedido muito grande (máximo 8.000 letras).");

  const primeiraLinha = limpo.split("\n")[0];
  const titulo = primeiraLinha.length > 70 ? primeiraLinha.slice(0, 67) + "…" : primeiraLinha;

  // 1) cria a issue para ganhar o número
  const issue = await gh(`${repo()}/issues`, {
    metodo: "POST",
    dados: {
      title: titulo,
      body: limpo,
      labels: ["pedido", `para:${para}`],
    },
  });

  // 2) monta o texto com o número e guarda no próprio pedido
  const prompt = montarPrompt({ numero: issue.number, para, texto: limpo, soResponder: !!soResponder });
  const corpoFinal = [
    limpo,
    "",
    "---",
    `Para: **${para === "claude" ? "Claude" : "ChatGPT"}** · criado pela Central`,
    "",
    MARCA_INI,
    "```text",
    prompt,
    "```",
    MARCA_FIM,
  ].join("\n");
  await gh(`${repo()}/issues/${issue.number}`, { metodo: "PATCH", dados: { body: corpoFinal } });

  json(res, 200, { numero: issue.number, url: issue.html_url, prompt });
});

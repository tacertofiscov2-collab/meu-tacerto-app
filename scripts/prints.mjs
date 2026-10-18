/* PRINTS v1 — robô de prints da Central: abre cada rota da prévia no
   tamanho do iPhone (390 x 844) e salva PNG + info.json.
   Uso: node prints.mjs <arquivo-de-rotas> <pasta-de-saida>
   Variáveis: URL (obrigatória), BRANCH, SHA, VERCEL_BYPASS (opcional). */
import { chromium, devices } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [arqRotas, saida] = process.argv.slice(2);
const base = (process.env.URL || "").replace(/\/$/, "");
if (!base || !arqRotas || !saida) {
  console.error("faltou URL, arquivo de rotas ou pasta de saída");
  process.exit(1);
}

// Cada linha: "/caminho | Nome bonito". Linha com # é comentário.
const rotas = readFileSync(arqRotas, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [caminho, nome] = l.split("|").map((x) => x.trim());
    return { caminho, nome: nome || caminho };
  });

const cabecalhos = { "x-vercel-skip-toolbar": "1" }; // esconde a barrinha da Vercel
if (process.env.VERCEL_BYPASS) {
  cabecalhos["x-vercel-protection-bypass"] = process.env.VERCEL_BYPASS;
  cabecalhos["x-vercel-set-bypass-cookie"] = "true";
}

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  ...devices["iPhone 13"],
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
  extraHTTPHeaders: cabecalhos,
});

const feitos = [];
for (const [i, r] of rotas.entries()) {
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(String(e.message || e)));
  pagina.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  const arquivo = `${String(i + 1).padStart(2, "0")}.png`;
  try {
    await pagina.goto(base + r.caminho, { waitUntil: "networkidle", timeout: 30000 });
    await pagina.waitForTimeout(1500); // animações de entrada
    await pagina.screenshot({ path: join(saida, arquivo) });
    feitos.push({ arquivo, nome: r.nome, caminho: r.caminho, erros: erros.slice(0, 5) });
    console.log("ok", r.caminho);
  } catch (e) {
    feitos.push({ arquivo: null, nome: r.nome, caminho: r.caminho, erros: [String(e.message || e)] });
    console.log("falhou", r.caminho, e.message);
  }
  await pagina.close();
}
await navegador.close();

writeFileSync(
  join(saida, "info.json"),
  JSON.stringify(
    {
      url: base,
      branch: process.env.BRANCH || "",
      sha: process.env.SHA || "",
      quando: new Date().toISOString(),
      telas: feitos,
    },
    null,
    2
  )
);
if (!feitos.some((f) => f.arquivo)) process.exit(1);

/* ESTADO v1 — tudo que a tela inicial mostra, numa chamada só:
   PRs abertos, pedidos, prévias da Vercel, diário e robô de prints. */
import { projeto, repo, gh, json, exigirLogin, pedidosCitados, rota } from "./_lib.js";
import { promptDoCorpo } from "./_prompts.js";

async function lerPRs(p) {
  const lista = await gh(`${repo()}/pulls?state=open&per_page=30&sort=created&direction=desc`);
  return lista.map((pr) => {
    const base = pr.base.ref;
    const head = pr.head.ref;
    const deAgente = /^(codex|claude)\//.test(head);
    let tipo = "outro";
    if (base === p.branchPiloto) tipo = "juntar";
    else if (p.branchesProtegidas.includes(base)) tipo = deAgente ? "destino-errado" : "so-claude";
    return {
      numero: pr.number,
      titulo: pr.title,
      base,
      head,
      sha: pr.head.sha,
      autor: pr.user?.login || "",
      criado: pr.created_at,
      rascunho: !!pr.draft,
      url: pr.html_url,
      pedidos: pedidosCitados(`${pr.title}\n${pr.body || ""}\n${head}`),
      tipo,
    };
  });
}

async function lerPedidos(prs) {
  const lista = await gh(`${repo()}/issues?labels=pedido&state=all&per_page=20&sort=created&direction=desc`);
  return lista
    .filter((i) => !i.pull_request)
    .map((i) => {
      const nomes = (i.labels || []).map((l) => (typeof l === "string" ? l : l.name));
      const para = nomes.includes("para:claude") ? "claude" : "chatgpt";
      const pr = prs.find((x) => x.pedidos.includes(i.number));
      let estado = "aguardando";
      if (i.state === "closed") estado = "feito";
      else if (pr) estado = "pronto";
      return {
        numero: i.number,
        titulo: i.title,
        para,
        estado,
        pr: pr ? pr.numero : null,
        criado: i.created_at,
        fechado: i.closed_at,
        url: i.html_url,
        prompt: promptDoCorpo(i.body || ""),
      };
    });
}

/** Endereço fixo da branch na Vercel (abre sem login, ao contrário do
    endereço único de cada deploy). Nome grande demais: a Vercel encurta
    com um código, então usa o endereço do deploy. */
function urlDaBranch(p, branch) {
  if (!p.previaDaBranch) return "";
  const slug = branch.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const url = p.previaDaBranch.replace("{branch}", slug);
  const sub = url.replace(/^https:\/\//, "").split(".")[0];
  return sub.length <= 63 ? url : "";
}

async function lerPrevias(p, prs) {
  const [deploys, branches] = await Promise.all([
    gh(`${repo()}/deployments?per_page=30`),
    gh(`${repo()}/branches?per_page=100`).catch(() => []),
  ]);
  const shaParaBranch = new Map();
  for (const b of branches) shaParaBranch.set(b.commit.sha, b.name);
  for (const pr of prs) if (!shaParaBranch.has(pr.sha)) shaParaBranch.set(pr.sha, pr.head);

  const doApp = deploys.filter((d) => (d.environment || "").includes(p.ambientePrevia));
  const vistos = new Set();
  const candidatos = [];
  for (const d of doApp) {
    const branch = shaParaBranch.get(d.sha);
    if (!branch || vistos.has(branch)) continue; // só o mais novo de cada branch ainda viva
    vistos.add(branch);
    candidatos.push({ d, branch });
    if (candidatos.length >= 8) break;
  }
  const comStatus = await Promise.all(
    candidatos.map(async ({ d, branch }) => {
      const st = await gh(`${repo()}/deployments/${d.id}/statuses?per_page=1`).catch(() => []);
      const s = st[0];
      return {
        branch,
        sha: d.sha,
        quando: s?.created_at || d.created_at,
        estado: s?.state || "pending",
        url: urlDaBranch(p, branch) || s?.environment_url || s?.target_url || "",
        producao: /production/i.test(d.environment || ""),
      };
    })
  );
  return comStatus.filter((x) => x.estado === "success" && x.url);
}

async function lerDiario(p) {
  try {
    const arq = await gh(
      `${repo()}/contents/${p.arquivoDiario}?ref=${encodeURIComponent(p.branchPiloto)}`
    );
    const txt = Buffer.from(arq.content || "", "base64").toString("utf8");
    const depois = txt.split("## Registro")[1] || "";
    return depois
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .slice(0, 6)
      .map((l) => l.slice(2).trim());
  } catch {
    return [];
  }
}

async function lerRobo(p) {
  try {
    const r = await gh(`${repo()}/actions/workflows/${p.workflowPrints}/runs?per_page=5`);
    const rodando = (r.workflow_runs || []).filter((x) => x.status !== "completed").length;
    return { rodando };
  } catch {
    return { rodando: 0 };
  }
}

export default rota(async (req, res) => {
  if (!exigirLogin(req, res)) return;
  const p = projeto();
  const prs = await lerPRs(p);
  const [pedidos, previas, diario, robo] = await Promise.all([
    lerPedidos(prs),
    lerPrevias(p, prs).catch(() => []),
    lerDiario(p),
    lerRobo(p),
  ]);
  json(res, 200, {
    projeto: {
      id: p.id,
      nome: p.nome,
      nomeCurto: p.nomeCurto,
      repo: p.repo,
      branchPiloto: p.branchPiloto,
      links: p.links,
      agentes: p.agentes,
    },
    prs,
    pedidos,
    previas,
    diario,
    robo,
    agora: new Date().toISOString(),
  });
});

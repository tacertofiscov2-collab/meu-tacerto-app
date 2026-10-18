/* PRINTS v1 — prints do robô (GitHub Actions, prints.yml).
   GET                      → lista dos conjuntos de prints (mais novos primeiro)
   GET ?id=123              → info.json daquele conjunto
   GET ?id=123&arquivo=01.png → a imagem
   POST {url, branch}       → pede um print novo daquela prévia */
import { unzipSync, strFromU8 } from "fflate";
import { projeto, repo, gh, json, erro, corpo, exigirLogin, rota } from "./_lib.js";

const cache = new Map(); // id → arquivos do zip (fica enquanto a função está quente)

async function abrirZip(id) {
  if (cache.has(id)) return cache.get(id);
  const r = await gh(`${repo()}/actions/artifacts/${id}/zip`, { cru: true });
  if (!r.ok) {
    const e = new Error(r.status === 410 ? "Esses prints já venceram (14 dias)." : "Não consegui baixar os prints.");
    e.status = r.status === 410 ? 410 : 502;
    throw e;
  }
  const arquivos = unzipSync(new Uint8Array(await r.arrayBuffer()));
  if (cache.size > 8) cache.delete(cache.keys().next().value);
  cache.set(id, arquivos);
  return arquivos;
}

function separarNome(nome) {
  // prints__<branch>__<sha7>
  const [, branch = "", sha = ""] = nome.split("__");
  return { branch, sha };
}

export default rota(async (req, res) => {
  if (!exigirLogin(req, res)) return;
  const p = projeto();
  const url = new URL(req.url, "http://x");

  if (req.method === "POST") {
    const { url: alvo, branch } = await corpo(req);
    if (!/^https:\/\/[a-z0-9.-]+\.vercel\.app\/?$/i.test(String(alvo || ""))) {
      return erro(res, 400, "Endereço de prévia inválido.");
    }
    await gh(`${repo()}/actions/workflows/${p.workflowPrints}/dispatches`, {
      metodo: "POST",
      dados: { ref: p.branchPiloto, inputs: { url: alvo, branch: String(branch || "") } },
    });
    return json(res, 200, { ok: true, mensagem: "Pedi os prints. Ficam prontos em uns 2 minutos." });
  }

  const id = url.searchParams.get("id");
  const arquivo = url.searchParams.get("arquivo");

  if (!id) {
    const r = await gh(`${repo()}/actions/artifacts?per_page=40`);
    const conjuntos = (r.artifacts || [])
      .filter((a) => a.name.startsWith("prints__") && !a.expired)
      .map((a) => ({ id: a.id, ...separarNome(a.name), criado: a.created_at, tamanho: a.size_in_bytes }));
    return json(res, 200, { conjuntos });
  }

  if (!/^\d+$/.test(id)) return erro(res, 400, "id inválido.");
  const arquivos = await abrirZip(id);

  if (!arquivo) {
    const info = arquivos["info.json"] ? JSON.parse(strFromU8(arquivos["info.json"])) : { telas: [] };
    return json(res, 200, info);
  }

  if (!/^\d{2}\.png$/.test(arquivo) || !arquivos[arquivo]) return erro(res, 404, "Imagem não encontrada.");
  res.statusCode = 200;
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "private, max-age=1209600, immutable"); // o conjunto nunca muda
  res.end(Buffer.from(arquivos[arquivo]));
});

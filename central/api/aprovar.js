/* APROVAR v1 — o que o botão faz:
   - "juntar": merge NORMAL do PR na branch do piloto (nunca squash/rebase,
     nunca na main) e fecha os pedidos citados no PR;
   - "corrigir-destino": PR de agente apontando para a main → piloto;
   - "fechar-pedido": marca um pedido como feito (sem PR). */
import { projeto, repo, gh, json, erro, corpo, exigirLogin, pedidosCitados, rota } from "./_lib.js";

export default rota(async (req, res) => {
  if (!exigirLogin(req, res)) return;
  if (req.method !== "POST") return erro(res, 405, "Use POST.");
  const p = projeto();
  const { acao, numero } = await corpo(req);
  const n = Number(numero);
  if (!Number.isInteger(n) || n <= 0) return erro(res, 400, "Número inválido.");

  if (acao === "fechar-pedido") {
    const issue = await gh(`${repo()}/issues/${n}`);
    const ePedido = (issue.labels || []).some((l) => (l.name || l) === "pedido");
    if (issue.pull_request || !ePedido) return erro(res, 400, "Isso não é um pedido da Central.");
    await gh(`${repo()}/issues/${n}/comments`, {
      metodo: "POST",
      dados: { body: "Marcado como feito pelo Fernando na Central." },
    });
    await gh(`${repo()}/issues/${n}`, { metodo: "PATCH", dados: { state: "closed", state_reason: "completed" } });
    return json(res, 200, { ok: true, mensagem: `Pedido #${n} marcado como feito.` });
  }

  const pr = await gh(`${repo()}/pulls/${n}`);
  if (pr.state !== "open") return erro(res, 400, "Esse PR já foi fechado.");
  const base = pr.base.ref;
  const head = pr.head.ref;

  if (acao === "corrigir-destino") {
    if (!p.branchesProtegidas.includes(base)) return erro(res, 400, "O destino já está certo.");
    if (!/^(codex|claude)\//.test(head)) return erro(res, 400, "Só PR de agente pode ter o destino trocado aqui.");
    await gh(`${repo()}/pulls/${n}`, { metodo: "PATCH", dados: { base: p.branchPiloto } });
    return json(res, 200, { ok: true, mensagem: `PR #${n} agora vai para ${p.branchPiloto}.` });
  }

  if (acao === "juntar") {
    // Trava dupla: nunca juntar na main pela Central.
    if (p.branchesProtegidas.includes(base) || base !== p.branchPiloto) {
      return erro(res, 403, `Pela Central só dá para juntar em ${p.branchPiloto}. A main é só com o Claude.`);
    }
    if (pr.draft) return erro(res, 400, "O PR ainda é rascunho: o agente não terminou.");
    if (pr.mergeable === false) {
      return erro(res, 409, "Esse PR tem conflito com o piloto. Peça ao Claude para resolver.");
    }
    const r = await gh(`${repo()}/pulls/${n}/merge`, {
      metodo: "PUT",
      dados: {
        merge_method: "merge",
        sha: pr.head.sha, // só junta se ninguém mudou o PR depois que a tela carregou
        commit_title: `Merge: ${pr.title} (#${n}) pela Central`,
      },
    });
    if (!r?.merged) return erro(res, 409, r?.message || "O GitHub não deixou juntar.");

    const citados = pedidosCitados(`${pr.title}\n${pr.body || ""}\n${head}`);
    for (const num of citados) {
      try {
        const issue = await gh(`${repo()}/issues/${num}`);
        const ePedido = (issue.labels || []).some((l) => (l.name || l) === "pedido");
        if (!ePedido || issue.state === "closed" || issue.pull_request) continue;
        await gh(`${repo()}/issues/${num}/comments`, {
          metodo: "POST",
          dados: { body: `Feito no PR #${n}, juntado em ${p.branchPiloto} pela Central.` },
        });
        await gh(`${repo()}/issues/${num}`, { metodo: "PATCH", dados: { state: "closed", state_reason: "completed" } });
      } catch {
        /* pedido citado que não existe: ignora */
      }
    }
    return json(res, 200, { ok: true, mensagem: `PR #${n} juntado em ${p.branchPiloto}.`, pedidosFechados: citados });
  }

  erro(res, 400, "Ação desconhecida.");
});

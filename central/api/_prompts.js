/* _PROMPTS v1 — monta o texto que o Fernando cola no ChatGPT ou no Claude.
   Cada agente recebe o próprio papel e as regras do projeto. */
import { projeto } from "./_lib.js";

export function montarPrompt({ numero, para, texto, soResponder }) {
  const p = projeto();
  const branch = `${para === "claude" ? "claude" : "codex"}/pedido-${numero}`;
  const cabecalho = `Pedido #${numero} — ${p.nome.replace(" · Central", "")} (repositório ${p.repo})`;

  if (para === "claude") {
    return [
      cabecalho,
      "",
      "Você é o Claude: patrão, chamado para caso grave.",
      `Leia CLAUDE.md, docs/PAPEIS.md e as últimas linhas de ${p.arquivoDiario} antes de começar.`,
      `Partida: branch ${p.branchPiloto}. Se mudar código, trabalhe na branch ${branch}.`,
      "",
      "O pedido:",
      texto.trim(),
      "",
      soResponder
        ? "Não mude arquivos: só investigue e responda em português simples."
        : [
            "Regras: Supabase só depois do meu \"pode\"; apagar só com \"pode apagar\"; main só com a minha autorização.",
            `Quando terminar: uma linha no topo do registro em ${p.arquivoDiario}, PR para ${p.branchPiloto} com "Pedido #${numero}" no resumo.`,
          ].join("\n"),
    ].join("\n");
  }

  return [
    cabecalho,
    "",
    "Você é o ChatGPT (Codex): operário do dia a dia.",
    "Antes: leia AGENTS.md e docs/PAPEIS.md. Se isto não for função sua, não faça: responda \"Isso é com o Claude: <motivo>.\"",
    `Partida: branch ${p.branchPiloto}. Trabalhe na branch ${branch}.`,
    "",
    "O pedido:",
    texto.trim(),
    "",
    soResponder
      ? "Não mude arquivos: só investigue e responda em português simples."
      : [
          "Quando terminar:",
          "- npx vite build sem erro e node scripts/checar-whatsapp.mjs passando;",
          `- uma linha no topo do registro em ${p.arquivoDiario};`,
          `- PR para ${p.branchPiloto} (nunca main) com "Pedido #${numero}" no resumo.`,
        ].join("\n"),
  ].join("\n");
}

// O texto do prompt fica guardado no próprio pedido (issue), entre marcas.
export const MARCA_INI = "<!-- prompt-central -->";
export const MARCA_FIM = "<!-- /prompt-central -->";

export function promptDoCorpo(corpo = "") {
  const i = corpo.indexOf(MARCA_INI);
  const f = corpo.indexOf(MARCA_FIM);
  if (i < 0 || f < 0) return "";
  return corpo
    .slice(i + MARCA_INI.length, f)
    .replace(/^\s*```text\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

/* PROJETOS v1 — um bloco por projeto. Cada Central na Vercel escolhe o
   seu pela variável PROJETO (padrão: tacerto). Projeto novo = copiar o
   bloco do tacerto, trocar os dados e criar outro projeto na Vercel. */
export const projetos = {
  tacerto: {
    "id": "tacerto",
    "nome": "TaCerto! · Central",
    "nomeCurto": "Central TaCerto",
    "repo": "tacertofiscov2-collab/meu-tacerto-app",
    "branchPiloto": "piloto-simplificado",
    "branchesProtegidas": [
      "main"
    ],
    "ambientePrevia": "meu-tacerto-app",
    "previaDaBranch": "https://meu-tacerto-app-git-{branch}-tacerto1.vercel.app",
    "workflowPrints": "prints.yml",
    "arquivoDiario": "docs/DIARIO.md",
    "cor": "#4ADE80",
    "links": [
      {
        "nome": "Site no ar",
        "url": "https://tacerto-site.vercel.app"
      },
      {
        "nome": "GitHub",
        "url": "https://github.com/tacertofiscov2-collab/meu-tacerto-app"
      },
      {
        "nome": "Vercel",
        "url": "https://vercel.com/dashboard"
      },
      {
        "nome": "Supabase",
        "url": "https://supabase.com/dashboard/project/txejrqynagsfhteaofai"
      }
    ],
    "agentes": {
      "chatgpt": {
        "nome": "ChatGPT",
        "papel": "Dia a dia. Faz no projeto e te avisa.",
        "abrir": "https://chatgpt.com/codex",
        "dica": "Cole, escolha a branch piloto-simplificado e envie."
      },
      "claude": {
        "nome": "Claude",
        "papel": "Caso grave. Revisa e conserta.",
        "abrir": "https://claude.ai/code",
        "dica": "Abra uma conversa nova com o repositório do TaCerto, cole e envie."
      }
    }
  },
};

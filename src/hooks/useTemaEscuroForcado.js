import { useEffect } from "react";

const KEY_TEMA = "tacerto_tema";

/**
 * Hook para telas que devem SEMPRE aparecer no tema escuro (o tema
 * oficial da marca), independente da preferência salva pelo usuário.
 *
 * Regra do app:
 *   - ANTES de entrar (Welcome, Login, primeiro cadastro, Onboarding):
 *     sempre escuro — é a vitrine da marca.
 *   - DEPOIS de entrar (mesmo como visitante): tudo segue a escolha
 *     feita em Preferências.
 *
 * Por isso o hook aceita um parâmetro: telas que servem aos dois
 * fluxos (o /cadastro, por exemplo) passam `false` quando foram
 * abertas de dentro do app.
 *
 * Uso:
 *   useTemaEscuroForcado();          // sempre escuro
 *   useTemaEscuroForcado(condicao);  // escuro só se a condição for true
 */
export default function useTemaEscuroForcado(ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Força escuro nesta tela, seja qual for a preferência do usuário.
    root.classList.remove("theme-light");

    return () => {
      // Ao sair da tela, restaura a preferência real do usuário.
      if (typeof window === "undefined") return;
      try {
        const escolha = localStorage.getItem(KEY_TEMA) || "escuro";
        let modo;
        if (escolha === "claro") modo = "claro";
        else if (escolha === "escuro") modo = "escuro";
        else {
          // "auto": claro de dia, escuro à noite.
          const h = new Date().getHours();
          modo = h >= 6 && h < 18 ? "claro" : "escuro";
        }
        root.classList.remove("theme-light");
        if (modo === "claro") root.classList.add("theme-light");
      } catch {
        // Se der qualquer erro, mantém escuro (o padrão do app).
      }
    };
  }, [ativo]);
}
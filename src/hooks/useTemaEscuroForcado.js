import { useEffect } from "react";

const KEY_TEMA = "tacerto_tema";

/**
 * Hook para telas que devem SEMPRE aparecer no tema escuro (o tema
 * oficial da marca), independente da preferência salva pelo usuário
 * em Preferências (ex: Login, Cadastro, Onboarding, Welcome).
 *
 * Ao montar: remove "theme-light" do <html>, forçando escuro.
 * Ao desmontar: restaura a preferência salva do usuário, para o
 * resto do app continuar respeitando a escolha dele normalmente.
 *
 * Uso: no topo do componente da tela, chamar apenas:
 *   useTemaEscuroForcado();
 */
export default function useTemaEscuroForcado() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Força escuro nesta tela, seja qual for a preferência do usuário.
    root.classList.remove("theme-light");

    return () => {
      // Ao sair da tela, restaura a preferência real do usuário.
      if (typeof window === "undefined") return;
      try {
        const escolha = localStorage.getItem(KEY_TEMA) || "auto";
        let modo;
        if (escolha === "claro") modo = "claro";
        else if (escolha === "escuro") modo = "escuro";
        else {
          const h = new Date().getHours();
          modo = h >= 6 && h < 18 ? "claro" : "escuro";
        }
        root.classList.remove("theme-light");
        if (modo === "claro") root.classList.add("theme-light");
      } catch {
        // Se der qualquer erro, mantém escuro (o padrão do app).
      }
    };
  }, []);
}

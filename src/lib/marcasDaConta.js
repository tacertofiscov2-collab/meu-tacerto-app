/* MARCASDACONTA v1 — marcas simples por conta e por aparelho (explicacao da media lida, notificacoes lidas) */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ===================================================================
   MARCAS DA CONTA (05/10/2026)

   Coisas pequenas que o app precisa lembrar por pessoa, sem mexer no
   banco: "ja leu a explicacao da media", "ja abriu a notificacao da
   apresentacao". Ficam no aparelho (localStorage), separadas por conta
   (id do usuario): uma conta de teste nova comeca do zero. Trocar de
   celular tambem comeca do zero (aceito no piloto).

     const [valor, salvar, carregou] = useMarcaDaConta("tacerto_x", inicial);

   Enquanto a conta carrega, `valor` e o `inicial` e `carregou` e false.
   =================================================================== */
export function useMarcaDaConta(nome, inicial) {
  const [chave, setChave] = useState(null);
  const [valor, setValor] = useState(inicial);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!ativo) return;
        const c = `${nome}_${data?.session?.user?.id || "visitante"}`;
        setChave(c);
        try {
          const salvo = localStorage.getItem(c);
          if (salvo != null) setValor(JSON.parse(salvo));
        } catch { /* ignora */ }
        setCarregou(true);
      })
      .catch(() => { if (ativo) setCarregou(true); });
    return () => { ativo = false; };
  }, [nome]);

  function salvar(novo) {
    setValor(novo);
    try { if (chave) localStorage.setItem(chave, JSON.stringify(novo)); } catch { /* ignora */ }
  }

  return [valor, salvar, carregou];
}

/* USEANOINICIO v1 — o ano em que a pessoa comecou a usar o app (datas antes disso nao interessam) */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ===================================================================
   REGRA DO FERNANDO (28/09/2026): historicos, calendarios e datas ficam
   LIMITADOS ao ano em que a pessoa comecou a usar o app. Antes disso
   nao nos interessa.
     - usou 2026 inteiro -> em 2027 o calendario mostra 2026 e 2027
     - em 2028 -> 2026, 2027 e 2028; e assim por diante.

   "Comecou a usar" = ano de criacao da conta (user.created_at).
   Visitante (sem conta) = ano atual.
   Guardado por conta, para nao buscar de novo a cada tela.
   =================================================================== */

const cache = {}; // user_id -> ano

export default function useAnoInicio() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);

  useEffect(() => {
    let ativo = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const user = data?.user;
        if (!user) return;
        if (!cache[user.id]) {
          const criado = user.created_at ? new Date(user.created_at).getFullYear() : anoAtual;
          cache[user.id] = Math.min(criado, anoAtual);
        }
        if (ativo) setAno(cache[user.id]);
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [anoAtual]);

  return ano;
}
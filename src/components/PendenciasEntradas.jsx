/* PENDENCIASENTRADAS v2 — a faixa abre a conferencia agrupada por pagador (/conferir-entradas) */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { listarPendentes } from "@/lib/openfinance";

/* ===================================================================
   PENDENCIAS DO OPEN FINANCE — A FAIXA

   O que caiu na conta e ainda nao se sabe se é faturamento.

   v2 (27/09/2026): tocar na faixa abre a tela CONFERIR ENTRADAS
   (/conferir-entradas), que agrupa por pagador e faz uma pergunta por
   pagador. Os cards antigos, de UMA entrada por vez ("É faturamento /
   Não é" + "Faço sempre assim?"), sairam daqui.

   COMO USAR (na tela de Novo lançamento):

     import PendenciasEntradas from "@/components/PendenciasEntradas";
     ...
     <PendenciasEntradas />

   Sem pendencia, NAO renderiza nada e a tela fica exatamente como era.

   ALINHAMENTO COM O WHATSAPP: a fonte da verdade é a tabela
   `entradas` no banco, nao a tela. Se a pessoa responder no WhatsApp,
   o status muda no banco e a faixa se atualiza sozinha na proxima vez
   que a lista for lida. Por isso a lista recarrega quando a tela volta
   a ficar visivel.
   =================================================================== */

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PendenciasEntradas() {
  const navigate = useNavigate();
  const [pendentes, setPendentes] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      setPendentes(await listarPendentes(user.id));
    } catch {
      /* visitante ou falha de rede — a faixa simplesmente não aparece */
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Recarrega quando a pessoa volta para o app (alinhado com o WhatsApp).
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [carregar]);

  // Sem pendência, o componente não existe na tela.
  if (!pendentes.length) return null;

  const total = pendentes.reduce((s, e) => s + (Number(e.valor) || 0), 0);

  return (
    <button
      onClick={() => navigate("/conferir-entradas", { state: { de: "lancar" } })}
      className="card-tacerto toque toque-escala w-full rounded-2xl flex items-center gap-3 px-4 py-3.5 text-left"
      style={{ borderColor: "rgba(34,197,94,0.45)" }}
    >
      <span
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{ width: 38, height: 38, backgroundColor: "rgba(34,197,94,0.14)" }}
      >
        <ArrowDownLeft size={19} style={{ color: "var(--primary)" }} />
      </span>

      <span className="flex-1 min-w-0">
        <span
          className="block font-semibold leading-tight"
          style={{ color: "var(--text)", fontSize: 15 }}
        >
          {pendentes.length === 1
            ? "1 entrada esperando você"
            : `${pendentes.length} entradas esperando você`}
        </span>
        <span
          className="block leading-tight"
          style={{ color: "var(--text-secondary)", fontSize: 12.5, marginTop: 2 }}
        >
          R$ {fmt(total)} · toque para conferir
        </span>
      </span>

      <span
        className="rounded-full shrink-0"
        style={{
          width: 9,
          height: 9,
          backgroundColor: "var(--primary)",
          boxShadow: "0 0 8px rgba(34,197,94,0.7)",
        }}
      />
    </button>
  );
}
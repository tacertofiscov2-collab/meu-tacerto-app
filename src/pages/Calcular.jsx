/* CALCULAR v1 — Perfil > Meu MEI > "Calcular" (substitui o "Simulador"): "O que você quer calcular?" com 4 contas (Quanto ainda posso faturar, Imposto de Renda, DAS do ano, Meu lucro) e a barra "Calculado com seus dados até dd/mm" + Enviar extrato (Recomendado) */
import { useNavigate } from "react-router-dom";
import { TrendingUp, Landmark, Receipt, Wallet } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import BarraDadosAte from "../components/BarraDadosAte.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import { MOSTRAR_MEU_LUCRO } from "@/config/piloto";

/* ===================================================================
   CALCULAR (12/10/2026 — tarefa de 10-10, Bloco F)

   Perfil > Meu MEI > "Calcular". As contas (todas com a barra "Calculado
   com seus dados ate dd/mm" no topo — BarraDadosAte):
   1) Quanto ainda posso faturar  -> /simulador (o Simulador de antes:
      previsto no ano, % do limite, mes em que passa, quanto pode por mes)
   2) Imposto de Renda             -> /calcular/imposto-de-renda (a
      calculadora que estava na Declaracao anual)
   3) DAS do ano                   -> /calcular/das-do-ano
   4) Meu lucro                    -> /meu-lucro (atalho)
   Regras e contas: src/lib/declaracao.js (nada solto aqui).
   =================================================================== */

export default function Calcular() {
  const navigate = useNavigate();
  const ir = (rota, state) => navigate(rota, { state: { de: "calcular", ...state } });

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Calcular" onVoltar={voltar} />

        <BarraDadosAte style={{ marginTop: 10 }} />

        <h2 className="font-semibold" style={{ fontSize: 17, color: "var(--text)", marginTop: 28 }}>
          O que você quer calcular?
        </h2>
        <SecaoLista style={{ marginTop: 6 }}>
          <LinhaLista
            Icon={TrendingUp}
            rotulo="Quanto ainda posso faturar"
            detalhe="Previsto no ano e quanto cabe por mês"
            onClick={() => ir("/simulador")}
          />
          <LinhaLista
            Icon={Landmark}
            rotulo="Imposto de Renda"
            detalhe="Quanto é isento e se preciso declarar"
            onClick={() => ir("/calcular/imposto-de-renda?passo=1", { novo: true })}
          />
          <LinhaLista
            Icon={Receipt}
            rotulo="DAS do ano"
            detalhe="Quanto já venceu e quanto falta"
            onClick={() => ir("/calcular/das-do-ano")}
          />
          {MOSTRAR_MEU_LUCRO && (
            <LinhaLista
              Icon={Wallet}
              rotulo="Meu lucro"
              detalhe="Recebido, gastos e quanto sobrou"
              onClick={() => ir("/meu-lucro")}
            />
          )}
        </SecaoLista>
      </div>
    </div>
  );
}

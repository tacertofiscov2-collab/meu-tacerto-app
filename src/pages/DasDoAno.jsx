/* DASDOANO v1 — Calcular > "DAS do ano": quanto e o DAS do ano, quantos ja venceram e quanto falta vencer (com o proximo vencimento) e os pagos que a pessoa guardou no Historico do DAS; nunca diz que um DAS esta "em aberto" */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, CalendarCheck, CalendarClock, FolderCheck } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import BarraDadosAte from "../components/BarraDadosAte.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import { resumoDasDoAno } from "@/lib/declaracao";
import { listarDasDoAno } from "@/lib/das";
import { formatarDiaMes } from "@/lib/vencimentoDas";
import { MOSTRAR_PAGINA_DAS } from "@/config/piloto";

/* ===================================================================
   DAS DO ANO (12/10/2026 — tarefa de 10-10, Bloco F)

   Conta em src/lib/declaracao.js (resumoDasDoAno). Mostra:
   - DAS do ano (valor do mes pela atividade x meses em que e MEI);
   - Ja venceram (quantos e quanto) e Falta vencer (com o proximo dia);
   - Pagos que voce guardou: so os registrados no Historico do DAS
     (das_pagamentos). Sem registro NAO quer dizer que nao pagou: o app
     nunca diz que um DAS esta "em aberto" (so o governo sabe).
   =================================================================== */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export default function DasDoAno() {
  const navigate = useNavigate();
  const { tipoMEI, cnae, cnaesSecundarios, mesAnoAbertura } = useAppState();
  const r = resumoDasDoAno({
    tipo: tipoMEI,
    cnaes: [cnae, ...(cnaesSecundarios || [])].filter(Boolean),
    mesAbertura: mesAnoAbertura?.mes,
    anoAbertura: mesAnoAbertura?.ano,
  });
  const [guardados, setGuardados] = useState(null); // { qtd, soma } ou null

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) return;
        const mapa = await listarDasDoAno(data.user.id, r.ano);
        const lista = Object.values(mapa || {});
        if (ativo) setGuardados({ qtd: lista.length, soma: lista.reduce((s, x) => s + (Number(x.valor) || 0), 0) });
      } catch { /* sem rede: a linha nao aparece */ }
    })();
    return () => { ativo = false; };
  }, [r.ano]);

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/calcular", { replace: true });
  }

  const v = (n) => <Valor px={15.5} peso={600} cor="var(--text)">{n}</Valor>;
  const de = r.mesInicio > 1 ? `De ${MESES[r.mesInicio - 1]} a dezembro` : "12 meses";

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="DAS do ano" onVoltar={voltar} />

        <BarraDadosAte style={{ marginTop: 10 }} />

        <SecaoLista titulo={`Em ${r.ano}`}>
          <LinhaLista
            Icon={Receipt}
            rotulo="DAS do ano"
            detalhe={<span>{de} × <Valor px={13.5} cor="var(--text-tertiary)">{r.valorMes}</Valor></span>}
            valor={v(r.total)}
          />
          <LinhaLista
            Icon={CalendarCheck}
            rotulo="Já venceram"
            detalhe={r.vencidas === 1 ? "1 mês" : `${r.vencidas} meses`}
            valor={v(r.valorVencidas)}
          />
          <LinhaLista
            Icon={CalendarClock}
            rotulo="Falta vencer"
            detalhe={r.aVencer > 0 && r.proximoVencimento
              ? `${r.aVencer === 1 ? "1 mês" : `${r.aVencer} meses`} · próximo ${formatarDiaMes(r.proximoVencimento)}`
              : "Nenhum este ano"}
            valor={v(r.valorAVencer)}
          />
          {guardados && (
            <LinhaLista
              Icon={FolderCheck}
              rotulo="Pagos que você guardou"
              detalhe={guardados.qtd === 0 ? "Nenhum comprovante guardado" : guardados.qtd === 1 ? "1 comprovante" : `${guardados.qtd} comprovantes`}
              valor={guardados.qtd > 0 ? v(guardados.soma) : null}
              onClick={MOSTRAR_PAGINA_DAS ? () => navigate("/das/historico", { state: { de: "calcular" } }) : undefined}
            />
          )}
        </SecaoLista>

        <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 20 }}>
          Valor pela sua atividade, com os valores de {r.ano}. Quem confirma o que já foi pago é a Receita.
        </p>
      </div>
    </div>
  );
}

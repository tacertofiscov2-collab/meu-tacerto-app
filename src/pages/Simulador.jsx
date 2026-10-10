/* SIMULADOR v1 — Simulador do MEI (Perfil > Meu MEI): a pessoa diz quanto recebe por mes (ja vem a media real) e, se quiser, quanto gasta; mostra o previsto no ano, % do limite, o mes em que passaria, quanto ainda pode faturar por mes ate dezembro, o DAS do ano e o Imposto de Renda estimado (contas em src/lib/declaracao.js) */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Gauge, AlertTriangle, CalendarRange, Receipt, Landmark,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import Valor from "../components/Valor.jsx";
import { useAppState } from "@/context/AppStateContext";
import { simularAnoMei } from "@/lib/declaracao";

/* ===================================================================
   SIMULADOR DO MEI (10/10/2026 — tarefa de 08-10, Etapa 7)

   Duas perguntas no topo (campos de 16px, so numeros):
     - Quanto você recebe por mês? (ja vem a media real do ano, que e o
       ritmo do velocimetro — AppState.mediaMensal)
     - Quanto gasta por mês? (opcional; so entra no Imposto de Renda)
   E as respostas, uma por linha (lista simples). Muda na hora, sem
   botao. Nada de regra solta aqui: tudo vem de simularAnoMei
   (src/lib/declaracao.js), que usa fiscal.js e calcularIR.
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MAX_DIGITOS = 9; // ate R$ 9.999.999,00 (em reais, sem centavos)

function reaisDoCampo(texto) {
  const d = String(texto || "").replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITOS);
  return d ? Number(d) : 0;
}

function CampoReais({ rotulo, valor, onMudar, placeholder = "0" }) {
  return (
    <label className="block" style={{ marginTop: 14 }}>
      <span
        className="block font-semibold uppercase"
        style={{ color: "var(--text-tertiary)", fontSize: 12.5, letterSpacing: "0.08em", marginBottom: 8 }}
      >
        {rotulo}
      </span>
      <span className="flex items-center rounded-xl" style={{ border: "1px solid var(--card-borda)" }}>
        <span className="font-bold" style={{ paddingLeft: 14, paddingRight: 6, fontSize: 18, color: "var(--text)" }}>R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={valor > 0 ? valor.toLocaleString("pt-BR") : ""}
          placeholder={placeholder}
          onChange={(e) => onMudar(reaisDoCampo(e.target.value))}
          className="flex-1 min-w-0 bg-transparent font-bold focus:outline-none placeholder:opacity-40"
          style={{ fontSize: 20, padding: "11px 14px 11px 0", color: "var(--text)" }}
        />
      </span>
    </label>
  );
}

export default function Simulador() {
  const navigate = useNavigate();
  const { tipoMEI, cnae, cnaesSecundarios, mesAnoAbertura, faturamentoAtual, mediaMensal } = useAppState();
  const [recebe, setRecebe] = useState(() => Math.round(Number(mediaMensal) || 0));
  const [gasta, setGasta] = useState(0);

  const s = useMemo(
    () => simularAnoMei({
      tipo: tipoMEI,
      cnaes: [cnae, ...(cnaesSecundarios || [])].filter(Boolean),
      mesAbertura: mesAnoAbertura?.mes,
      anoAbertura: mesAnoAbertura?.ano,
      faturadoAteAgora: faturamentoAtual,
      recebeMes: recebe,
      gastaMes: gasta,
    }),
    [tipoMEI, cnae, cnaesSecundarios, mesAnoAbertura, faturamentoAtual, recebe, gasta],
  );

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  const v = (n, cor) => <Valor px={15.5} peso={600} cor={cor || "var(--text)"}>{n}</Valor>;
  const passa = s.mesQuePassa != null;

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="conteudo-rolavel hide-scrollbar px-5" style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}>
        <TopoRolavel titulo="Simulador" onVoltar={voltar} />

        <CampoReais rotulo="Quanto você recebe por mês" valor={recebe} onMudar={setRecebe} />
        <CampoReais rotulo="Quanto gasta por mês (opcional)" valor={gasta} onMudar={setGasta} />

        <SecaoLista titulo={`Em ${s.ano}`}>
          <LinhaLista Icon={TrendingUp} rotulo="Faturamento previsto" valor={v(s.previsto)} />
          <LinhaLista
            Icon={Gauge}
            rotulo="Do limite"
            detalhe={<span>Limite <Valor px={13.5} cor="var(--text-tertiary)">{s.limite}</Valor>{s.proporcional ? " (proporcional)" : ""}</span>}
            valor={`${Math.round(s.pctDoLimite)}%`}
          />
          <LinhaLista
            Icon={AlertTriangle}
            rotulo={passa ? "Passa do limite em" : "Passa do limite?"}
            valor={<span style={{ color: passa ? "var(--danger)" : "var(--text-secondary)" }}>{passa ? MESES[s.mesQuePassa - 1] : "Não passa"}</span>}
          />
          <LinhaLista
            Icon={CalendarRange}
            rotulo="Ainda pode faturar por mês"
            detalhe="Até dezembro, sem passar do limite"
            valor={v(s.podePorMes)}
          />
          <LinhaLista Icon={Receipt} rotulo="DAS do ano" valor={v(s.dasDoAno)} />
          <LinhaLista
            Icon={Landmark}
            rotulo="Imposto de Renda"
            detalhe={<span>Parte isenta <Valor px={13.5} cor="var(--text-tertiary)">{s.ir.isenta}</Valor></span>}
            valor={s.ir.dentroDaIsencaoNova ? "Provavelmente zero" : "Pode ter imposto"}
          />
        </SecaoLista>

        <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text-tertiary)", marginTop: 20 }}>
          Estimativa com as regras de hoje.
        </p>
      </div>
    </div>
  );
}

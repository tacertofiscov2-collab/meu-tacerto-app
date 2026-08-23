import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import VelocimetroAnimado from "../components/VelocimetroAnimado.jsx";
import { useUserState } from "@/lib/userState";
import {
  calcularPercentual,
  calcularFaltamOuExcedeu,
  faixaDoVelocimetro,
  FAIXA_INFO,
} from "@/lib/fiscal";


function faixaDoPercentual(p) {
  const chave = faixaDoVelocimetro(p);
  const info = FAIXA_INFO[chave];
  return { cor: info.cor, chave, mensagem: info.mensagem, textoDetalhado: info.textoDetalhado };
}

export default function Velocimetro() {
  const navigate = useNavigate();

  const { faturado, limite } = useUserState();
  const restante = calcularFaltamOuExcedeu(faturado, limite);
  const percentual = calcularPercentual(faturado, limite);

  const faixa = faixaDoPercentual(percentual);

  const cardBase = "w-full rounded-2xl";
  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  const mesAtual = new Date().getMonth() + 1;
  const projecaoAnual = Math.round((faturado / mesAtual) * 12);
  const ultrapassa = projecaoAnual > limite;

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10" style={{ backgroundColor: "var(--bg)" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Velocímetro Fiscal
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-[130px] space-y-5">
        <div className={cardBase + " px-5 pt-6 pb-6"} style={cardStyle}>
          <VelocimetroAnimado percentual={percentual} maxWidth={300} />
        </div>

        <div className={cardBase + " p-3"} style={cardStyle}>
          <div className="grid grid-cols-3">
            {[
              { valor: faturado, label: "Faturado", cor: undefined },
              { valor: limite, label: "Limite", cor: undefined },
              {
                valor: restante.valor,
                label: restante.tipo === "excedeu" ? "Excedeu" : "Faltam",
                cor: restante.tipo === "excedeu" ? "#ef4444" : undefined,
              },
            ].map((c, i) => (
              <div
                key={c.label}
                className={
                  "flex flex-col items-center text-center min-w-0 " +
                  (i > 0 ? "border-l" : "")
                }
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  ...(i > 0 ? { borderColor: "var(--border)" } : {}),
                }}
              >
                <Valor tamanho="sm" cor={c.cor} autoAjustar>{c.valor}</Valor>
                <span
                  className="text-xs mt-1"
                  style={{ color: c.cor || "var(--text-secondary)" }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cardBase + " p-4"}
          style={{
            ...cardStyle,
            borderLeft: `4px solid ${faixa.cor}`,
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {faixa.textoDetalhado(percentual)}
          </p>
        </div>

        <div className={cardBase + " p-4"} style={cardStyle}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
            >
              <TrendingUp size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--text)" }}
              >
                Projeção para dezembro
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                No ritmo atual, você deve fechar o ano em{" "}
                <Valor tamanho="sm">{projecaoAnual}</Valor>
                {ultrapassa
                  ? " — atenção, isso ultrapassaria o limite anual."
                  : " — dentro do limite anual."}
              </p>
            </div>
          </div>
        </div>
      </div>



      <BottomNav />
    </div>
  );
}







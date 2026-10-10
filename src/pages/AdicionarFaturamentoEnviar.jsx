/* ADICIONARFATURAMENTOENVIAR v2 — vira a tela "Enviar extrato" (/enviar-extrato): OFX e CSV lidos no proprio app (so o que e deste ano fica guardado; entradas para a conferencia e saidas com categoria), mandar o mesmo arquivo 2x nao conta 2x; PDF vai para o Storage "em analise"; no fim "Encontrei X entradas e Y saídas de jan a out. Vamos conferir?" (v1: setinha de voltar maior (bolinha 46, seta 24; sem bolinha, seta 26)) */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Loader2, Check, AlertCircle } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { useAppState } from "@/context/AppStateContext";
import { importarExtrato } from "@/lib/importarExtrato";

/* ===================================================================
   ENVIAR EXTRATO (v2 — 10/10/2026, tarefa de 08-10, Etapa 3)

   "Quem esta no app resolve no app": a pessoa manda o extrato aqui
   mesmo (antes este arquivo so guardava no aparelho e dizia "IA em
   breve"). Abre pela folha "Atualize seu velocímetro" (Enviar extrato).

   - OFX ou CSV: lido no celular (src/lib/extrato.js), sem IA. So o que
     e de 1º/jan a 31/dez deste ano (ou da abertura do MEI em diante)
     vai para o banco; o resto e descartado ANTES (importarExtrato).
     Repetido nao entra (impressao digital de cada transacao).
   - No fim: "Encontrei 37 entradas e 52 saídas de jan a out. Vamos
     conferir?" -> Conferir abre a conferencia "É faturamento?" e depois
     a dos gastos. "Depois": o portao do Inicio leva para a conferencia
     na proxima vez (nada entra no faturamento sem a pessoa confirmar).
   - PDF: guardado no balde privado (pasta da pessoa) como "em analise".
     "Recebi! Vou ler e te aviso quando estiver pronto."
   - Um arquivo por vez. Pouco texto: uma frase so explica.
   =================================================================== */

const ACEITA = ".ofx,.qfx,.csv,.txt,.pdf,application/pdf,text/csv,application/x-ofx";

function plural(n, um, varios) {
  return n === 1 ? `1 ${um}` : `${n} ${varios}`;
}

export default function AdicionarFaturamentoEnviar() {
  const navigate = useNavigate();
  const { tipoMEI, mesAnoAbertura } = useAppState();
  const arquivoRef = useRef(null);
  const ano = new Date().getFullYear();

  // escolher | lendo | pronto | erro
  const [fase, setFase] = useState("escolher");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  async function enviar(file) {
    if (!file) return;
    setFase("lendo");
    setErro("");
    try {
      const r = await importarExtrato(file, {
        tipoMEI,
        mesAbertura: mesAnoAbertura?.mes,
        anoAbertura: mesAnoAbertura?.ano,
      });
      setResultado(r);
      setFase("pronto");
    } catch (e) {
      setErro(e?.message || "Não consegui ler esse arquivo.");
      setFase("erro");
    }
  }

  const escolher = () => arquivoRef.current?.click();

  let conteudo = null;
  if (fase === "escolher") {
    conteudo = (
      <div className="flex flex-col items-center text-center">
        <p style={{ fontSize: 15.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
          Baixe o extrato no app do seu banco (OFX, CSV ou PDF) e mande aqui.
        </p>
        <button
          type="button"
          onClick={escolher}
          className="botao-confirmar toque w-full rounded-2xl font-semibold flex items-center justify-center"
          style={{ marginTop: 22, padding: "16px 0", fontSize: 16.5, gap: 8 }}
        >
          <FileUp size={20} strokeWidth={2.1} />
          Escolher arquivo
        </button>
        <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 12 }}>
          Só fica guardado o que é de {ano}.
        </p>
      </div>
    );
  } else if (fase === "lendo") {
    conteudo = (
      <div className="flex flex-col items-center text-center" style={{ gap: 12 }}>
        <Loader2 size={26} className="animate-spin" style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>Lendo o extrato...</p>
      </div>
    );
  } else if (fase === "erro") {
    conteudo = (
      <div className="flex flex-col items-center text-center">
        <Circulo erro>
          <AlertCircle size={34} strokeWidth={2.2} style={{ color: "var(--danger)" }} />
        </Circulo>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text-secondary)", marginTop: 18 }}>{erro}</p>
        <button
          type="button"
          onClick={escolher}
          className="botao-confirmar w-full rounded-2xl font-semibold"
          style={{ marginTop: 24, padding: "15px 0", fontSize: 16 }}
        >
          Tentar outro arquivo
        </button>
      </div>
    );
  } else if (resultado?.tipo === "pdf") {
    conteudo = (
      <div className="flex flex-col items-center text-center">
        <Circulo>
          <Check size={38} strokeWidth={2.6} style={{ color: "var(--primary)" }} />
        </Circulo>
        <h2 className="font-bold" style={{ fontSize: 22, marginTop: 20 }}>Recebi!</h2>
        <p style={{ fontSize: 15.5, lineHeight: 1.5, color: "var(--text-secondary)", marginTop: 8 }}>
          Vou ler e te aviso quando estiver pronto.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard", { replace: true })}
          className="botao-confirmar w-full rounded-2xl font-semibold"
          style={{ marginTop: 26, padding: "15px 0", fontSize: 16 }}
        >
          Voltar ao início
        </button>
      </div>
    );
  } else if (resultado) {
    const { entradasNovas, saidasNovas, lidas, descartadas, periodo } = resultado;
    const temNovidade = entradasNovas + saidasNovas > 0;
    const partes = [
      entradasNovas > 0 && plural(entradasNovas, "entrada", "entradas"),
      saidasNovas > 0 && plural(saidasNovas, "saída", "saídas"),
    ].filter(Boolean);
    const titulo = temNovidade
      ? `Encontrei ${partes.join(" e ")}${periodo ? ` ${periodo}` : ""}.`
      : lidas > 0
      ? "Esse extrato já estava aqui. Nada novo."
      : `Não achei nada de ${ano} nesse extrato.`;
    conteudo = (
      <div className="flex flex-col items-center text-center">
        <Circulo>
          {temNovidade ? (
            <Check size={38} strokeWidth={2.6} style={{ color: "var(--primary)" }} />
          ) : (
            <AlertCircle size={34} strokeWidth={2.2} style={{ color: "var(--text-secondary)" }} />
          )}
        </Circulo>
        <p className="font-bold" style={{ fontSize: 20, lineHeight: 1.35, marginTop: 20 }}>{titulo}</p>
        {temNovidade && (
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginTop: 6 }}>Vamos conferir?</p>
        )}
        {descartadas > 0 && (
          <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 10 }}>
            {descartadas === 1 ? "1 era de outro período e ficou de fora." : `${descartadas} eram de outro período e ficaram de fora.`}
          </p>
        )}
        {temNovidade ? (
          <>
            <button
              type="button"
              onClick={() =>
                navigate(entradasNovas > 0 ? "/conferir-entradas" : "/conferir-saidas", {
                  replace: true,
                  state: { de: "extrato" },
                })
              }
              className="botao-confirmar w-full rounded-2xl font-semibold"
              style={{ marginTop: 26, padding: "15px 0", fontSize: 16 }}
            >
              Conferir
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="w-full font-semibold"
              style={{ marginTop: 10, padding: "10px 0", fontSize: 15, color: "var(--text-secondary)" }}
            >
              Depois
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={escolher}
            className="botao-confirmar w-full rounded-2xl font-semibold"
            style={{ marginTop: 26, padding: "15px 0", fontSize: 16 }}
          >
            Mandar outro extrato
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Enviar extrato" onVoltar={voltar} />
        <div className="max-w-sm w-full mx-auto" style={{ paddingTop: 18 }}>
          {conteudo}
        </div>
      </div>
      <input
        ref={arquivoRef}
        type="file"
        accept={ACEITA}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          enviar(f);
        }}
      />
    </div>
  );
}

function Circulo({ children, erro = false }) {
  return (
    <span
      className="flex items-center justify-center rounded-full shrink-0"
      style={{ width: 76, height: 76, backgroundColor: erro ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.14)" }}
    >
      {children}
    </span>
  );
}

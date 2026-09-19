/* SOBRE v2 — padrao de rolagem do Termos (bug 5) */
import { useNavigate } from "react-router-dom";
import { Gauge, CheckCircle2, Info } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Brand from "@/components/Brand";

import BottomNav from "../components/BottomNav.jsx";

/* ===================================================================
   SOBRE v2 — ROLAGEM CORRIGIDA PARA O SAFARI DO IPHONE

   O QUE ESTAVA ERRADO:
     A tela usava `min-h-screen`, ou seja, quem rolava era a PAGINA
     INTEIRA. No Safari do iPhone isso trava: o script do index.html
     chama window.scrollTo(0,0) escutando visualViewport.resize — e
     esse evento dispara tambem quando a barra de endereco encolhe ao
     rolar. Resultado: a pagina era puxada de volta para o topo sozinha.

   A CORRECAO (mesma do Termos.jsx, que e o modelo):
     - a raiz vira `.tela-rolavel`, que fixa a altura na area visivel
     - o conteudo vira `.conteudo-rolavel`, FILHO DIRETO da raiz, e e
       ele quem rola por dentro
     Com a pagina parada, o visualViewport.resize nao tem o que puxar.

   ATENCAO AO MEXER: o `.conteudo-rolavel` precisa ser filho DIRETO do
   `.tela-rolavel`. Se alguem enfiar uma div no meio, a rolagem quebra
   de novo e o sintoma volta sem aviso.

   O BottomNav fica FORA da area que rola, como irmao dela — e por isso
   continua colado embaixo enquanto o texto passa por tras.
   =================================================================== */

export default function Sobre() {
  const navigate = useNavigate();

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="px-4 pt-5 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
      </div>

      <div
        className="conteudo-rolavel hide-scrollbar px-6"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <Gauge size={52} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
            Sobre o <Brand />
          </h1>

          <p className="text-sm leading-relaxed mt-5" style={{ color: "var(--text-secondary)" }}>
            O <Brand /> é seu assistente de educação fiscal para MEI e MEI Caminhoneiro.
            Ajudamos você a acompanhar seu faturamento, entender seu limite anual e evitar
            surpresas com o Leão.
          </p>

          <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-secondary)" }}>
            Contamos com inteligência artificial que se mantém atualizada perante as reformas
            e mudanças na legislação fiscal, para te dar as informações mais precisas possíveis.
          </p>

          <div
            className="mt-5 rounded-xl p-3 flex gap-2"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderLeft: "3px solid var(--primary)",
            }}
          >
            <Info size={18} strokeWidth={2} style={{ color: "var(--primary)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
              <span className="font-semibold">Importante:</span> o <Brand /> não substitui um
              contador. Somos uma ferramenta de apoio e educação. Decisões fiscais importantes
              devem sempre ser confirmadas com um profissional habilitado.
            </p>
          </div>

          <ul className="space-y-2 mt-5">
            {[
              "Acompanhe seu limite em tempo real",
              "Alertas antes de ultrapassar o teto",
              "Calculadoras e calendário fiscal",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--primary)" }} className="shrink-0" />
                {t}
              </li>
            ))}
          </ul>

          <p className="text-center text-xs mt-8" style={{ color: "var(--text-secondary)" }}>
            <Brand /> v0.1
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
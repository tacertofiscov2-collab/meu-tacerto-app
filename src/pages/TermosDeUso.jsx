/* TERMOSDEUSO v1 — Termos de Uso em portugues simples (piloto) */
import { useLocation, useNavigate } from "react-router-dom";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { linkWhatsAppFisco } from "@/config/piloto";

/* ===================================================================
   VERSAO PROVISORIA - REVISAR COM ADVOGADO

   TERMOS DE USO (04/10/2026, piloto com MEI Caminhoneiros)

   Pagina nova, em /termos-de-uso: o endereco /termos ja era o resumo
   "Termos e Privacidade" (Termos.jsx), que NAO foi reescrito — o botao
   "Ver Termos de Uso" dele, que mostrava "Documento completo em breve",
   agora abre esta pagina. O Cadastro tambem tem link direto para ca.

   Cobre: o que e o app (piloto), que o Fisco e um assistente de IA que
   pode errar e nao substitui contador, e que o TaCerto calcula e
   explica, mas quem confirma e transmite as obrigacoes fiscais e a
   propria pessoa. A parte de dados fica na Politica de Privacidade
   (/privacidade).

   Antes da validacao com o publico real: revisar com advogado e
   incluir razao social e CNPJ do TaCerto.
   =================================================================== */

const SECOES = [
  {
    titulo: "O que é o TaCerto!",
    paragrafos: [
      "Um app que ajuda o MEI a acompanhar o faturamento e o limite do ano.",
      "Estamos num piloto: um teste com poucas pessoas. O app pode mudar, ter falhas, e algumas funções podem ficar fora do ar por um tempo.",
    ],
  },
  {
    titulo: "O Fisco é uma inteligência artificial",
    paragrafos: [
      "O Fisco é um assistente baseado em inteligência artificial. Ele pode errar.",
      "Ele não substitui um contador. Para decisões importantes, confirme com um contador.",
    ],
  },
  {
    titulo: "Quem cuida das obrigações é você",
    paragrafos: [
      "O TaCerto! calcula e explica. Quem confirma e transmite as obrigações fiscais do MEI é você: pagar o DAS, emitir as notas fiscais e entregar a declaração anual (DASN-SIMEI).",
      "Os números do app vêm do que você lança, confirma ou conta ao Fisco. Valores aproximados, como o faturamento que você informa no cadastro, são só uma estimativa. Confira sempre.",
    ],
  },
  {
    titulo: "Sua conta",
    paragrafos: [
      "Use dados verdadeiros e não passe sua senha para ninguém.",
      "Você pode sair da conta e excluir a conta, com todos os seus dados, pelo próprio app, quando quiser.",
    ],
  },
  {
    titulo: "Seus dados",
    paragrafos: [
      "O que guardamos e para que usamos está na Política de privacidade.",
    ],
    link: { rotulo: "Ver Política de privacidade", rota: "/privacidade" },
  },
  {
    titulo: "Mudanças nestes termos",
    paragrafos: [
      "Estes termos podem mudar. Quando mudarem, avisamos pelo app ou pelo WhatsApp.",
    ],
  },
];

export default function TermosDeUso() {
  const navigate = useNavigate();
  const location = useLocation();

  /* Aberta direto pelo endereco (sem tela antes): volta para o inicio */
  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/", { replace: true });
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Filho DIRETO de .tela-rolavel (padrao de rolagem do app) */}
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Termos de uso" onVoltar={voltar} />

        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Atualizados em 4 de outubro de 2026
        </p>

        <p className="text-[15px] leading-relaxed mt-3" style={{ color: "var(--text)" }}>
          As regras para usar o TaCerto!, em poucas palavras.
        </p>

        {SECOES.map((s) => (
          <section key={s.titulo} className="mt-6">
            <h2 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
              {s.titulo}
            </h2>
            <div className="mt-2 space-y-2">
              {s.paragrafos.map((p) => (
                <p
                  key={p}
                  className="text-[14.5px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {p}
                </p>
              ))}
            </div>
            {s.link && (
              <button
                onClick={() => navigate(s.link.rota)}
                className="text-[14.5px] font-semibold mt-2"
                style={{ color: "var(--primary)" }}
              >
                {s.link.rotulo}
              </button>
            )}
          </section>
        ))}

        <section className="mt-6">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
            Fale com a gente
          </h2>
          <a
            href={linkWhatsAppFisco()}
            target="_blank"
            rel="noopener noreferrer"
            className="toque w-full rounded-2xl font-semibold flex items-center justify-center mt-3 active:scale-[0.98] transition"
            style={{
              paddingTop: 13,
              paddingBottom: 13,
              fontSize: 15,
              backgroundColor: "rgba(34,197,94,0.16)",
              border: "1px solid rgba(34,197,94,0.45)",
              color: "var(--primary)",
              textDecoration: "none",
            }}
          >
            Falar com o Fisco no WhatsApp
          </a>
        </section>
      </div>
    </div>
  );
}

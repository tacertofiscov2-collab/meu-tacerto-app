/* TERMOSDEUSO v9 — diz que o extrato em PDF fica guardado ate ser lido (v8: textos de 08-10: app de gestao do MEI, o CNPJ (dados publicos e, no futuro, o DAS), o extrato (so o ano atual fica, o resto e descartado) e a pessoa confirma o que e faturamento; sem chamar o TaCerto de contabilidade/contador (v7: "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v6: letras maiores (texto 16, titulos 17) e risca fina entre as secoes, no padrao do Perfil (v5: secao "Fale com a gente" (botao do WhatsApp) escondida por MOSTRAR_WHATSAPP_DOCUMENTOS (v4: Fisco.ia; v3: sem a palavra "piloto" no texto ("fase de testes"); v2: botao do WhatsApp com mensagem pronta))) */
import { useLocation, useNavigate } from "react-router-dom";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { linkWhatsAppFisco, MENSAGENS_WHATSAPP, dadosParaWhatsApp, MOSTRAR_WHATSAPP_DOCUMENTOS } from "@/config/piloto";
import { useAppState } from "@/context/AppStateContext";

/* ===================================================================
   VERSAO PROVISORIA - REVISAR COM ADVOGADO

   v8 (10/10/2026, tarefa de 08-10): CNPJ, extrato (corte do periodo),
   gastos e notas, e quem confirma o faturamento e a pessoa. Regras:
   nunca descrever o TaCerto como contabilidade/contador (DL 9.295/46,
   art. 20) e nada de "nao nos responsabilizamos por nada".

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
      "Um app de gestão para o MEI: acompanha o faturamento, o limite do ano, os gastos e o DAS.",
      "O app está em fase de testes: pode mudar, ter falhas, e algumas funções podem ficar fora do ar por um tempo.",
    ],
  },
  {
    titulo: "O Fisco é uma inteligência artificial",
    paragrafos: [
      "O Fisco é um assistente baseado em inteligência artificial. Ele pode errar.",
      "Para decisões importantes, confirme com um contador.",
    ],
  },
  {
    titulo: "Seu CNPJ",
    paragrafos: [
      "Com o seu CNPJ, o app busca os dados públicos do seu MEI (nome, atividade e desde quando é MEI) para preencher o cadastro por você.",
      "No futuro, ele também vai servir para gerar o boleto do DAS para você.",
    ],
  },
  {
    titulo: "O extrato e o que é faturamento",
    paragrafos: [
      "Quando você envia o extrato do banco, o app lê o arquivo e guarda só o que é deste ano (ou da abertura do MEI em diante). O resto é descartado. Extrato em PDF fica guardado numa pasta só sua até ser lido.",
      "Quem diz o que é faturamento é você: nada entra no velocímetro sem você confirmar.",
    ],
  },
  {
    titulo: "Quem cuida das obrigações é você",
    paragrafos: [
      "O TaCerto! organiza, calcula e explica. Quem confirma e transmite as obrigações fiscais do MEI é você: pagar o DAS, emitir as notas fiscais e entregar a declaração anual (DASN-SIMEI).",
      "Os números do app vêm do que você lança, envia, confirma ou conta ao Fisco. O total do ano que você digita é uma estimativa. Confira sempre.",
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
  const app = useAppState();

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

        <p className="mt-1" style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
          Atualizados em 10 de outubro de 2026
        </p>

        <p className="leading-relaxed mt-3" style={{ color: "var(--text)", fontSize: 16.5 }}>
          As regras para usar o TaCerto!, em poucas palavras.
        </p>

        {SECOES.map((s) => (
          <section key={s.titulo} style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid color-mix(in srgb, var(--border) 55%, transparent)" }}>
            <h2 className="font-bold" style={{ color: "var(--text)", fontSize: 17 }}>
              {s.titulo}
            </h2>
            <div className="mt-2 space-y-2">
              {s.paragrafos.map((p) => (
                <p
                  key={p}
                  className="leading-relaxed"
                  style={{ color: "var(--text-secondary)", fontSize: 16 }}
                >
                  {p}
                </p>
              ))}
            </div>
            {s.link && (
              <button
                onClick={() => navigate(s.link.rota)}
                className="text-[16px] font-semibold mt-2"
                style={{ color: "var(--primary)" }}
              >
                {s.link.rotulo}
              </button>
            )}
          </section>
        ))}

        {/* v5: escondida (MOSTRAR_WHATSAPP_DOCUMENTOS em src/config/piloto.js) */}
        {MOSTRAR_WHATSAPP_DOCUMENTOS && (
        <section className="mt-6">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
            Fale com a gente
          </h2>
          <a
            href={linkWhatsAppFisco(MENSAGENS_WHATSAPP.falarComFisco(dadosParaWhatsApp(app)))}
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
        )}
      </div>
    </div>
  );
}

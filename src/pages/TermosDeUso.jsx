/* TERMOSDEUSO v14 — termos alinhados ao WhatsApp apenas para avisos (v13: versão anterior) */
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
    titulo: "A Isa é uma assistente virtual com IA",
    paragrafos: [
      "A Isa é a assistente virtual do TaCerto!, baseada em inteligência artificial. Ela não é uma pessoa nem contadora, e pode errar.",
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
    titulo: "Leitura do comprovante por IA",
    paragrafos: [
      "Quando você manda a foto ou o PDF de um comprovante, uma inteligência artificial lê o valor, a data e quem pagou ou recebeu. A leitura pode errar.",
      "Você sempre confere e corrige antes de salvar: nada entra no velocímetro sem você confirmar.",
    ],
  },
  {
    titulo: "O extrato e o que é faturamento",
    paragrafos: [
      "Quando você envia o extrato do banco, o app lê o arquivo e guarda só o que é deste ano (ou da abertura do MEI em diante). O resto é descartado. O extrato em PDF fica guardado numa pasta só sua.",
      "Quem diz o que é faturamento é você: nada entra no velocímetro sem você confirmar.",
    ],
  },
  {
    titulo: "Quem cuida das obrigações é você",
    paragrafos: [
      "O TaCerto! organiza, calcula e explica. Quem confirma e transmite as obrigações fiscais do MEI é você: pagar o DAS, emitir as notas fiscais e entregar a declaração anual (DASN-SIMEI).",
      "Os números do app vêm do que você lança, envia, confirma ou conta à Isa. O total do ano que você digita é uma estimativa. Confira sempre.",
    ],
  },
  {
    titulo: "Sua conta",
    paragrafos: [
      "Use dados verdadeiros e não passe sua senha para ninguém.",
      "Você pode sair da conta e excluir a conta, com todos os seus dados, pelo próprio app, quando quiser.",
      "No Mais → Permissões e integrações você vê tudo o que o app usa e pode desligar o que não quiser.",
    ],
  },
  {
    titulo: "Mensagens no WhatsApp",
    paragrafos: [
      "A Isa manda lembretes (como o do DAS) e avisos sobre o seu MEI pelo WhatsApp.",
      "Para parar quando quiser: Mais → Permissões e integrações → Lembretes e avisos no WhatsApp. As dúvidas você tira com a Isa aqui no app. No WhatsApp ela só envia lembretes e boletos do DAS e o check-up do CNPJ.",
      "Se você ativar, o app manda uma notificação por semana no celular, contando como está o seu velocímetro. Para parar: Perfil → Permissões e integrações → Notificações.",
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
          Atualizados em 12 de outubro de 2026
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
            Falar com a Isa no app
          </a>
        </section>
        )}
      </div>
    </div>
  );
}

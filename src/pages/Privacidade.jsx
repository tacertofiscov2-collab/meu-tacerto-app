/* PRIVACIDADE v5 — botao do WhatsApp escondido por MOSTRAR_WHATSAPP_DOCUMENTOS; a frase "Duvida sobre seus dados?" fica (v4: Fisco.ia; v3: sem a palavra "piloto" no texto ("Por enquanto, a equipe..."); v2: botao do WhatsApp com mensagem pronta) */
import { useLocation, useNavigate } from "react-router-dom";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { linkWhatsAppFisco, MENSAGENS_WHATSAPP, dadosParaWhatsApp, MOSTRAR_WHATSAPP_DOCUMENTOS } from "@/config/piloto";
import { useAppState } from "@/context/AppStateContext";

/* ===================================================================
   VERSAO PROVISORIA - REVISAR COM ADVOGADO

   POLITICA DE PRIVACIDADE (04/10/2026, piloto com MEI Caminhoneiros)

   Pagina nova: antes so existia o resumo "Termos e Privacidade"
   (/termos), cujo botao "Ver Politica de Privacidade" mostrava
   "Documento completo em breve". Agora ele abre esta pagina, e o
   Cadastro tambem tem link direto para ca.

   Cobre: quais dados guardamos (nome, WhatsApp, e-mail, tipo de MEI,
   lancamentos de faturamento), para que usamos, que nao vendemos, que
   a pessoa pode excluir a conta e todos os dados pelo app, e que o
   Fisco e um assistente de IA que pode errar.

   Antes da validacao com o publico real: revisar com advogado, incluir
   o controlador (razao social e CNPJ do TaCerto) e um e-mail de
   contato de privacidade.
   =================================================================== */

const SECOES = [
  {
    titulo: "Quais dados guardamos",
    paragrafos: [
      "Seu nome (ou apelido), seu WhatsApp e seu e-mail.",
      "O tipo do seu MEI (MEI ou MEI Caminhoneiro) e, se você abriu o MEI este ano, o mês de abertura.",
      "Os lançamentos do seu faturamento: valor, data e descrição. Isso inclui o que você lança no app, o faturamento aproximado que você informa no cadastro e o que você conta ao Fisco.ia no WhatsApp.",
    ],
  },
  {
    titulo: "Para que usamos",
    paragrafos: [
      "Para mostrar no velocímetro quanto do limite do seu MEI você já usou e organizar seus lançamentos.",
      "Para falar com você pelo WhatsApp: a pergunta de todo dia sobre o que você recebeu, avisos sobre o seu MEI e as respostas às suas dúvidas.",
      "Para você entrar na sua conta com segurança.",
      "Por enquanto, a equipe do TaCerto! confere o que você responde no WhatsApp antes de lançar no app.",
    ],
  },
  {
    titulo: "O que não fazemos",
    paragrafos: [
      "Não vendemos seus dados. Não passamos seus dados para propaganda de outras empresas.",
      "Não pedimos senha de banco nem de cartão.",
    ],
  },
  {
    titulo: "Quem mais tem acesso",
    paragrafos: [
      "Só as empresas que fazem o app funcionar, como o servidor que guarda os dados, o login (inclusive o do Google, se você entrar por ele) e o WhatsApp. Elas usam seus dados só para isso.",
    ],
  },
  {
    titulo: "O Fisco.ia usa inteligência artificial",
    paragrafos: [
      "O Fisco.ia é um assistente baseado em inteligência artificial. Ele pode errar e não substitui um contador. Para decisões importantes, confirme com um contador.",
    ],
  },
  {
    titulo: "Você manda nos seus dados",
    paragrafos: [
      "Você pode ver e corrigir seus dados no app, em Perfil.",
      "Você pode excluir sua conta e todos os seus dados pelo próprio app, quando quiser: Perfil → Editar perfil → Excluir conta. Depois de excluídos, os dados não voltam.",
      "Guardamos seus dados enquanto sua conta existir.",
    ],
  },
];

export default function Privacidade() {
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
        <TopoRolavel titulo="Política de privacidade" onVoltar={voltar} />

        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Atualizada em 4 de outubro de 2026
        </p>

        <p className="text-[15px] leading-relaxed mt-3" style={{ color: "var(--text)" }}>
          Aqui explicamos, sem juridiquês, o que o TaCerto! guarda sobre você e o que
          faz com isso.
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
          </section>
        ))}

        <section className="mt-6">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
            Fale com a gente
          </h2>
          <p className="text-[14.5px] leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
            Dúvida sobre seus dados? Chame o Fisco.ia no WhatsApp.
          </p>
          {/* v5: botao escondido (MOSTRAR_WHATSAPP_DOCUMENTOS em src/config/piloto.js) */}
          {MOSTRAR_WHATSAPP_DOCUMENTOS && (
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
            Falar com o Fisco.ia no WhatsApp
          </a>
          )}
        </section>
      </div>
    </div>
  );
}

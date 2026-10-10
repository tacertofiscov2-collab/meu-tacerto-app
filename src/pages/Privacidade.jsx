/* PRIVACIDADE v9 — textos de 08-10: CNPJ e dados publicos, extrato (so o ano atual; PDF numa pasta so da pessoa ate ser lido), gastos, notas e comprovantes, lembrete do DAS; caminho certo do Excluir conta (Perfil > Excluir conta) (v8: "Fisco.ia" vira "Fisco" nos textos da tela (so a Apresentacao do Fisco.ia mantem o nome) (v7: letras maiores (texto 16, titulos 17) e risca fina entre as secoes, no padrao do Perfil (v6: secao "Fale com a gente" inteira escondida por MOSTRAR_WHATSAPP_DOCUMENTOS (v5: so o botao; v4: Fisco.ia; v3: sem a palavra "piloto" no texto ("Por enquanto, a equipe..."); v2: botao do WhatsApp com mensagem pronta))) */
import { useLocation, useNavigate } from "react-router-dom";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { linkWhatsAppFisco, MENSAGENS_WHATSAPP, dadosParaWhatsApp, MOSTRAR_WHATSAPP_DOCUMENTOS } from "@/config/piloto";
import { useAppState } from "@/context/AppStateContext";

/* ===================================================================
   VERSAO PROVISORIA - REVISAR COM ADVOGADO

   v9 (10/10/2026, tarefa de 08-10): CNPJ (BrasilAPI), extrato enviado
   pelo app (o que fica e o que e descartado), gastos/notas/comprovantes
   e o lembrete do DAS. Nunca chamar o TaCerto de contabilidade/contador.

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
      "Seu nome (ou apelido) e seu WhatsApp.",
      "O seu MEI: CNPJ, tipo (MEI ou MEI Caminhoneiro), atividade, desde quando é MEI e, se você abriu o MEI este ano, o mês de abertura.",
      "Os lançamentos do seu faturamento: valor, data e descrição. Isso inclui o que você lança no app, o total do ano que você digita e o que você conta ao Fisco no WhatsApp.",
      "Do extrato que você envia: só as movimentações deste ano (data, valor, descrição e, quando o banco informa, o nome e o CPF ou CNPJ de quem pagou ou recebeu). O resto do arquivo é descartado. Extrato em PDF fica guardado numa pasta só sua até ser lido.",
      "Seus gastos, e as notas e comprovantes que você anexar, para a sua gestão: lucro e Imposto de Renda.",
      "Suas escolhas no app, como os dias do lembrete do DAS.",
    ],
  },
  {
    titulo: "Para que usamos",
    paragrafos: [
      "Para mostrar no velocímetro quanto do limite do seu MEI você já usou, e quanto sobrou do que você recebeu.",
      "O CNPJ, para buscar os dados públicos do seu MEI e, no futuro, gerar o boleto do DAS para você.",
      "Para falar com você pelo WhatsApp: lembrete do DAS, avisos sobre o seu MEI e as respostas às suas dúvidas.",
      "Para você entrar na sua conta com segurança.",
    ],
  },
  {
    titulo: "O que não fazemos",
    paragrafos: [
      "Não vendemos seus dados. Não passamos seus dados para propaganda de outras empresas.",
      "Não pedimos senha de banco, de cartão, do gov.br nem do certificado digital.",
    ],
  },
  {
    titulo: "Quem mais tem acesso",
    paragrafos: [
      "Só as empresas que fazem o app funcionar, como o servidor que guarda os dados, o login, o WhatsApp e a consulta pública de CNPJ (BrasilAPI). Elas usam seus dados só para isso.",
    ],
  },
  {
    titulo: "O Fisco usa inteligência artificial",
    paragrafos: [
      "O Fisco é um assistente baseado em inteligência artificial. Ele pode errar. Para decisões importantes, confirme com um contador.",
    ],
  },
  {
    titulo: "Você manda nos seus dados",
    paragrafos: [
      "Você pode ver e corrigir seus dados no app, em Perfil.",
      "Você pode excluir sua conta e todos os seus dados pelo próprio app, quando quiser: Perfil → Excluir conta. Depois de excluídos, os dados não voltam.",
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

        <p className="mt-1" style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
          Atualizada em 10 de outubro de 2026
        </p>

        <p className="leading-relaxed mt-3" style={{ color: "var(--text)", fontSize: 16.5 }}>
          Aqui explicamos, sem juridiquês, o que o TaCerto! guarda sobre você e o que
          faz com isso.
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
          </section>
        ))}

        {/* v6: secao inteira escondida (MOSTRAR_WHATSAPP_DOCUMENTOS em src/config/piloto.js) */}
        {MOSTRAR_WHATSAPP_DOCUMENTOS && (
        <section className="mt-6">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text)" }}>
            Fale com a gente
          </h2>
          <p className="text-[14.5px] leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
            Dúvida sobre seus dados? Chame o Fisco no WhatsApp.
          </p>
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

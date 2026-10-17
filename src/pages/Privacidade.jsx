/* PRIVACIDADE v14 — privacidade alinhada ao WhatsApp apenas para avisos (v13: versão anterior) */
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
      "Os lançamentos do seu faturamento: valor, data e descrição. Isso inclui o que você lança no app, o total do ano que você digita e o que você conta à Isa no WhatsApp.",
      "Do extrato que você envia: só as movimentações deste ano (data, valor, descrição e, quando o banco informa, o nome e o CPF ou CNPJ de quem pagou ou recebeu). O resto do arquivo é descartado. O extrato em PDF fica guardado numa pasta só sua.",
      "Seus gastos (os que você lança no app ou conta à Isa no WhatsApp), e as notas e comprovantes que você anexar ou mandar pelo \"+\" ou pelo chat da Isa (foto ou PDF), para a sua gestão: lucro e Imposto de Renda.",
      "As conversas com a Isa no chat do app: ficam no seu celular e no nosso servidor, para você não perder o que perguntou.",
      "Suas escolhas no app: os dias do lembrete do DAS, como você quer pagar o DAS, se quer lembretes e avisos no WhatsApp, se quer a notificação da semana no celular e se já viu o tutorial.",
    ],
  },
  {
    titulo: "Para que usamos",
    paragrafos: [
      "Para mostrar no velocímetro quanto do limite do seu MEI você já usou, e quanto sobrou do que você recebeu.",
      "O CNPJ, para buscar os dados públicos do seu MEI e, no futuro, gerar o boleto do DAS para você.",
      "Para falar com você pelo WhatsApp: lembrete do DAS, avisos sobre o seu MEI e as respostas às suas dúvidas.",
      "Se você ativar, para mandar uma notificação por semana no celular contando como está o seu velocímetro.",
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
      "Se você ativar as notificações, o aviso passa pelo serviço de notificação do seu celular (Apple ou Google), só para chegar até você. Ele não leva valores nem o seu CNPJ.",
      "Quando você manda um comprovante pelo \"+\" ou pelo chat da Isa, o arquivo vai para a empresa da inteligência artificial que faz a leitura (Anthropic), só para ler o valor, a data e quem pagou. Pelos termos dela, o arquivo não é usado para treinar a IA.",
    ],
  },
  {
    titulo: "A Isa usa inteligência artificial",
    paragrafos: [
      "A Isa é a assistente virtual do TaCerto!, baseada em inteligência artificial. Ela não é uma pessoa nem contadora, e pode errar. Para decisões importantes, confirme com um contador.",
    ],
  },
  {
    titulo: "Mensagens no WhatsApp",
    paragrafos: [
      "Usamos o seu WhatsApp para o login, para os lembretes e boletos do DAS e o check-up do CNPJ. As dúvidas são respondidas no app.",
      "Para parar os lembretes e avisos quando quiser: Mais → Permissões e integrações → Lembretes e avisos no WhatsApp. As dúvidas você tira com a Isa aqui no app.",
      "Notificação no celular: só se você ativar, no máximo uma por semana. Para parar: Mais → Permissões e integrações → Notificações, ou nos Ajustes do celular.",
    ],
  },
  {
    titulo: "Você manda nos seus dados",
    paragrafos: [
      "Você pode ver e corrigir seus dados no app, no Mais.",
      "No Mais → Permissões e integrações você vê o que o app usa, desliga os lembretes no WhatsApp e as notificações e remove o CNPJ.",
      "Você pode excluir sua conta e todos os seus dados pelo próprio app, quando quiser: Mais → Excluir conta. Depois de excluídos, os dados não voltam.",
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
          Atualizada em 12 de outubro de 2026
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
            Dúvida sobre seus dados? Chame a Isa aqui no app.
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
            Falar com a Isa no app
          </a>
        </section>
        )}
      </div>
    </div>
  );
}

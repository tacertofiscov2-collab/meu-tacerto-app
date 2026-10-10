/* NOTASFISCAIS v1 — janela "Notas fiscais" (Perfil > Ajuda e o atalho NF do Inicio): sem certificado ativo, explica curto quando emitir (NFS-e so frete na mesma cidade; CT-e entre cidades contratado direto; agregado sem IE em MG hoje nao emite; 2027 em todo servico), como o TaCerto ajuda e o Certificado A1 (R$ 100,34, preco de custo; videochamada) com "Tenho interesse no certificado"; com certificado ativo vira "Minhas notas" */
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin, Route, Truck, CalendarClock, ListChecks, Info, Sparkles, Wallet, Video, ShieldCheck,
  Store, Wrench,
} from "lucide-react";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import HistoricoNotas from "./HistoricoNotas.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco, MOSTRAR_TUTORIAL_NOTA,
} from "@/config/piloto";
import { PRECO_CERTIFICADO_A1 } from "@/lib/fiscal";

/* ===================================================================
   NOTAS FISCAIS (10/10/2026 — tarefa de 08-10, Etapa 5)

   DOIS ESTADOS:
   A) SEM certificado ativo (perfis.nota_automatica_ativa = false, o
      normal): explicacao curta, em lista simples (sem textao):
        1. Quando voce precisa emitir — regras de
           docs/pesquisas/Nota fiscal e certificado do caminhoneiro.md:
           frete na MESMA cidade = NFS-e; frete ENTRE cidades contratado
           direto = CT-e; agregado de transportadora em MG sem Inscricao
           Estadual = hoje nao emite (a transportadora emite); 2027 = o
           MEI emite em todo servico (LC 214/2025, art. 517). O MEI NUNCA
           emite NFS-e de frete entre cidades (Res. CGSN 140, art. 106-A).
        2. Como o TaCerto ajuda hoje: o Fisco monta a nota no WhatsApp;
           passo a passo para fazer sozinho (/como-emitir-nota).
        3. Certificado A1: o que e, vantagens (nota automatica), preco
           R$ 100,34 (Tecnosign/Soluti, preco de custo — "o TaCerto nao
           ganha nada"), como e a videochamada. Botao "Tenho interesse no
           certificado" -> WhatsApp com mensagem pronta (o agendamento e
           feito por la — excecao decidida pelo Fernando).
   B) COM certificado ativo (o Fernando liga a mao no banco): vira
      "Minhas notas" (HistoricoNotas: lista por mes, ver o PDF, lancar).
   =================================================================== */

/* "Quando voce precisa emitir", por tipo de MEI */
const QUANDO = {
  MEI_CAMINHONEIRO: [
    { Icon: MapPin, rotulo: "Frete na mesma cidade", detalhe: "Nota de serviço (NFS-e), no gov.br." },
    { Icon: Route, rotulo: "Frete entre cidades, contratado direto", detalhe: "CT-e. Precisa de Inscrição Estadual e certificado." },
    { Icon: Truck, rotulo: "Agregado de transportadora (MG, sem Inscrição Estadual)", detalhe: "Hoje você não emite: quem emite é a transportadora." },
    { Icon: CalendarClock, rotulo: "A partir de 2027", detalhe: "O MEI vai ter que emitir nota em todo serviço." },
  ],
  MEI: [
    { Icon: Wrench, rotulo: "Serviço para empresa", detalhe: "Nota de serviço (NFS-e), no gov.br." },
    { Icon: Store, rotulo: "Venda de produto para empresa", detalhe: "Nota de produto (NF-e)." },
    { Icon: CalendarClock, rotulo: "A partir de 2027", detalhe: "O MEI vai ter que emitir nota em toda venda e serviço." },
  ],
};

export default function NotasFiscais() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const caminhoneiro = app.tipoMEI === "MEI_CAMINHONEIRO";
  const dados = dadosParaWhatsApp(app);

  /* B) certificado ativo: "Minhas notas" */
  if (app.notaAutomaticaAtiva) return <HistoricoNotas titulo="Minhas notas" />;

  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Notas fiscais" onVoltar={voltar} />

        <SecaoLista titulo="Quando você precisa emitir" style={{ marginTop: 8 }}>
          {(QUANDO[app.tipoMEI] || QUANDO.MEI).map((q) => (
            <LinhaLista key={q.rotulo} Icon={q.Icon} rotulo={q.rotulo} detalhe={q.detalhe} />
          ))}
        </SecaoLista>

        <SecaoLista titulo="Como o TaCerto ajuda hoje">
          <LinhaLista
            Icon={IconeWhatsApp}
            rotulo="O Fisco monta a nota com você"
            detalhe={caminhoneiro ? "Você manda o valor e pra quem foi o frete." : "Você manda o valor e pra quem foi o serviço."}
            onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.notaAjuda(dados, caminhoneiro))}
          />
          {MOSTRAR_TUTORIAL_NOTA && (
            <LinhaLista
              Icon={ListChecks}
              rotulo="Fazer sozinho"
              detalhe="Passo a passo no Emissor Nacional"
              onClick={() => navigate("/como-emitir-nota", { state: { de: "notas" } })}
            />
          )}
        </SecaoLista>

        <SecaoLista titulo="Certificado Digital A1">
          <LinhaLista
            Icon={Info}
            rotulo="O que é"
            detalhe="A identidade digital do seu CNPJ, no padrão oficial do governo."
          />
          <LinhaLista
            Icon={Sparkles}
            rotulo="Vantagem"
            detalhe={caminhoneiro
              ? "A nota sai automática: você só confirma. Serve também para CT-e."
              : "A nota sai automática: você só confirma."}
          />
          <LinhaLista
            Icon={Wallet}
            rotulo={`R$ ${PRECO_CERTIFICADO_A1.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} por 1 ano`}
            detalhe="Preço de custo da certificadora. O TaCerto não ganha nada."
          />
          <LinhaLista
            Icon={Video}
            rotulo="Como tira"
            detalhe="Por videochamada: parado, com boa internet e luz, e a CNH original na mão."
          />
          <LinhaLista
            Icon={ShieldCheck}
            rotulo="Segurança"
            detalhe="Nunca pedimos sua senha do gov.br nem a do certificado no WhatsApp."
          />
        </SecaoLista>

        <button
          type="button"
          onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.certificadoA1(dados))}
          className="botao-confirmar toque w-full rounded-2xl font-semibold flex items-center justify-center"
          style={{ marginTop: 22, padding: "15px 0", fontSize: 16, gap: 8 }}
        >
          <IconeWhatsApp size={19} />
          Tenho interesse no certificado
        </button>
      </div>
    </div>
  );
}

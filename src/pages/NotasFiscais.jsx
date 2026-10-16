/* NOTASFISCAIS v6 — vira a aba "Notas" do rodape (/notas, prop aba: sem setinha, com o rodape); ordem Minhas notas, Emitir nota, Guardar uma nota (Bloco 3) (v5: topo: "Para a nota automática é preciso o Certificado Digital A1" e, sem ele, emite pelo gov.br (conta prata ou ouro) (resposta N8) (v4: "Por que precisa" do A1 deixa claro que o certificado fica guardado na plataforma de notas, que assina cada nota (nao no TaCerto) (v3: pagina do Perfil (Meu MEI, junto do DAS) e do atalho NF do Inicio: destaque "Emita suas notas grátis pelo TaCerto" + aviso do Certificado A1 (R$ 100,34, pago a certificadora; obrigatorio pelo CDC); Emitir nota (sem A1: folha com o que e, por que precisa, videochamada e "Tenho interesse"), Guardar uma nota (foto ou PDF; nota deste ano pergunta "Posso somar no velocímetro?" sem contar duas vezes) e Minhas notas (/notas-fiscais/minhas); quando emitir; com A1 ativo a pagina continua (antes virava so "Minhas notas") (v2: Fisco vira Isa: "A Isa monta a nota com você" (v1: janela "Notas fiscais" (Perfil > Ajuda e o atalho NF do Inicio): sem certificado ativo, explica curto quando emitir (NFS-e so frete na mesma cidade; CT-e entre cidades contratado direto; agregado sem IE em MG hoje nao emite; 2027 em todo servico), como o TaCerto ajuda e o Certificado A1 (R$ 100,34, preco de custo; videochamada) com "Tenho interesse no certificado"; com certificado ativo vira "Minhas notas"))))) */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin, Route, Truck, CalendarClock, Store, Wrench, FilePlus2, Camera, FolderOpen, ListChecks,
} from "lucide-react";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import BottomNav, { ALTURA_RODAPE } from "../components/BottomNav.jsx";
import FolhaDeBaixo from "../components/FolhaDeBaixo.jsx";
import FolhaSomarNoVelocimetro from "../components/FolhaSomarNoVelocimetro.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import { FolhaLancarNota } from "./HistoricoNotas.jsx";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import useAnoInicio from "@/hooks/useAnoInicio";
import { ligarNotaAoLancamento, descricaoDoLancamentoDaNota } from "@/lib/notas";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco, MOSTRAR_TUTORIAL_NOTA,
} from "@/config/piloto";
import { PRECO_CERTIFICADO_A1 } from "@/lib/fiscal";

/* ===================================================================
   NOTAS FISCAIS (v1 em 10/10/2026, tarefa de 08-10; v3 em 12/10,
   tarefa de 10-10, Bloco E)

   Abre pelo Perfil (Meu MEI > Notas fiscais, junto do DAS; saiu da
   Ajuda) e pelo atalho NF do Inicio.

   TOPO (destaque): "Emita suas notas grátis pelo TaCerto" e, logo
   abaixo, letra menor mas legivel: "Para emitir é preciso o Certificado
   Digital A1 (R$ 100,34, pago à certificadora; o TaCerto não ganha
   nada)." — OBRIGATORIO pelo Codigo de Defesa do Consumidor: a emissao
   e gratis, o certificado nao.

   3 OPCOES:
   - Emitir nota: SEM certificado ativo abre a folha do A1 (o que e, por
     que precisa, como tira por videochamada) com "Tenho interesse no
     certificado" (WhatsApp pronto) e, embaixo, os caminhos de hoje sem
     certificado (a Isa monta a nota com voce; fazer sozinho). COM
     certificado ativo (perfis.nota_automatica_ativa, o Fernando liga a
     mao): WhatsApp com a Isa para emitir. Nao ha provedor de nota real
     ligado (pedido: nao integrar ainda).
   - Guardar uma nota: a folha de Minhas notas (foto ou PDF, valor,
     data...). Nota deste ano: "Essa nota é de um frete que você
     recebeu? Posso somar R$ X no velocímetro?" — e antes de somar
     procura o mesmo dinheiro ja lancado (+-1%, +-15 dias) para so ligar
     a nota a ele (FolhaSomarNoVelocimetro + src/lib/conciliacao.js).
   - Minhas notas: /notas-fiscais/minhas (por mes, ver o PDF).

   QUANDO EMITIR (regras de docs/pesquisas/Nota fiscal e certificado do
   caminhoneiro.md): frete na MESMA cidade = NFS-e; frete ENTRE cidades
   contratado direto = CT-e; agregado de transportadora em MG sem
   Inscricao Estadual = hoje nao emite (a transportadora emite); 2027 =
   o MEI emite em todo servico (LC 214/2025, art. 517).
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

const PRECO_A1 = `R$ ${PRECO_CERTIFICADO_A1.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function NotasFiscais({ aba = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const anoInicio = useAnoInicio();
  const caminhoneiro = app.tipoMEI === "MEI_CAMINHONEIRO";
  const comCertificado = Boolean(app.notaAutomaticaAtiva);
  const dados = dadosParaWhatsApp(app);

  const [userId, setUserId] = useState(null);
  const [folhaA1, setFolhaA1] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [somar, setSomar] = useState(null);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (ativo) setUserId(data?.user?.id || null);
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);

  function voltar() {
    if (location.key !== "default") navigate(-1);
    else navigate("/dashboard", { replace: true });
  }

  function emitir() {
    if (comCertificado) abrirWhatsAppFisco(MENSAGENS_WHATSAPP.notaAjuda(dados, caminhoneiro));
    else setFolhaA1(true);
  }

  function aoGuardar(nota) {
    setGuardando(false);
    toast.success("Nota guardada");
    // O velocimetro e do ano: so nota deste ano pergunta se soma
    if (new Date(nota.data).getFullYear() === new Date().getFullYear()) setSomar(nota);
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: aba ? `calc(${ALTURA_RODAPE + 40}px + env(safe-area-inset-bottom))` : "calc(40px + env(safe-area-inset-bottom))" }}
      >
        {/* v6: como aba do rodape, sem a setinha de voltar */}
        <TopoRolavel titulo="Notas fiscais" onVoltar={aba ? null : voltar} />

        {/* Destaque: emissao gratis + o A1 nao e gratis (CDC) */}
        <section
          className="rounded-2xl"
          style={{ marginTop: 10, padding: "16px 16px 15px", border: "1px solid var(--border)" }}
        >
          <p className="font-bold leading-snug" style={{ fontSize: 19, color: "var(--text)" }}>
            Emita suas notas grátis pelo TaCerto
          </p>
          <p className="leading-snug" style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
            {comCertificado
              ? "Seu Certificado Digital A1 está ativo."
              : `Para a nota automática é preciso o Certificado Digital A1 (${PRECO_A1}, pago à certificadora; o TaCerto não ganha nada). Sem ele, você emite pelo gov.br, com a conta prata ou ouro.`}
          </p>
        </section>

        <SecaoLista style={{ marginTop: 14 }}>
          <LinhaLista
            Icon={FolderOpen}
            rotulo="Minhas notas"
            detalhe="Por mês, com o PDF"
            onClick={() => navigate("/notas-fiscais/minhas", { state: { de: "notas" } })}
          />
          <LinhaLista
            Icon={FilePlus2}
            rotulo="Emitir nota"
            detalhe={comCertificado ? "A Isa emite com você no WhatsApp" : "Pelo gov.br, ou automática com o A1"}
            onClick={emitir}
          />
          <LinhaLista
            Icon={Camera}
            rotulo="Guardar uma nota"
            detalhe="Foto ou PDF de uma nota sua"
            onClick={() => (userId ? setGuardando(true) : toast("Entre na sua conta para guardar notas."))}
          />
        </SecaoLista>

        <SecaoLista titulo="Quando você precisa emitir">
          {(QUANDO[app.tipoMEI] || QUANDO.MEI).map((q) => (
            <LinhaLista key={q.rotulo} Icon={q.Icon} rotulo={q.rotulo} detalhe={q.detalhe} />
          ))}
        </SecaoLista>
      </div>

      {/* Emitir nota sem certificado: o A1 em 3 linhas + interesse */}
      <FolhaDeBaixo aberto={folhaA1} onFechar={() => setFolhaA1(false)} titulo="Certificado Digital A1">
        <SecaoLista style={{ marginTop: -8 }}>
          <LinhaLista rotulo="O que é" detalhe="A identidade digital do seu CNPJ, no padrão do governo." />
          <LinhaLista rotulo="Por que precisa" detalhe="A plataforma de notas assina cada nota com ele. Ele fica guardado lá, não no TaCerto." />
          <LinhaLista rotulo="Como tira" detalhe={`Por videochamada, com a CNH na mão. ${PRECO_A1} por 1 ano.`} />
        </SecaoLista>
        <button
          type="button"
          onClick={() => {
            setFolhaA1(false);
            abrirWhatsAppFisco(MENSAGENS_WHATSAPP.certificadoA1(dados));
          }}
          className="botao-confirmar toque w-full rounded-2xl font-semibold flex items-center justify-center"
          style={{ marginTop: 16, padding: "14px 0", fontSize: 16, gap: 8 }}
        >
          <IconeWhatsApp size={19} />
          Tenho interesse no certificado
        </button>
        <SecaoLista titulo="Sem certificado, hoje" style={{ marginTop: 20, paddingBottom: 6 }}>
          <LinhaLista
            Icon={IconeWhatsApp}
            rotulo="A Isa monta a nota com você"
            detalhe={caminhoneiro ? "Você manda o valor e pra quem foi o frete." : "Você manda o valor e pra quem foi o serviço."}
            onClick={() => {
              setFolhaA1(false);
              abrirWhatsAppFisco(MENSAGENS_WHATSAPP.notaAjuda(dados, caminhoneiro));
            }}
          />
          {MOSTRAR_TUTORIAL_NOTA && (
            <LinhaLista
              Icon={ListChecks}
              rotulo="Fazer sozinho"
              detalhe="Passo a passo no Emissor Nacional"
              onClick={() => {
                setFolhaA1(false);
                navigate("/como-emitir-nota", { state: { de: "notas" } });
              }}
            />
          )}
        </SecaoLista>
      </FolhaDeBaixo>

      {guardando && userId && (
        <FolhaLancarNota
          userId={userId}
          anoMin={anoInicio}
          onFechar={() => setGuardando(false)}
          onLancou={aoGuardar}
        />
      )}

      <FolhaSomarNoVelocimetro
        aberto={Boolean(somar)}
        valor={somar?.valor}
        data={somar?.data}
        descricao={descricaoDoLancamentoDaNota(somar || {})}
        onLigar={(idLancamento) => ligarNotaAoLancamento(userId, somar.id, idLancamento)}
        onFechar={() => setSomar(null)}
      />

      {aba && <BottomNav ativo="notas" />}
    </div>
  );
}

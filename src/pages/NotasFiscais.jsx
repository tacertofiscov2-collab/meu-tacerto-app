/* NOTASFISCAIS v7 — emissão pelo gov.br ou ajuda da Isa; certificado retirado das telas (v6: versão anterior) */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin, Route, Truck, CalendarClock, Store, Wrench, FilePlus2, Camera, FolderOpen, ListChecks, MessageCircle,
} from "lucide-react";
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

/* Bloco 8: Emitir nota oferece gov.br e a aba Isa.
   Guardar uma nota e Minhas notas mantêm os fluxos existentes. */

/* "Quando voce precisa emitir", por tipo de MEI */
const QUANDO = {
  MEI_CAMINHONEIRO: [
    { Icon: MapPin, rotulo: "Frete na mesma cidade", detalhe: "Nota de serviço (NFS-e), no gov.br." },
    { Icon: Route, rotulo: "Frete entre cidades, contratado direto", detalhe: "CT-e. Precisa de Inscrição Estadual." },
    { Icon: Truck, rotulo: "Agregado de transportadora (MG, sem Inscrição Estadual)", detalhe: "Hoje você não emite: quem emite é a transportadora." },
    { Icon: CalendarClock, rotulo: "A partir de 2027", detalhe: "O MEI vai ter que emitir nota em todo serviço." },
  ],
  MEI: [
    { Icon: Wrench, rotulo: "Serviço para empresa", detalhe: "Nota de serviço (NFS-e), no gov.br." },
    { Icon: Store, rotulo: "Venda de produto para empresa", detalhe: "Nota de produto (NF-e)." },
    { Icon: CalendarClock, rotulo: "A partir de 2027", detalhe: "O MEI vai ter que emitir nota em toda venda e serviço." },
  ],
};

export default function NotasFiscais({ aba = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const anoInicio = useAnoInicio();

  const [userId, setUserId] = useState(null);
  const [folhaEmitir, setFolhaEmitir] = useState(false);
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
    setFolhaEmitir(true);
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

        {/* Apresentação da aba Notas. */}
        <section
          className="rounded-2xl"
          style={{ marginTop: 10, padding: "16px 16px 15px", border: "1px solid var(--border)" }}
        >
          <p className="font-bold leading-snug" style={{ fontSize: 19, color: "var(--text)" }}>
            Emita e guarde suas notas aqui.
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
            detalhe="Pelo gov.br, com ajuda da Isa se precisar"
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

      <FolhaDeBaixo aberto={folhaEmitir} onFechar={() => setFolhaEmitir(false)} titulo="Emitir nota">
        <SecaoLista style={{ marginTop: -8, paddingBottom: 6 }}>
          <LinhaLista
            Icon={ListChecks}
            rotulo="Emitir pelo gov.br"
            onClick={() => {
              setFolhaEmitir(false);
              navigate("/como-emitir-nota", { state: { de: "notas" } });
            }}
          />
          <LinhaLista
            Icon={MessageCircle}
            rotulo="Precisa de ajuda? Fale com a Isa"
            onClick={() => {
              setFolhaEmitir(false);
              navigate("/fisco");
            }}
          />
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

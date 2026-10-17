/* PERFILCNPJ v5 — "Tipo de MEI no Perfil" vira "no Mais" (Bloco 3) (v4: sem "Receita" (decisao do Fernando, 12/10): "Nos dados públicos, o CNPJ aparece como “...”." (antes "A Receita mostra o CNPJ como") e "Ela confere se tem DAS atrasado ou alguma pendência no CNPJ e te avisa." (antes "pendência na Receita") (v3: vindo do DAS ("A Isa me manda o boleto" sem CNPJ): uma frase do porque no topo e, confirmado o CNPJ, volta para o DAS (v2: pagina do CNPJ com 2 estados: SEM CNPJ, as vantagens em lista curta + o campo de busca; COM CNPJ, situacao cadastral, MEI desde, atividades, municipio, "Consultado em" (guarda o resumo e a data da consulta), "Atualizar dados do CNPJ", "Remover CNPJ" e o destaque "Pedir pra Isa conferir meu CNPJ" (WhatsApp com o CNPJ) (v1: Perfil > Meu MEI > CNPJ: o mesmo fluxo do cadastro ("Qual o CNPJ do seu MEI?" -> "Achei você"); grava CNPJ, CNAE e MEI desde, sem mudar o tipo de MEI (travado))))) */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Check, Building2, User, ShieldCheck, CalendarDays, MapPin, Briefcase, RefreshCw, Trash2, Lock, Loader2,
} from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import FolhaDeBaixo from "../components/FolhaDeBaixo.jsx";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import { SecaoLista, LinhaLista } from "../components/ListaSimples.jsx";
import { PassoDigitarCnpj, PassoAcheiVoce } from "../components/FluxoCnpj.jsx";
import { useAppState } from "@/context/AppStateContext";
import {
  mesAnoDaOpcaoMei, mesAnoTexto, mascararCnpj, buscarCnpj, formatarCnae,
  situacaoEhAtiva, situacaoTexto, textoConsultadoEm, municipioTexto, nomeDaRazaoSocial,
} from "@/lib/cnpj";
import { sincronizarPerfilNoBanco, LABEL_PERFIL } from "@/lib/perfil";
import { MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco } from "@/config/piloto";

/* ===================================================================
   CNPJ PELO PERFIL (v1 em 10/10/2026, tarefa de 08-10; v2 em 10/10,
   tarefa de 10-10, Bloco C)

   SEM CNPJ (ou CNPJ digitado que nao deu para buscar):
   - as vantagens, cada uma em uma linha curta (o porque de pedir o
     dado: "aparece so quando precisa", uma frase de beneficio cada);
   - o campo de busca (o mesmo do cadastro, sem o titulo) e o "Achei
     você" para confirmar. Confirmou: guarda CNPJ, CNAE, MEI desde e o
     RESUMO da consulta (cnpjDados) com a data (cnpjConsultadoEm).

   COM CNPJ (confirmado):
   - os dados que vieram do CNPJ, so para ler: nome, situacao cadastral
     (Ativa/Inapta/...), MEI desde, municipio e as atividades; embaixo
     "Veio do seu CNPJ · Consultado em dd/mm às hh:mm";
   - destaque "Pedir pra Isa conferir meu CNPJ" -> WhatsApp com mensagem
     pronta (com o CNPJ). Hoje quem confere e a equipe: a tela NAO
     promete consulta automatica;
   - "Atualizar dados do CNPJ" (busca de novo e guarda) e "Remover CNPJ"
     (apaga o CNPJ e o que veio dele; o Tipo de MEI e a Abertura voltam
     a ser editaveis no Perfil).

   Regras que continuam:
   - o TIPO DE MEI nao muda aqui (so pela folha "O que mudou?"); se o
     CNPJ sugere outro tipo, a tela so avisa;
   - a ABERTURA: se o CNPJ diz que virou MEI ESTE ANO, vai para o perfil
     (limite proporcional). De outro ano, nada muda.
   =================================================================== */

const VANTAGENS = [
  "Preencho seus dados sozinho",
  "DAS com o valor certo da sua atividade",
  "Imposto de Renda calculado pela sua atividade",
  "Aviso se o CNPJ tiver algum problema",
  "No futuro, o boleto do DAS automático",
];

const AMARELO = "#f59e0b";

/* Abertura: se virou MEI este ano, o perfil acompanha (limite proporcional) */
function acertarAbertura(dataOpcaoMei, mesAnoAbertura, setMesAnoAbertura) {
  const ab = mesAnoDaOpcaoMei(dataOpcaoMei, new Date().getFullYear());
  const mudou = ab && (Number(mesAnoAbertura?.mes) !== ab.mes || Number(mesAnoAbertura?.ano) !== ab.ano);
  if (mudou) {
    setMesAnoAbertura(ab.mes, ab.ano);
    sincronizarPerfilNoBanco({ mesAbertura: ab.mes, anoAbertura: ab.ano });
  }
}

/* O que vai para o banco quando a busca deu certo */
function camposDoCnpj(dados) {
  return {
    cnpj: dados.cnpj,
    cnae: dados.cnaePrincipal || null,
    cnaesSecundarios: dados.cnaesSecundarios || [],
    dataOpcaoMei: dados.dataOpcaoMei || null,
    cnpjConfirmado: true,
    cnpjDados: dados,
  };
}

export default function PerfilCnpj() {
  const navigate = useNavigate();
  const location = useLocation();
  /* v3: veio da pagina do DAS ("A Isa me manda o boleto" pede o CNPJ) */
  const vindoDoDas = location.state?.motivo === "das";
  const app = useAppState();
  const {
    cnpj, cnpjConfirmado, cnae, cnaesSecundarios, dataOpcaoMei, cnpjDados, cnpjConsultadoEm,
    tipoMEI, salvarDadosCnpj, removerCnpj, mesAnoAbertura, setMesAnoAbertura,
  } = app;
  const [dados, setDados] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [confirmarRemover, setConfirmarRemover] = useState(false);
  const temCnpj = Boolean(cnpj && cnpjConfirmado);

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  async function confirmar() {
    if (!dados || salvando) return;
    setSalvando(true);
    await salvarDadosCnpj(camposDoCnpj(dados));
    acertarAbertura(dados.dataOpcaoMei, mesAnoAbertura, setMesAnoAbertura);
    setSalvando(false);
    setDados(null);
    toast.success("CNPJ confirmado");
    // v3: volta para o DAS (la a pessoa toca de novo e o WhatsApp abre)
    if (vindoDoDas && (window.history.state?.idx ?? 0) > 0) navigate(-1);
  }

  async function aoFalhar(digitos) {
    // Mesmo CNPJ de antes: nao mexe em nada (nem tira o "confirmado")
    if (digitos === cnpj) {
      toast("Não consegui buscar agora");
      return;
    }
    // CNPJ novo: guarda como nao confirmado; os dados do antigo saem
    await salvarDadosCnpj({
      cnpj: digitos,
      cnpjConfirmado: false,
      cnae: null,
      cnaesSecundarios: [],
      dataOpcaoMei: null,
      cnpjDados: null,
      cnpjConsultadoEm: null,
    });
    toast("Não consegui buscar agora. Guardei o CNPJ.");
  }

  /* "Atualizar dados do CNPJ": busca de novo e guarda (sem perguntar de
     novo "Achei você": e o mesmo CNPJ) */
  async function atualizar() {
    if (atualizando) return;
    setAtualizando(true);
    const r = await buscarCnpj(cnpj);
    setAtualizando(false);
    if (!r.ok) {
      toast("Não consegui buscar agora. Tente mais tarde.");
      return;
    }
    await salvarDadosCnpj(camposDoCnpj(r.dados));
    acertarAbertura(r.dados.dataOpcaoMei, mesAnoAbertura, setMesAnoAbertura);
    toast.success("Dados do CNPJ atualizados");
  }

  async function remover() {
    setConfirmarRemover(false);
    await removerCnpj();
    toast("CNPJ removido");
  }

  /* --------- COM CNPJ: os dados que vieram dele (so para ler) --------- */
  if (temCnpj && !dados) {
    const d = cnpjDados || {};
    const nome = d.nome || nomeDaRazaoSocial(d.razaoSocial || "");
    const ativa = situacaoEhAtiva(d.situacao);
    const desde = mesAnoTexto(d.dataOpcaoMei || dataOpcaoMei);
    const municipio = municipioTexto(d.municipio, d.uf);
    const atividades = Array.isArray(d.atividades) && d.atividades.length
      ? d.atividades
      : [cnae, ...(cnaesSecundarios || [])].filter(Boolean).map((codigo, i) => ({ codigo, descricao: "", principal: i === 0 }));
    const tipoDoCnpj = d.pareceCaminhoneiro === true ? "MEI_CAMINHONEIRO" : d.pareceCaminhoneiro === false ? "MEI" : null;
    const consultado = textoConsultadoEm(cnpjConsultadoEm);

    return (
      /* key: trocar de estado (ex.: removeu o CNPJ) remonta a tela e
         volta a rolagem para o topo */
      <div key="com-cnpj" className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <div
          className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
          style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
        >
          <TopoRolavel titulo="CNPJ" onVoltar={voltar} />

          <SecaoLista style={{ marginTop: 8 }}>
            <LinhaLista Icon={Building2} rotulo="CNPJ" valor={mascararCnpj(cnpj)} />
            {nome && <LinhaLista Icon={User} rotulo="Nome" valor={nome} />}
            {d.situacao && (
              <LinhaLista
                Icon={ShieldCheck}
                rotulo="Situação"
                valor={
                  <span className="inline-flex items-center" style={{ gap: 7 }}>
                    {situacaoTexto(d.situacao)}
                    {ativa === false && (
                      <span aria-hidden className="inline-block rounded-full" style={{ width: 7, height: 7, backgroundColor: AMARELO }} />
                    )}
                  </span>
                }
              />
            )}
            {desde && <LinhaLista Icon={CalendarDays} rotulo="MEI desde" valor={desde} />}
            {municipio && <LinhaLista Icon={MapPin} rotulo="Município" valor={municipio} />}
          </SecaoLista>

          {atividades.length > 0 && (
            <SecaoLista titulo="Atividades">
              {atividades.map((a) => (
                <LinhaLista
                  key={a.codigo}
                  Icon={Briefcase}
                  rotulo={a.descricao || formatarCnae(a.codigo)}
                  maxLinhas={4}
                  detalhe={`${a.descricao ? formatarCnae(a.codigo) : "CNAE"}${a.principal ? " · principal" : ""}`}
                />
              ))}
            </SecaoLista>
          )}

          {/* Veio do CNPJ: nada disso se edita a mao */}
          <p className="flex items-center" style={{ gap: 6, color: "var(--text-tertiary)", fontSize: 13, marginTop: 12 }}>
            <Lock size={13} strokeWidth={2.2} className="shrink-0" />
            {consultado ? `Veio do seu CNPJ · ${consultado}` : "Veio do seu CNPJ"}
          </p>
          {ativa === false && (
            <p style={{ color: AMARELO, fontSize: 14, marginTop: 8, lineHeight: 1.45 }}>
              Nos dados públicos, o CNPJ aparece como “{situacaoTexto(d.situacao)}”.
            </p>
          )}
          {tipoDoCnpj && tipoDoCnpj !== tipoMEI && (
            <p style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 8, lineHeight: 1.45 }}>
              O CNPJ parece de {LABEL_PERFIL[tipoDoCnpj]}. No app você está como {LABEL_PERFIL[tipoMEI] || "MEI"}: para trocar, use “Tipo de MEI” no Mais.
            </p>
          )}

          {/* Destaque: a Isa confere (hoje a equipe faz, pelo WhatsApp) */}
          <button
            type="button"
            onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.conferirCnpj(dadosParaWhatsApp(app)))}
            className="toque w-full rounded-2xl text-left flex items-center"
            style={{ marginTop: 22, gap: 14, padding: "15px 16px", background: "none", border: "1px solid rgba(34,197,94,0.45)" }}
          >
            <IconeWhatsApp size={22} className="shrink-0" style={{ color: "var(--primary)" }} />
            <span className="flex-1 min-w-0">
              <span className="block font-semibold leading-snug" style={{ fontSize: 16, color: "var(--text)" }}>
                Pedir pra Isa conferir meu CNPJ
              </span>
              <span className="block leading-snug" style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 3 }}>
                Ela confere se tem DAS atrasado ou alguma pendência no CNPJ e te avisa.
              </span>
            </span>
          </button>

          <SecaoLista>
            <LinhaLista
              Icon={atualizando ? Loader2 : RefreshCw}
              rotulo={atualizando ? "Atualizando..." : "Atualizar dados do CNPJ"}
              semSeta
              onClick={atualizar}
            />
            <LinhaLista Icon={Trash2} rotulo="Remover CNPJ" semSeta onClick={() => setConfirmarRemover(true)} />
          </SecaoLista>
        </div>

        <FolhaDeBaixo aberto={confirmarRemover} onFechar={() => setConfirmarRemover(false)} titulo="Remover o CNPJ?">
          <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.45, marginTop: -4 }}>
            Os dados que vieram dele saem do app. Você pode preencher à mão ou buscar de novo quando quiser.
          </p>
          <div className="flex" style={{ gap: 10, marginTop: 18, paddingBottom: 8 }}>
            <button
              type="button"
              onClick={() => setConfirmarRemover(false)}
              className="toque flex-1 rounded-2xl font-semibold"
              style={{ padding: "13px 0", fontSize: 15.5, border: "1px solid var(--border)", color: "var(--text)", background: "none" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={remover}
              className="botao-perigo toque flex-1 rounded-2xl font-semibold"
              style={{ padding: "13px 0", fontSize: 15.5 }}
            >
              Remover
            </button>
          </div>
        </FolhaDeBaixo>
      </div>
    );
  }

  /* --------- SEM CNPJ: vantagens + busca (ou "Achei você") --------- */
  return (
    <div key="sem-cnpj" className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(320px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo={dados ? "" : "CNPJ"} onVoltar={dados ? () => setDados(null) : voltar} />
        {!dados ? (
          <>
            {vindoDoDas && (
              <p style={{ fontSize: 15.5, lineHeight: 1.45, color: "var(--text)", marginTop: 10 }}>
                Para a Isa gerar seu boleto do DAS, preciso do seu CNPJ.
              </p>
            )}
            <SecaoLista titulo="Com o seu CNPJ" style={{ marginTop: vindoDoDas ? 22 : 8 }}>
              {VANTAGENS.map((v) => (
                <LinhaLista key={v} Icon={Check} rotulo={v} />
              ))}
            </SecaoLista>
            <div style={{ marginTop: 26 }}>
              <PassoDigitarCnpj
                valorInicial={cnpj}
                onAchou={setDados}
                onFalhou={aoFalhar}
                autoFocus={false}
                semTitulo
              />
            </div>
          </>
        ) : (
          <div className="max-w-sm w-full mx-auto" style={{ paddingTop: 12 }}>
            <PassoAcheiVoce
              dados={dados}
              tipo={dados.pareceCaminhoneiro ? "MEI_CAMINHONEIRO" : "MEI"}
              tipoDetectado={dados.pareceCaminhoneiro ? "MEI_CAMINHONEIRO" : "MEI"}
              tipoNoApp={tipoMEI}
              onConfirmar={confirmar}
              onNaoSouEu={() => setDados(null)}
              salvando={salvando}
            />
          </div>
        )}
      </div>
    </div>
  );
}

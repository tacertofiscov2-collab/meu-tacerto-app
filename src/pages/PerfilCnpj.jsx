/* PERFILCNPJ v1 — Perfil > Meu MEI > CNPJ: o mesmo fluxo do cadastro ("Qual o CNPJ do seu MEI?" -> "Achei você"); grava CNPJ, CNAE e MEI desde, sem mudar o tipo de MEI (travado) */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { PassoDigitarCnpj, PassoAcheiVoce } from "../components/FluxoCnpj.jsx";
import { useAppState } from "@/context/AppStateContext";
import { mesAnoDaOpcaoMei } from "@/lib/cnpj";
import { sincronizarPerfilNoBanco } from "@/lib/perfil";

/* ===================================================================
   CNPJ PELO PERFIL (10/10/2026 — tarefa de 08-10)

   Abre pela linha "CNPJ" do Perfil (com ou sem CNPJ preenchido). E o
   mesmo fluxo do cadastro (src/components/FluxoCnpj.jsx), com duas
   diferencas de proposito:
   - o TIPO DE MEI nao muda aqui (regra do app: so pela folha "O que
     mudou?"). Se o CNPJ sugerir outro tipo, a tela so avisa;
   - a ABERTURA: se o CNPJ diz que virou MEI ESTE ANO (data de opcao),
     ela vai para o perfil (o limite fica proporcional, como no
     cadastro). De outro ano, nada muda (so importa o primeiro ano).
   Busca que falhou: o CNPJ digitado (valido) fica guardado como nao
   confirmado; tocar de novo na linha tenta outra vez.
   =================================================================== */
export default function PerfilCnpj() {
  const navigate = useNavigate();
  const { cnpj, tipoMEI, salvarDadosCnpj, mesAnoAbertura, setMesAnoAbertura } = useAppState();
  const [dados, setDados] = useState(null);
  const [salvando, setSalvando] = useState(false);

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/perfil", { replace: true });
  }

  async function confirmar() {
    if (!dados || salvando) return;
    setSalvando(true);
    await salvarDadosCnpj({
      cnpj: dados.cnpj,
      cnae: dados.cnaePrincipal || null,
      cnaesSecundarios: dados.cnaesSecundarios || [],
      dataOpcaoMei: dados.dataOpcaoMei || null,
      cnpjConfirmado: true,
    });
    const anoAtual = new Date().getFullYear();
    const ab = mesAnoDaOpcaoMei(dados.dataOpcaoMei, anoAtual);
    const mudouAbertura = ab && (Number(mesAnoAbertura?.mes) !== ab.mes || Number(mesAnoAbertura?.ano) !== ab.ano);
    if (mudouAbertura) {
      setMesAnoAbertura(ab.mes, ab.ano);
      sincronizarPerfilNoBanco({ mesAbertura: ab.mes, anoAbertura: ab.ano });
    }
    setSalvando(false);
    toast.success("CNPJ confirmado");
    voltar();
  }

  async function aoFalhar(digitos) {
    // Mesmo CNPJ de antes: nao mexe em nada (nem tira o "confirmado")
    if (digitos === cnpj) {
      toast("Não consegui buscar agora");
      voltar();
      return;
    }
    // CNPJ novo: guarda como nao confirmado; os dados do antigo saem
    await salvarDadosCnpj({
      cnpj: digitos,
      cnpjConfirmado: false,
      cnae: null,
      cnaesSecundarios: [],
      dataOpcaoMei: null,
    });
    toast("Não consegui buscar agora. Guardei o CNPJ.");
    voltar();
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(320px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="" onVoltar={dados ? () => setDados(null) : voltar} />
        <div className="max-w-sm w-full mx-auto" style={{ paddingTop: 12 }}>
          {!dados ? (
            <PassoDigitarCnpj
              valorInicial={cnpj}
              onAchou={setDados}
              onFalhou={aoFalhar}
              onPular={voltar}
              textoPular="Agora não"
            />
          ) : (
            <PassoAcheiVoce
              dados={dados}
              tipo={dados.pareceCaminhoneiro ? "MEI_CAMINHONEIRO" : "MEI"}
              tipoDetectado={dados.pareceCaminhoneiro ? "MEI_CAMINHONEIRO" : "MEI"}
              tipoNoApp={tipoMEI}
              onConfirmar={confirmar}
              onNaoSouEu={() => setDados(null)}
              salvando={salvando}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* PAGINADAS v2 — sem "Receita" (decisao do Fernando, 12/10): passo 1 do "Pago sozinho" diz "O App MEI é o aplicativo oficial do governo." (antes "da Receita Federal") (v1: pagina propria do DAS ("o imposto mensal do MEI"), aberta pelo Perfil (Meu MEI > DAS) e pelo atalho DAS do Inicio: proximo vencimento real e valor pela atividade; "Como você quer pagar seu DAS?" (A Isa me manda o boleto, recomendado, exige CNPJ e liga os lembretes | Pago sozinho, passo a passo curto); "A Isa me ajuda agora" e o historico do DAS. Substitui a folha do Inicio (FolhaPagarDas) e o "Como pagar o DAS") */
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Bell, ExternalLink, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import IconeWhatsApp from "../components/IconeWhatsApp.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import SeloRecomendado from "../components/SeloRecomendado.jsx";
import { SecaoLista, LinhaLista, numeroDoPasso } from "../components/ListaSimples.jsx";
import { useAppState } from "@/context/AppStateContext";
import { proximoVencimentoDas, formatarDiaMes, diasAte, DAS_DIA_VENCIMENTO } from "@/lib/vencimentoDas";
import { valorDasMensal, atividadeDasPeloCnae } from "@/lib/fiscal";
import { soDigitosCnpj, formatarCnpj } from "@/lib/cnpj";
import {
  MENSAGENS_WHATSAPP, dadosParaWhatsApp, abrirWhatsAppFisco, LINK_PGMEI,
} from "@/config/piloto";

/* ===================================================================
   DAS (12/10/2026 — tarefa de 10-10, Bloco D)

   Aberta pelo Perfil (Meu MEI > DAS) e pelo atalho DAS do Inicio (o
   "Emitir boleto" do card Proximo DAS). Tudo do DAS num lugar so — o
   que estava na folha do Inicio (FolhaPagarDas) e no "Como pagar o
   DAS" (/como-pagar-das agora abre esta pagina).

   TOPO: o proximo vencimento REAL (dia 20, prorrogado para o proximo
   dia util: src/lib/vencimentoDas.js) e o valor pela atividade (CNAE do
   CNPJ; sem CNPJ, a atividade mais comum do tipo: src/lib/fiscal.js).

   "COMO VOCE QUER PAGAR SEU DAS?" — 2 opcoes, uma frase cada; a
   escolhida fica guardada (perfis.das_forma: "isa" | "sozinho"; antes
   do SQL de 10-10, no aparelho):
   1) "A Isa me manda o boleto" (Recomendado): EXIGE CNPJ (sem ele, abre
      a pagina do CNPJ e volta). Escolheu: liga os lembretes (se a
      pessoa tinha desligado, voltam os de padrao) e os avisos no
      WhatsApp, e abre o WhatsApp com a mensagem pronta pedindo o
      boleto. Escolhida, mostra os lembretes (dias e horario ->
      Preferencias).
   2) "Pago sozinho": passo a passo curto (App MEI ou Portal do Simples,
      so com o CNPJ) + "Abrir o Portal do Simples".
   NUNCA sugerir debito automatico (regra do projeto).

   OUTRAS: "A Isa me ajuda agora" (boleto deste mes ou atrasado) e o
   "Historico do DAS" (/das/historico: comprovante de cada mes).
   ⚠️ Os nomes dos botoes do PGMEI/App MEI foram escritos de memoria
   (iguais aos do antigo ComoPagarDas): conferir no site real.
   =================================================================== */

/* Nome curto da atividade que define o valor do DAS (chaves de DAS_2026) */
const ATIVIDADE_TEXTO = {
  intermunicipal_interestadual: "frete entre cidades",
  municipal: "frete na mesma cidade",
  icms_e_iss: "frete na cidade e entre cidades",
  produtos_perigosos_mudancas: "frete na cidade e entre cidades",
  servicos: "serviços",
  comercio_industria: "comércio ou indústria",
  comercio_e_servicos: "comércio e serviços",
};

const DIAS_PADRAO = [7, 2, 0];
const HORA_PADRAO = "09:00";

function reais(v) {
  return `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* "segunda" (sem o "-feira") */
function diaDaSemana(data) {
  return data.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/-feira$/, "");
}

/* [7, 2, 0] + "09:00" -> "7 e 2 dias antes e no dia · 9:00" */
function textoLembretes(dias, hora) {
  const lista = Array.isArray(dias) ? [...dias].sort((a, b) => b - a) : DIAS_PADRAO;
  if (lista.length === 0) return "Desligados";
  const antes = lista.filter((d) => d > 0);
  const noDia = lista.includes(0);
  const partes = [];
  if (antes.length) {
    const nums = antes.length > 1 ? `${antes.slice(0, -1).join(", ")} e ${antes[antes.length - 1]}` : String(antes[0]);
    partes.push(`${nums} ${antes.length === 1 && antes[0] === 1 ? "dia" : "dias"} antes`);
  }
  if (noDia) partes.push("no dia");
  const h = String(hora || HORA_PADRAO).replace(/^0(\d)/, "$1");
  return `${partes.join(" e ")} · ${h}`;
}

/* Cartao de uma das 2 formas de pagar. Escolhido: borda mais clara + ✓
   (sem verde, padrao do app). */
function FormaDePagar({ titulo, frase, escolhida, recomendado, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={escolhida}
      className="toque relative w-full rounded-2xl text-left flex items-center"
      style={{
        gap: 12,
        padding: "15px 16px",
        background: "none",
        border: `1px solid ${escolhida ? "var(--text-secondary)" : "var(--border)"}`,
      }}
    >
      {recomendado && <SeloRecomendado />}
      <span className="flex-1 min-w-0">
        <span className="block font-semibold leading-snug" style={{ fontSize: 16.5, color: "var(--text)" }}>
          {titulo}
        </span>
        <span className="block leading-snug" style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 3 }}>
          {frase}
        </span>
      </span>
      <span
        aria-hidden
        className="shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          border: `1.5px solid ${escolhida ? "var(--text)" : "var(--border)"}`,
          backgroundColor: escolhida ? "var(--text)" : "transparent",
        }}
      >
        {escolhida && <Check size={14} strokeWidth={3} style={{ color: "var(--bg)" }} />}
      </span>
    </button>
  );
}

export default function PaginaDas() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = useAppState();
  const { tipoMEI, cnae, cnaesSecundarios, cnpj, dasForma, lembreteDasDias, lembreteDasHora, salvarExtras, salvarLembreteDas } = app;
  const dados = dadosParaWhatsApp(app);
  const digitosCnpj = soDigitosCnpj(cnpj);
  const temCnpj = digitosCnpj.length === 14;

  const cnaes = [cnae, ...(cnaesSecundarios || [])].filter(Boolean);
  const valor = valorDasMensal(tipoMEI, cnaes);
  const atividade = ATIVIDADE_TEXTO[atividadeDasPeloCnae(tipoMEI, cnaes)] || "";
  const vencimento = proximoVencimentoDas();
  const faltam = diasAte(vencimento);
  const prorrogado = vencimento && vencimento.getDate() !== DAS_DIA_VENCIMENTO;
  const quando = faltam === 0 ? "Vence hoje" : faltam === 1 ? "Vence amanhã" : `Vence em ${faltam} dias`;

  function voltar() {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(location.state?.de === "perfil" ? "/perfil" : "/dashboard", { replace: true });
  }

  /* 1) "A Isa me manda o boleto" — sem CNPJ, primeiro o CNPJ */
  function escolherIsa() {
    if (!temCnpj) {
      navigate("/perfil/cnpj", { state: { de: "das", motivo: "das" } });
      return;
    }
    salvarExtras({ dasForma: "isa", avisosWhatsapp: true });
    if (Array.isArray(lembreteDasDias) && lembreteDasDias.length === 0) {
      salvarLembreteDas({ dias: DIAS_PADRAO });
    }
    // dentro do toque: o iPhone so abre o WhatsApp a partir de um toque
    abrirWhatsAppFisco(MENSAGENS_WHATSAPP.dasAutomatico(dados));
  }

  function escolherSozinho() {
    if (dasForma !== "sozinho") salvarExtras({ dasForma: "sozinho" });
  }

  async function copiarCnpj() {
    try {
      await navigator.clipboard.writeText(digitosCnpj);
      toast.success("CNPJ copiado");
    } catch {
      toast(formatarCnpj(digitosCnpj));
    }
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel
          titulo={
            <span className="block leading-tight">
              DAS
              <span className="block font-normal" style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 2 }}>
                o imposto mensal do MEI
              </span>
            </span>
          }
          onVoltar={voltar}
        />

        {/* Topo: proximo vencimento real + valor pela atividade */}
        <section style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Próximo vencimento</p>
          <div className="flex items-baseline justify-between" style={{ gap: 12, marginTop: 4 }}>
            <p className="font-bold" style={{ fontSize: 26, color: "var(--text)" }}>
              {vencimento ? `${diaDaSemana(vencimento)}, ${formatarDiaMes(vencimento)}` : "Dia 20"}
            </p>
            <p className="font-bold shrink-0" style={{ fontSize: 22, color: "var(--text)" }}>
              {reais(valor)}
            </p>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.45 }}>
            {faltam != null && faltam >= 0 ? `${quando}. ` : ""}
            {prorrogado ? "O dia 20 não é dia útil: passa pro próximo. " : ""}
            {atividade && (temCnpj && cnaes.length ? `Valor pela sua atividade (${atividade}).` : `Valor para ${atividade} (o mais comum).`)}
          </p>
        </section>

        {/* Como pagar: 2 opcoes */}
        <h2 className="font-semibold" style={{ fontSize: 17, color: "var(--text)", marginTop: 30, marginBottom: 14 }}>
          Como você quer pagar seu DAS?
        </h2>
        <div className="flex flex-col" style={{ gap: 12 }}>
          <FormaDePagar
            titulo="A Isa me manda o boleto"
            frase="Todo mês, antes do dia 20, no seu WhatsApp."
            recomendado
            escolhida={dasForma === "isa"}
            onClick={escolherIsa}
          />
          <FormaDePagar
            titulo="Pago sozinho"
            frase="Pelo App MEI ou pelo Portal do Simples, só com o CNPJ."
            escolhida={dasForma === "sozinho"}
            onClick={escolherSozinho}
          />
        </div>

        {dasForma === "isa" && (
          <SecaoLista style={{ marginTop: 14 }}>
            <LinhaLista
              Icon={Bell}
              rotulo="Lembretes no WhatsApp"
              detalhe={textoLembretes(lembreteDasDias, lembreteDasHora)}
              onClick={() => navigate("/preferencias", { state: { de: "das" } })}
            />
          </SecaoLista>
        )}

        {dasForma === "sozinho" && (
          <SecaoLista titulo="Passo a passo" style={{ marginTop: 22 }}>
            <LinhaLista
              Icon={numeroDoPasso(1)}
              rotulo="Abra o App MEI ou o Portal do Simples"
              detalhe="O App MEI é o aplicativo oficial do governo."
            />
            <LinhaLista
              Icon={numeroDoPasso(2)}
              rotulo="Digite seu CNPJ"
              detalhe={temCnpj ? `${formatarCnpj(digitosCnpj)} · toque para copiar` : "Só os números."}
              onClick={temCnpj ? copiarCnpj : undefined}
              semSeta
            />
            <LinhaLista
              Icon={numeroDoPasso(3)}
              rotulo="Escolha o mês e gere o boleto"
              detalhe="No Portal: “Emitir Guia de Pagamento (DAS)”."
            />
            <LinhaLista
              Icon={numeroDoPasso(4)}
              rotulo="Pague no app do banco"
              detalhe="Com o código de barras ou o Pix."
            />
            <LinhaLista
              Icon={ExternalLink}
              rotulo="Abrir o Portal do Simples"
              onClick={() => window.open(LINK_PGMEI, "_blank", "noopener")}
            />
          </SecaoLista>
        )}

        <SecaoLista titulo="Mais">
          <LinhaLista
            Icon={IconeWhatsApp}
            rotulo="A Isa me ajuda agora"
            detalhe="Boleto deste mês ou atrasado, e suas dúvidas."
            onClick={() => abrirWhatsAppFisco(MENSAGENS_WHATSAPP.dasAjudaAgora(dados))}
          />
          <LinhaLista
            Icon={CalendarCheck}
            rotulo="Histórico do DAS"
            detalhe="Guarde o comprovante de cada mês."
            onClick={() => navigate("/das/historico", { state: { de: "das" } })}
          />
        </SecaoLista>

      </div>
    </div>
  );
}

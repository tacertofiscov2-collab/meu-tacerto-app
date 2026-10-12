/* FOLHASOMARNOVELOCIMETRO v1 — depois de guardar uma nota (ou comprovante) de recebimento: "Posso somar R$ X no velocímetro?" [Não] [Sim]; antes de somar procura um recebimento parecido (+-1%, +-15 dias) e pergunta "É o mesmo?" — se for, so liga a nota a ele (nao conta duas vezes) */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FolhaDeBaixo from "./FolhaDeBaixo.jsx";
import { useAppState } from "@/context/AppStateContext";
import { acharLancamentoParecido } from "@/lib/conciliacao";

/* ===================================================================
   SOMAR NO VELOCIMETRO (12/10/2026 — tarefa de 10-10, Bloco E; o Bloco
   J usa a mesma folha para o comprovante lido pela foto)

   "Nada entra no faturamento sem a pessoa confirmar": esta folha e a
   confirmacao.
     1) "Essa nota é de um frete que você recebeu? Posso somar R$ X no
        velocímetro?"  [Não] [Sim, somar]
     2) Sim: procura no velocimetro um recebimento PARECIDO (mesmo valor
        +-1%, ate 15 dias antes ou depois — src/lib/conciliacao.js).
        Achou: "É o mesmo de 03/10, R$ 1.500,00?"
          [Sim, é o mesmo] -> so liga a nota a ele (vira o comprovante)
          [Não, é outro]   -> cria o lancamento novo
        Nao achou: cria o lancamento novo.
   Quem chama recebe onLigar(idDoLancamento, { criado }) para guardar a
   ligacao (ex.: ligarNotaAoLancamento).

   Props: aberto, valor (R$), data (ISO), descricao (do lancamento novo,
   ex.: "Nota fiscal nº 12"), oQue ("nota" | "comprovante"), onLigar,
   onFechar.
   =================================================================== */

function reais(v) {
  /* espaco que nao quebra: "R$" nunca fica sozinho no fim da linha */
  return `R$\u00a0${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* "03/10" no horario do aparelho */
function diaMes(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FolhaSomarNoVelocimetro({ aberto, valor, data, descricao, oQue = "nota", onLigar, onFechar }) {
  const { lancamentos, adicionarLancamento, tipoMEI } = useAppState();
  const [etapa, setEtapa] = useState("pergunta"); // pergunta | mesmo
  const [parecido, setParecido] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Abriu de novo (outra nota): volta para a primeira pergunta
  useEffect(() => {
    if (aberto) {
      setEtapa("pergunta");
      setParecido(null);
      setSalvando(false);
    }
  }, [aberto]);

  const caminhoneiro = tipoMEI === "MEI_CAMINHONEIRO";
  const doQue = caminhoneiro ? "de um frete" : "de um serviço ou venda";
  const essa = oQue === "comprovante" ? "Esse comprovante é" : "Essa nota é";

  async function criarNovo() {
    setSalvando(true);
    const id = await adicionarLancamento({ descricao, valor, data });
    await onLigar?.(id, { criado: true });
    setSalvando(false);
    toast.success(`Somei ${reais(valor)} no velocímetro`);
    onFechar();
  }

  function sim() {
    const achado = acharLancamentoParecido(lancamentos, { valor, data });
    if (achado) {
      setParecido(achado);
      setEtapa("mesmo");
    } else {
      criarNovo();
    }
  }

  async function ehOMesmo() {
    setSalvando(true);
    await onLigar?.(parecido.id, { criado: false });
    setSalvando(false);
    toast.success(oQue === "comprovante" ? "Comprovante ligado ao recebimento" : "Nota ligada ao recebimento");
    onFechar();
  }

  const titulo = etapa === "mesmo" ? "Já está no velocímetro?" : "Somar no velocímetro?";

  return (
    <FolhaDeBaixo aberto={aberto} onFechar={() => !salvando && onFechar()} titulo={titulo}>
      <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15.5, lineHeight: 1.45, marginTop: -4 }}>
        {etapa === "mesmo" && parecido
          ? `Achei um recebimento parecido: ${diaMes(parecido.data)}, ${reais(parecido.valor)}. É o mesmo?`
          : `${essa} ${doQue} que você recebeu? Posso somar ${reais(valor)} no velocímetro?`}
      </p>
      <div className="flex" style={{ gap: 10, marginTop: 18, paddingBottom: 8 }}>
        <button
          type="button"
          disabled={salvando}
          onClick={etapa === "mesmo" ? criarNovo : onFechar}
          className="toque flex-1 rounded-2xl font-semibold"
          style={{ padding: "13px 0", fontSize: 15.5, border: "1px solid var(--border)", color: "var(--text)", background: "none" }}
        >
          {etapa === "mesmo" ? "Não, é outro" : "Não"}
        </button>
        <button
          type="button"
          disabled={salvando}
          onClick={etapa === "mesmo" ? ehOMesmo : sim}
          className="botao-confirmar toque flex-1 rounded-2xl font-semibold flex items-center justify-center"
          style={{ padding: "13px 0", fontSize: 15.5, gap: 6 }}
        >
          {salvando && <Loader2 size={16} className="animate-spin" />}
          {etapa === "mesmo" ? "Sim, é o mesmo" : "Sim, somar"}
        </button>
      </div>
    </FolhaDeBaixo>
  );
}

/* LANCAR v1 — Historico de Notas Fiscais: 12 cards de mes, sem rolagem */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, ChevronRight, X } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";

/* ===================================================================
   HISTORICO DE NOTAS FISCAIS

   Uma janela com 12 cards (um por mes do ano atual). Tudo enquadrado
   na tela, SEM rolagem dentro da grade — a grade se encaixa na altura
   disponivel usando um grid 3x4.

   Ao tocar num mes, sobe um painel com as notas fiscais daquele mes.
   Cada nota mostra DATA e VALOR; ao tocar na nota, expande e mostra o
   resto dos detalhes (tomador, numero, descricao...).

   DE ONDE VEM A NOTA (pendencia de dados):
   Hoje ainda nao existe a fonte de notas emitidas. Esta tela ja vem
   pronta para receber. A funcao lerNotasDoMes(mes) e o unico ponto que
   muda quando as notas reais existirem — basta ela devolver a lista.
   Por enquanto devolve [] (mes vazio), e a tela mostra "nenhuma nota".
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Abreviacao curta para caber bonito no card.
const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function labelData(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} de ${MESES_LONGOS[d.getMonth()]}`;
}

/* PONTO UNICO DE LIGACAO COM OS DADOS REAIS.
   Recebe o indice do mes (0 = Janeiro) e o ano; devolve a lista de
   notas daquele mes. Quando as notas emitidas existirem, e so aqui que
   se conecta a fonte (banco/contexto). Formato esperado de cada nota:
     { id, data, valor, tomador, numero, descricao }
   Por enquanto: sempre vazio. */
function lerNotasDoMes(/* mesIdx, ano */) {
  return [];
}

export default function HistoricoNotas() {
  const navigate = useNavigate();
  const anoAtual = new Date().getFullYear();

  // Mes aberto no painel (null = grade, nenhum aberto).
  const [mesAberto, setMesAberto] = useState(null);
  // Nota expandida dentro do painel (id ou null).
  const [notaExpandida, setNotaExpandida] = useState(null);

  const notasDoMes = useMemo(
    () => (mesAberto === null ? [] : lerNotasDoMes(mesAberto, anoAtual)),
    [mesAberto, anoAtual],
  );

  const totalDoMes = useMemo(
    () => notasDoMes.reduce((s, n) => s + (Number(n.valor) || 0), 0),
    [notasDoMes],
  );

  function abrirMes(i) {
    setNotaExpandida(null);
    setMesAberto(i);
  }

  function fecharPainel() {
    setMesAberto(null);
    setNotaExpandida(null);
  }

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Histórico de notas
        </h1>
      </header>

      {/* Subtitulo — so o ano */}
      <div className="px-5 pt-1 pb-3 shrink-0">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {anoAtual}
        </p>
      </div>

      {/* GRADE 3x4 — ocupa o espaco que sobra, sem rolagem.
          flex-1 estica ate o rodape; o grid divide em 3 colunas e 4
          linhas iguais, entao os 12 cards se encaixam na tela. */}
      <div
        className="flex-1 px-5 grid grid-cols-3 grid-rows-4 gap-2.5"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        {MESES.map((mes, i) => (
          <button
            key={mes}
            onClick={() => abrirMes(i)}
            className="card-tacerto rounded-2xl flex flex-col items-center justify-center gap-1.5 active:opacity-80"
          >
            <FileText size={22} strokeWidth={2} style={{ color: "var(--primary)" }} />
            <span className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
              {MESES_CURTO[i]}
            </span>
          </button>
        ))}
      </div>

      {/* PAINEL DO MES — sobe de baixo quando um mes e tocado */}
      {mesAberto !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={fecharPainel}
        >
          <div
            className="w-full max-w-md p-4 flex flex-col"
            style={{
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
              maxHeight: "80dvh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecalho do painel */}
            <div className="flex items-center justify-between px-1 pb-3 shrink-0">
              <div>
                <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {MESES[mesAberto]} de {anoAtual}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {notasDoMes.length === 0
                    ? "Nenhuma nota emitida"
                    : `${notasDoMes.length} ${notasDoMes.length === 1 ? "nota" : "notas"} • total `}
                  {notasDoMes.length > 0 && (
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>
                      <Valor tamanho="sm">{totalDoMes}</Valor>
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fecharPainel}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>

            {/* Lista de notas do mes (rola so aqui dentro, se precisar) */}
            <div className="space-y-2 overflow-y-auto hide-scrollbar min-h-0">
              {notasDoMes.length === 0 ? (
                <div className="card-tacerto rounded-2xl py-10 flex flex-col items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--surface)", width: 52, height: 52 }}
                  >
                    <FileText size={24} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                    Nenhuma nota fiscal neste mês
                  </p>
                </div>
              ) : (
                notasDoMes.map((n) => {
                  const aberta = notaExpandida === n.id;
                  return (
                    <div key={n.id} className="card-tacerto rounded-2xl px-4 py-3">
                      {/* Linha principal: data + valor (o que sempre aparece) */}
                      <button
                        onClick={() => setNotaExpandida(aberta ? null : n.id)}
                        className="w-full flex items-center gap-3 text-left active:opacity-80"
                      >
                        <FileText
                          size={19}
                          strokeWidth={2}
                          style={{ color: "var(--primary)" }}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold leading-tight" style={{ color: "var(--text)" }}>
                            {labelData(n.data)}
                          </p>
                        </div>
                        <Valor tamanho="md" sinal="+">{n.valor}</Valor>
                        <ChevronRight
                          size={17}
                          style={{
                            color: "var(--text-tertiary)",
                            transform: aberta ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                          className="shrink-0"
                        />
                      </button>

                      {/* Detalhes: aparecem ao tocar na nota */}
                      {aberta && (
                        <div
                          className="mt-3 pt-3 space-y-2"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {n.numero && (
                            <LinhaDetalhe rotulo="Número da nota" valor={n.numero} />
                          )}
                          {n.tomador && (
                            <LinhaDetalhe rotulo="Tomador" valor={n.tomador} />
                          )}
                          {n.descricao && (
                            <LinhaDetalhe rotulo="Descrição" valor={n.descricao} />
                          )}
                          <LinhaDetalhe rotulo="Data" valor={labelData(n.data)} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav ativo="perfil" />
    </div>
  );
}

/* Uma linha de detalhe (rotulo a esquerda, valor a direita). */
function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
        {rotulo}
      </span>
      <span className="text-sm font-medium text-right" style={{ color: "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}
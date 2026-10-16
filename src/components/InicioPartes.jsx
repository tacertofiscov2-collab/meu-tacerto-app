/* INICIOPARTES v2 — sai a barra da Isa do Inicio (a Isa fica so na aba Isa do rodape); no lugar, "Ultimos lancamentos" (3 mais recentes com data, selo com nota/sem nota e valor, "Ver todos"; sem lancamento: "Comece pelo extrato"), altura fixa reservada antes de carregar (ajuste do Bloco 3) (v1: pecas do Inicio usadas no Inicio de verdade (Dashboard) E no celular de exemplo do tutorial (ApresentacaoFisco), para os dois nunca mais ficarem diferentes: medidas (MEDIDAS_INICIO), vidro, luz correndo na borda, botao pequeno "Atualizar velocímetro" no canto do card (com "Atualizado em" embaixo) e a barra da Isa (foto 68 + barra 44 com camera, clipe e microfone)) */
import { RefreshCw, ChevronRight, FileUp } from "lucide-react";

/* ===================================================================
   PECAS DO INICIO (12/10/2026 — print do Fernando: "o dashboard esta
   muito mal enquadrado" e "o tutorial tem que mostrar o dashboard igual
   esta")

   Antes, o celular de exemplo do tutorial era um desenho a parte e
   ficou parado num visual antigo (o F). Agora as medidas e as pecas
   que mudaram vivem AQUI: o Dashboard e o tutorial importam as mesmas.
   Mudou um numero aqui, muda nos dois.
   =================================================================== */

export const MEDIDAS_INICIO = {
  /* Velocimetro do card (o arco cresce ate larguraMax e encolhe sozinho
     se a tela for baixa, ate larguraMin). alturaNumero = linha do numero
     (48 do text-5xl; o balao de 44 cabe nela) + 4 de margem + 6 de
     folga, para o "?" nunca encostar no rotulo "MEI · anual". */
  velocimetro: {
    larguraMax: 280,
    larguraMin: 100,
    alturaNumero: 58,
    numeroClasse: "text-5xl font-bold",
    balao: 44,
    valorPx: 19,
    rotuloValorPx: 14,
  },
  /* Card: espaco reservado em cima para o botao do canto (o arco
     comeca abaixo dele) e altura maxima (em tela alta o card nao vira
     um bloco vazio: o que sobra fica em volta dele). */
  card: { topo: 44, alturaMax: 440, base: 12 },
  /* v2: "Ultimos lancamentos" no pe do Inicio (no lugar do chat da
     Isa): titulo + 3 linhas, altura fixa (reservada antes de carregar) */
  ultimos: { titulo: 26, linha: 40, linhas: 3, margemCima: 12, margemBaixo: 8 },
};

/* ===================================================================
   VIDRO — os valores vêm do index.css e mudam com o tema.
   No tema escuro o fundo é quase preto com brilhos brancos; no tema
   claro, fundo quase branco com brilhos suaves. Ver as variáveis
   --vidro-* em src/index.css. (Vieram do Dashboard.jsx.)
   =================================================================== */
export const VIDRO = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1.5px 0 0 var(--vidro-topo-forte), inset 0 9px 20px -8px var(--vidro-topo-medio), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

/* Reflexo reduzido: um pouco mais forte que o dos cards A/B.
   Usado nas barras do chat e na caixa expandida. */
export const VIDRO_SUAVE = {
  background:
    "linear-gradient(160deg, var(--vidro-brilho-1) 0%, var(--vidro-brilho-2) 24%, transparent 58%), var(--vidro-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid var(--vidro-borda)",
  boxShadow:
    "inset 0 1px 0 0 var(--vidro-topo-medio), inset 0 7px 16px -8px var(--vidro-topo-fraco), inset 0 -1.5px 0 0 var(--vidro-base), 0 8px 24px var(--vidro-sombra)",
};

/** Luz verde correndo em volta da borda. (Era da barra da Isa no
    Inicio, que saiu na v2; fica para quem quiser usar.) Fica girando o tempo todo,
    mas o elemento é pequeno — o custo de repintura é baixo. */
export function BordaCorrendo({ raio = 999, espessura = 1.6 }) {
  return (
    <>
      <style>{`
        @property --anguloLuz {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes girarLuz {
          to { --anguloLuz: 360deg; }
        }
        .borda-correndo {
          animation: girarLuz 3.2s linear infinite;
        }
        /* Safari antigo não suporta @property: a luz não gira, então
           some — a borda normal do elemento continua ali. */
        @supports not (background: conic-gradient(from 0deg, red, blue)) {
          .borda-correndo { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .borda-correndo { animation: none; opacity: 0.5; }
        }
      `}</style>
      <span
        aria-hidden
        className="borda-correndo pointer-events-none absolute"
        style={{
          inset: 0,
          borderRadius: raio,
          padding: espessura,
          background:
            "conic-gradient(from var(--anguloLuz), transparent 0%, transparent 62%, rgba(34,197,94,0.35) 74%, #4ade80 86%, rgba(134,239,172,0.9) 92%, transparent 100%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          zIndex: 2,
        }}
      />
    </>
  );
}

const pad2 = (n) => String(n).padStart(2, "0");
/* "Atualizado em 08/10 às 14:32" (vazio sem data) */
export function textoAtualizadoEm(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d.getTime())) return "";
  return `Atualizado em ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} às ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* ===================================================================
   "ATUALIZAR VELOCIMETRO" NO CANTO DO CARD (pedido do Fernando: "coloque
   o atualizar velocimetro no canto superior direito do card, deixe ele
   menor, no cantinho... e abaixo dele escrito pequeno a ultima
   atualizacao, depois que a pessoa fizer a primeira atualizacao")

   Fica no contorno do card (por cima das duas paginas do carrossel,
   parado quando a pessoa desliza). Zerado (faltaInformar): o botao fica
   com o contorno verde, para chamar a primeira atualizacao; sem texto
   embaixo. exemplo = desenho do tutorial (nada e clicavel).
   =================================================================== */
export function BotaoAtualizarCanto({ quando, faltaInformar, onAtualizar, exemplo = false }) {
  const texto = faltaInformar ? "" : textoAtualizadoEm(quando);
  const Botao = exemplo ? "span" : "button";
  /* o toque no botao nao comeca o arrasto do carrossel */
  const parar = exemplo ? undefined : (e) => e.stopPropagation();
  return (
    <div
      data-alvo="atualizar"
      className="absolute flex flex-col items-end"
      style={{ top: 10, right: 12, zIndex: 4 }}
      onTouchStart={parar}
      onMouseDown={parar}
    >
      <Botao
        {...(exemplo ? {} : { type: "button", onClick: onAtualizar })}
        className={`${faltaInformar ? "botao-confirmar " : ""}${exemplo ? "" : "toque "}rounded-full font-medium flex items-center`}
        style={{
          gap: 5,
          height: 28,
          padding: "0 10px",
          fontSize: 12.5,
          background: "none",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        <RefreshCw size={13} strokeWidth={2.1} />
        Atualizar velocímetro
      </Botao>
      {texto && (
        <span style={{ fontSize: 11, lineHeight: "14px", marginTop: 3, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
          {texto}
        </span>
      )}
    </div>
  );
}

/* ===================================================================
   ULTIMOS LANCAMENTOS (16/10/2026 — ajuste do Bloco 3: "a Isa fica SO
   na aba Isa do rodape"; no lugar do chat, abaixo do card)

   Ultimos lancamentos                         Ver todos ›
   16/10   [com nota]                     + R$ 1.200,00
   (os 3 mais recentes: data, selo e valor; tocar leva ao Historico)

   - Sem nenhum lancamento: so o botao "Comece pelo extrato" (Enviar
     extrato), no mesmo espaco.
   - ALTURA FIXA (MEDIDAS_INICIO.ultimos): o espaco e reservado antes de
     os lancamentos chegarem do banco, entao nada no Inicio muda de
     altura entre carregar e mostrar. Enquanto carrega (carregado =
     false), o espaco fica vazio.
   - Selo: "com nota" quando o recebimento tem nota (temNota, Bloco 4);
     senao "sem nota".
   - exemplo = desenho do tutorial (sem valores, nada clicavel).
   =================================================================== */
const ddmm = (iso) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
};
const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function SeloNota({ temNota }) {
  return (
    <span
      className="inline-flex items-center rounded-full shrink-0"
      style={{
        height: 22,
        padding: "0 9px",
        fontSize: 12,
        lineHeight: 1,
        border: "1px solid var(--border)",
        color: temNota ? "var(--text)" : "var(--text-tertiary)",
        whiteSpace: "nowrap",
      }}
    >
      {temNota ? "com nota" : "sem nota"}
    </span>
  );
}

export function UltimosLancamentos({
  lancamentos = [], carregado = true, onVerTodos, onEnviarExtrato, exemplo = false,
}) {
  const M = MEDIDAS_INICIO.ultimos;
  const Botao = exemplo ? "span" : "button";
  const ultimos = exemplo
    ? [
        { id: 1, data: new Date().toISOString(), temNota: true },
        { id: 2, data: new Date(Date.now() - 2 * 86400000).toISOString(), temNota: false },
        { id: 3, data: new Date(Date.now() - 5 * 86400000).toISOString(), temNota: true },
      ]
    : [...lancamentos]
        .sort((a, b) => new Date(b.data) - new Date(a.data) || String(b.criado_em || "").localeCompare(String(a.criado_em || "")))
        .slice(0, M.linhas);
  const vazio = !exemplo && carregado && ultimos.length === 0;
  const tocar = (fn) => (exemplo ? {} : { type: "button", onClick: fn });

  return (
    <div
      data-alvo="ultimos"
      className="shrink-0 w-full flex flex-col"
      style={{ height: M.titulo + M.linha * M.linhas, marginTop: M.margemCima, marginBottom: M.margemBaixo }}
    >
      {vazio ? (
        <div className="flex-1 flex items-center justify-center">
          <Botao
            {...tocar(onEnviarExtrato)}
            className={`${exemplo ? "" : "toque "}rounded-2xl font-semibold flex items-center justify-center w-full`}
            style={{ height: 52, gap: 8, fontSize: 16, color: "var(--text)", background: "none", border: "1px solid var(--border)" }}
          >
            <FileUp size={19} strokeWidth={2} style={{ color: "var(--text-secondary)" }} />
            Comece pelo extrato
          </Botao>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between shrink-0" style={{ height: M.titulo }}>
            <span className="font-semibold" style={{ fontSize: 14, color: "var(--text-secondary)" }}>Últimos lançamentos</span>
            {(exemplo || ultimos.length > 0) && (
              <Botao
                {...tocar(onVerTodos)}
                className={`${exemplo ? "" : "toque "}flex items-center font-medium`}
                style={{ fontSize: 14, color: "var(--text-secondary)", background: "none", border: "none", padding: 0, height: M.titulo }}
              >
                Ver todos
                <ChevronRight size={16} strokeWidth={2} />
              </Botao>
            )}
          </div>
          {ultimos.map((l, i) => (
            <Botao
              key={l.id}
              {...tocar(onVerTodos)}
              className={`${exemplo ? "" : "toque "}flex items-center w-full text-left`}
              style={{
                height: M.linha,
                gap: 10,
                background: "none",
                border: "none",
                padding: 0,
                borderTop: i ? "1px solid var(--border)" : "none",
              }}
            >
              <span className="shrink-0" style={{ fontSize: 15, color: "var(--text-secondary)", width: 46, fontVariantNumeric: "tabular-nums" }}>
                {ddmm(l.data)}
              </span>
              <SeloNota temNota={l.temNota === true} />
              <span
                className="flex-1 min-w-0 text-right font-semibold truncate"
                style={{ fontSize: 16, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}
              >
                {exemplo ? "R$ •••" : formatoReal.format(Number(l.valor) || 0)}
              </span>
            </Botao>
          ))}
        </>
      )}
    </div>
  );
}

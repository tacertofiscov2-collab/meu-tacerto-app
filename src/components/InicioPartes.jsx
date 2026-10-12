/* INICIOPARTES v1 — pecas do Inicio usadas no Inicio de verdade (Dashboard) E no celular de exemplo do tutorial (ApresentacaoFisco), para os dois nunca mais ficarem diferentes: medidas (MEDIDAS_INICIO), vidro, luz correndo na borda, botao pequeno "Atualizar velocímetro" no canto do card (com "Atualizado em" embaixo) e a barra da Isa (foto 68 + barra 44 com camera, clipe e microfone) */
import { Camera, Paperclip, Mic, RefreshCw } from "lucide-react";
import { FOTO_ISA_256 } from "./FotoIsa.jsx";

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
  /* Chat da Isa no pe do Inicio (era foto 96 + barra 48) */
  isa: { foto: 68, barra: 44, margemCima: 12, margemBaixo: 10 },
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

/** Luz verde correndo em volta da borda. Usada na barra fechada da
    Isa no Inicio, para chamar atenção. Fica girando o tempo todo,
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

/* Botao de icone da barra da Isa (30 x 40 de toque: com 34 o
   "Pergunte à Isa..." cortava na largura do iPhone) */
function IconeDaBarra({ Icon, rotulo, onClick, cor = "var(--text-secondary)", exemplo }) {
  const Botao = exemplo ? "span" : "button";
  return (
    <Botao
      {...(exemplo ? {} : { type: "button", onClick, "aria-label": rotulo })}
      className={`${exemplo ? "" : "toque "}relative shrink-0 rounded-full flex items-center justify-center`}
      style={{ width: 30, height: 40, background: "none", border: "none", padding: 0, zIndex: 3 }}
    >
      <Icon size={19} strokeWidth={2} style={{ color: cor }} />
    </Botao>
  );
}

/* ===================================================================
   BARRA DA ISA NO PE DO INICIO (pedido do Fernando: "diminua o tamanho,
   tanto da foto quanto da barra, e o chat ta sem a opcao de mandar foto,
   audio, anexar doc... corrija")

   [foto 68] [ Pergunte à Isa...   📷  📎  🎤 ]  (barra de 44)
   - tocar na foto ou no texto: abre a caixinha para escrever (onAbrir);
   - camera: tira a foto do comprovante (onCamera);
   - clipe: escolhe foto ou PDF (onAnexo);
   - microfone: abre o WhatsApp da Isa para mandar o audio (onAudio).
   Sem anexos (MOSTRAR_ANEXOS_CHAT desligado), so o texto.
   barraEscondida: a barra some (a caixinha aberta fica no lugar dela);
   a foto fica.
   =================================================================== */
export function BarraIsaInicio({
  onAbrir, onCamera, onAnexo, onAudio, anexos = true, barraEscondida = false, exemplo = false,
}) {
  const M = MEDIDAS_INICIO.isa;
  const Botao = exemplo ? "span" : "button";
  const abrir = exemplo ? {} : { type: "button", onClick: onAbrir };
  return (
    <div
      data-alvo="fisco"
      className="shrink-0 w-full flex items-center"
      style={{ gap: 8, marginTop: M.margemCima, marginBottom: M.margemBaixo }}
    >
      <Botao
        {...abrir}
        {...(exemplo ? {} : { "aria-label": "Conversar com a Isa" })}
        className="relative shrink-0 rounded-full flex items-center justify-center"
        style={{ width: M.foto, height: M.foto, padding: 0, ...VIDRO, border: "1.5px solid rgba(34,197,94,0.45)" }}
      >
        <span className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
          <img
            src={FOTO_ISA_256}
            alt={exemplo ? "" : "Isa, assistente virtual"}
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </span>
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{ width: 18, height: 18, backgroundColor: "var(--primary)", border: "3px solid var(--bg)", bottom: 1, right: 1 }}
        />
      </Botao>

      <span
        className="relative flex-1 min-w-0 flex items-center rounded-full"
        style={{
          ...VIDRO_SUAVE,
          height: M.barra,
          paddingLeft: 15,
          paddingRight: 6,
          // So a barrinha some quando a caixa aberta esta na tela. A foto
          // da Isa fica fixa, inclusive durante o fecho.
          visibility: barraEscondida ? "hidden" : "visible",
        }}
      >
        <BordaCorrendo />
        <Botao
          {...abrir}
          className={`${exemplo ? "" : "toque "}relative flex-1 min-w-0 h-full flex items-center text-left`}
          style={{ background: "none", border: "none", padding: 0, zIndex: 3 }}
        >
          <span
            className="truncate"
            style={{
              color: "var(--text-tertiary)",
              fontSize: 15,
              fontStyle: "italic",
              fontFamily: '"Comic Neue", "Chalkboard SE", "Comic Sans MS", cursive',
            }}
          >
            Pergunte à Isa...
          </span>
        </Botao>
        {anexos && (
          <>
            <IconeDaBarra Icon={Camera} rotulo="Tirar foto do comprovante" onClick={onCamera} exemplo={exemplo} />
            <IconeDaBarra Icon={Paperclip} rotulo="Anexar foto ou documento" onClick={onAnexo} exemplo={exemplo} />
            <IconeDaBarra Icon={Mic} rotulo="Mandar áudio para a Isa no WhatsApp" onClick={onAudio} cor="var(--primary)" exemplo={exemplo} />
          </>
        )}
      </span>
    </div>
  );
}

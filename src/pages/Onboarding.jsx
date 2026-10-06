/* ONBOARDING v13 — cara do app: opcao escolhida sem verde e sem fundo cinza (so mais acesa), fundo preto em tudo, verde so no botao de continuar; letras maiores; campos com 16px (o iPhone dava zoom) (v12: setinha de voltar maior (bolinha 46, seta 24; sem bolinha, seta 26) (v11: botao "Começar a usar" em contorno verde (botao-confirmar) (v10: gesto de voltar do iPhone volta UMA ETAPA (nao sai mais do onboarding para o Inicio); onboarding ja feito volta para o Inicio (v9: nome ja preenchido; v8: "Digitar valor" em folha acima do teclado))) */
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, ArrowRight, Briefcase, Truck, CheckCircle2, Clock, Gauge, CalendarDays, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { salvarPerfilLocal } from "@/lib/localData";
import { setUserState } from "@/lib/userState";
import { LIMITES_ANUAIS, limiteProporcional, LIMITE_NOME_INPUT } from "@/lib/fiscal";
import SeletorMesAno from "@/components/SeletorMesAno";
import Valor from "@/components/Valor";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";
import { useAppState } from "@/context/AppStateContext";

/* ===================================================================
   ONBOARDING v8 (04/10/2026) — pedido do Fernando, testado no iPhone

   1) TECLADO: o campo do "Digitar valor" ficava no meio da tela e o
      teclado do iPhone subia por cima dele. Agora o "Digitar valor"
      abre uma FOLHA que sobe de baixo (FolhaDigitarValor), com a mesma
      tecnica da folha "Lançar saída" (Saidas.jsx): a folha acompanha o
      espaco visivel acima do teclado (visualViewport), entao o campo e
      o botao nunca ficam escondidos. O botao da folha ja termina o
      cadastro ("Começar a usar"). Fechar pelo X guarda o valor: ele
      aparece no proprio quadrinho ("R$ 98.000") e o "Começar a usar"
      da tela tambem funciona.
      Sem campo na tela, o step 4 voltou a ficar centralizado, como o
      2 e o 3.

   2) TITULO: "Quanto você já faturou em <ano>?" — sem o "mais ou
      menos".
   =================================================================== */

/* ===================================================================
   ONBOARDING v7 (04/10/2026) — PILOTO COM MEI CAMINHONEIROS

   1) TIPO DE MEI: "MEI Caminhoneiro" vem PRIMEIRO e JA MARCADO (e o
      publico do piloto). "MEI (outras atividades)" continua ali, e so
      tocar. Sem aviso nenhum (o "Confira" segue rejeitado, ver v6).

   2) ETAPA NOVA (step 4), depois da data de abertura:
      "Quanto voce mais ou menos ja faturou em <ano>?"
        - faixas para tocar (FAIXAS_FATURAMENTO): grava o PONTO MEDIO
          da faixa. "Mais de R$ 200 mil" nao tem fim: grava 225 mil
          (meio do caminho entre 200 mil e 250 mil, perto do limite do
          caminhoneiro).
        - "Digitar valor": grava o valor digitado (em reais, sem
          centavos).
        - "Nao sei agora": pula, nao grava nada.
      SEM MUDAR O BANCO: vira um LANCAMENTO normal na tabela
      `lancamentos` que ja existe, com a descricao DESCRICAO_ESTIMADO e
      a data de hoje, pelo mesmo adicionarLancamento do botao "+". Por
      isso o velocimetro ja mostra o valor ao abrir o Dashboard, e a
      pessoa pode editar ou apagar depois no Historico de entradas.
      Se ja existir um lancamento com essa descricao (onboarding feito
      de novo), nao grava outro — nao conta em dobro.
      O step 4 rola e ancora no topo (temCampoDeTexto), porque o
      "Digitar valor" abre o teclado.

   3) O "Comecar a usar" saiu do step 3 (virou "Continuar") e foi para
      o step 4. Os botoes finais travam enquanto salva (toque duplo nao
      grava duas vezes).
   =================================================================== */

/* Descricao do lancamento do faturamento estimado (aparece no
   Historico de entradas). */
const DESCRICAO_ESTIMADO = "Faturamento estimado até hoje";

/* Faixas do step 4. `valor` = o que vai para o velocimetro. */
const FAIXAS_FATURAMENTO = [
  { id: "ate50", rotulo: "Até R$ 50 mil", valor: 25000 },
  { id: "50a100", rotulo: "R$ 50 a 100 mil", valor: 75000 },
  { id: "100a150", rotulo: "R$ 100 a 150 mil", valor: 125000 },
  { id: "150a200", rotulo: "R$ 150 a 200 mil", valor: 175000 },
  { id: "mais200", rotulo: "Mais de R$ 200 mil", valor: 225000 },
];
const FAIXA_DIGITAR = "digitar";
/* Ate 9.999.999 (7 digitos), dentro do teto de um lancamento. */
const MAX_DIGITOS_ESTIMADO = 7;

/* ===================================================================
   ONBOARDING v6 (26/09/2026)

   1) O aviso "Confira: isso define seu limite..." que a v5 colocou na
      escolha do tipo de MEI SAIU (pedido do Fernando: nao precisa). O
      step 2 voltou a ser como era. A mensagem curta da escolha da data
      (step 3: "Limite cheio: R$ 81.000 / ano" ou o limite proporcional
      ao lado do mes) continua igual.

   2) ACENTOS (desde a v5): os textos da tela estavam sem acento ("Qual
      e o seu MEI?", "Voce abriu", "Comecar a usar"...). Agora estao
      certos.

   A pergunta "Voce abriu seu MEI em <ano>?" (step 3) JA fazia o que foi
   decidido para a data de abertura: Sim -> pede o mes e grava mes/ano;
   Nao -> grava null (o app nao guarda nada). Nao mudou.

   ===================================================================
   ONBOARDING v4 — O TECLADO NAO COBRE MAIS OS CAMPOS (17/09/2026)

   O PROBLEMA: no step 1 ("Como posso te chamar?") e no step 0
   (WhatsApp), o teclado do iPhone subia e cobria o campo. No step
   "verificar" (codigo de 6 digitos) isso NAO acontecia — funcionava
   perfeito, com o conteudo subindo suave.

   POR QUE A TELA DO CODIGO FUNCIONAVA E AS OUTRAS NAO:
     A v3 tratava o step "verificar" como caso especial, com DUAS
     diferencas que ninguem tinha ligado ao bug:

       1) `overflowY: isVerificar ? "auto" : "hidden"`
          So o step do codigo podia rolar. Nos outros, a raiz
          `.tela-fixa` (overflow: hidden) travava tudo — nao havia como
          trazer o campo de volta.

       2) `justifyContent: isVerificar ? "flex-start" : "center"`
          So o step do codigo ancorava no topo. Nos outros, o
          `center` centralizava o bloco na altura CHEIA da tela (que
          nao encolhe com o teclado, bug 6 do handoff), jogando metade
          do conteudo para tras do teclado.

     Era a combinacao dos dois que fazia aquele step dar certo.

   A CORRECAO: o mesmo tratamento passa a valer para QUALQUER step com
   campo de digitacao — o 0 (WhatsApp), o 1 (nome) e o "verificar".
   Os steps 2 e 3 (escolhas por botao, sem teclado) continuam
   centralizados e travados, como sempre foram.

   Ver `temCampoDeTexto` abaixo: e a unica coisa que decide.
   =================================================================== */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatarTelefone(valor) {
  const d = String(valor).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function telefoneValido(valor) {
  const d = String(valor).replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

function Progress({ step }) {
  return (
    <div className="flex justify-center gap-2 mb-5">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: s === step ? 28 : 8,
            /* v13: sem verde (so o botao de continuar e verde) */
            backgroundColor: s <= step ? "var(--text)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

/* ===================================================================
   FOLHA "DIGITAR VALOR" (v8)

   Mesma tecnica da folha "Lançar saída" (Saidas.jsx), que ja funciona
   no iPhone: a area da folha acompanha o espaco visivel ACIMA do
   teclado (visualViewport). A folha fica no fim dessa area, entao o
   campo e o botao sobem junto com o teclado e nunca ficam por baixo
   dele. Vive num portal, fora da tela do onboarding.
   =================================================================== */
function FolhaDigitarValor({ ano, valor, onMudar, finalizando, onFechar, onConfirmar }) {
  const areaRef = useRef(null);

  useEffect(() => {
    const area = areaRef.current;
    const vv = window.visualViewport;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const oh = htmlEl.style.overflow;
    const ob = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    // Sem isso, arrastar o dedo rolava a tela de tras
    const bloquear = (e) => e.preventDefault();
    document.addEventListener("touchmove", bloquear, { passive: false });

    const ajustar = () => {
      if (!area || !vv) return;
      area.style.top = `${vv.offsetTop}px`;
      area.style.height = `${vv.height}px`;
    };
    ajustar();
    vv?.addEventListener("resize", ajustar);
    vv?.addEventListener("scroll", ajustar);
    return () => {
      document.removeEventListener("touchmove", bloquear);
      htmlEl.style.overflow = oh;
      bodyEl.style.overflow = ob;
      vv?.removeEventListener("resize", ajustar);
      vv?.removeEventListener("scroll", ajustar);
    };
  }, []);

  const numero = Number(valor || 0);
  const podeConfirmar = numero > 0 && !finalizando;

  return createPortal(
    <>
      <style>{`
        @keyframes folhaValorSobe { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes folhaValorFundo { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .folha-valor { animation: none !important; } }
      `}</style>

      <div
        className="fixed inset-0"
        style={{ zIndex: 80, background: "rgba(0,0,0,0.55)", animation: "folhaValorFundo 220ms ease-out" }}
        onClick={() => !finalizando && onFechar()}
      />

      <div
        ref={areaRef}
        className="fixed flex flex-col justify-end"
        style={{ zIndex: 81, left: 0, right: 0, top: 0, height: "100dvh", paddingTop: 24, pointerEvents: "none" }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Digitar o valor faturado"
          className="folha-valor w-full mx-auto flex flex-col rounded-t-3xl"
          style={{
            pointerEvents: "auto",
            maxWidth: 480,
            maxHeight: "100%",
            backgroundColor: "var(--bg)",
            border: "1px solid var(--card-borda)",
            borderBottom: "none",
            animation: "folhaValorSobe 280ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          {/* titulo + fechar */}
          <div className="shrink-0 flex items-center justify-between" style={{ padding: "16px 18px 6px" }}>
            <p className="font-bold" style={{ fontSize: 18, color: "var(--text)" }}>
              Faturado em {ano}
            </p>
            <button
              onClick={onFechar}
              disabled={finalizando}
              aria-label="Fechar"
              className="rounded-full flex items-center justify-center"
              style={{ width: 32, height: 32, border: "1px solid var(--border)" }}
            >
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* campo */}
          <div className="shrink-0" style={{ padding: "8px 18px 14px" }}>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              aria-label="Valor faturado no ano"
              placeholder="R$ 0"
              value={numero ? `R$ ${numero.toLocaleString("pt-BR")}` : ""}
              onChange={(e) =>
                onMudar(
                  e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITOS_ESTIMADO),
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && podeConfirmar) onConfirmar();
              }}
              className="campo-tacerto w-full rounded-2xl font-bold focus:outline-none placeholder:opacity-50"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: 22,
                padding: "12px 14px",
              }}
            />
          </div>

          {/* rodape: o botao nunca some atras do teclado */}
          <div
            className="shrink-0"
            style={{
              padding: "12px 18px",
              paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={onConfirmar}
              disabled={!podeConfirmar}
              className="botao-confirmar w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-40"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
                fontSize: 16,
                lineHeight: "22px",
              }}
            >
              Começar a usar
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default function Onboarding() {
  useTemaEscuroForcado();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const origemGoogle = searchParams.get("origem") === "google";

  const [step, setStep] = useState(origemGoogle ? 0 : 1);
  const [erro, setErro] = useState("");

  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  /* v7: o piloto e de MEI Caminhoneiros — ja vem marcado */
  const [tipoMei, setTipoMei] = useState("MEI_CAMINHONEIRO");
  const [meiEsseAno, setMeiEsseAno] = useState(null);
  const [mesMei, setMesMei] = useState("");
  const [seletorMes, setSeletorMes] = useState(false);
  /* v7: step 4 (faturamento estimado) */
  const [faixaFat, setFaixaFat] = useState(null);
  const [valorDigitado, setValorDigitado] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  /* v8: folha do "Digitar valor" (fica acima do teclado) */
  const [folhaValor, setFolhaValor] = useState(false);

  const { lancamentos, adicionarLancamento, setModoSimulacao } = useAppState();

  const inputCodigoRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const anteriores = [];
    ["font-small", "font-large"].forEach((c) => {
      if (root.classList.contains(c)) {
        anteriores.push(c);
        root.classList.remove(c);
      }
    });
    root.classList.add("font-medium");
    return () => {
      root.classList.remove("font-medium");
      anteriores.forEach((c) => root.classList.add(c));
    };
  }, []);

  /* v9: quem entra pelo WhatsApp pode ja ter nome no perfil (conta
     antiga que nao terminou o onboarding). Se tiver, o campo ja vem
     preenchido e a pessoa so confirma. Le do BANCO, e nao do estado do
     aparelho, para nao puxar o nome de outra conta usada antes no mesmo
     celular. So preenche se o campo ainda estiver vazio. */
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) return;
        const { data: perfil } = await supabase
          .from("perfis")
          .select("nome, onboarding_ok")
          .eq("id", data.user.id)
          .single();
        /* v10: onboarding ja feito (ex.: voltou do Inicio pelo gesto do
           iPhone) -> volta para o Inicio, sem refazer o cadastro */
        if (ativo && perfil?.onboarding_ok === true) {
          saindoRef.current = true;
          navigate("/dashboard", { replace: true });
          return;
        }
        const salvo = String(perfil?.nome || "").trim();
        // Ignora o que nao parece nome (e-mail ou numero de telefone)
        if (!ativo || !salvo || salvo.includes("@") || /^[\d\s()+-]+$/.test(salvo)) return;
        setNome((atual) => atual || salvo.slice(0, LIMITE_NOME_INPUT));
      } catch { /* visitante ou sem internet: campo fica vazio */ }
    })();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (step === "verificar" && inputCodigoRef.current) {
      setTimeout(() => inputCodigoRef.current?.focus(), 100);
    }
  }, [step]);

  const anoAtual = new Date().getFullYear();
  const tipoCanonico = tipoMei === "MEI_CAMINHONEIRO" ? "MEI_CAMINHONEIRO" : "MEI";
  const limiteCheio = LIMITES_ANUAIS[tipoCanonico];
  const limiteFinal =
    meiEsseAno && mesMei
      ? limiteProporcional(tipoCanonico, parseInt(mesMei), anoAtual, anoAtual)
      : limiteCheio;

  /* v7: valor que o step 4 vai gravar (0 = nada escolhido ainda) */
  const valorEstimado =
    faixaFat === FAIXA_DIGITAR
      ? Number(valorDigitado || 0)
      : FAIXAS_FATURAMENTO.find((f) => f.id === faixaFat)?.valor || 0;

  const progressStep =
    step === 4
      ? faixaFat && valorEstimado > 0 ? 4 : 3
      : step === 3
      ? meiEsseAno === false || (meiEsseAno === true && mesMei) ? 3 : 2
      : step === 0 || step === "verificar" ? 1 : step;

  const fieldStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "var(--text)",
  };

  const btnPrincipal = {
    backgroundColor: "transparent",
    border: "1.5px solid var(--primary)",
    color: "var(--primary)",
    width: 232,
    height: 52,
  };
  const btnPrincipalClasse =
    "btn-pill-tacerto mx-auto flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] disabled:opacity-35";

  /* v13 (pedido do Fernando): opcao escolhida SEM verde e sem fundo
     cinza — so fica mais "acesa" (borda e texto mais claros). Fundo
     preto em todas. Verde so no botao de continuar. */
  function estiloCard(selecionado, algoSelecionado) {
    const claro = !algoSelecionado || selecionado;
    return {
      backgroundColor: "transparent",
      border: selecionado
        ? "1px solid rgba(255,255,255,0.62)"
        : "1px solid rgba(255,255,255,0.18)",
      opacity: claro ? 1 : 0.5,
      transition:
        "background-color 180ms ease, border-color 180ms ease, opacity 180ms ease",
    };
  }

  async function salvarWhatsapp(userId) {
    const digitos = telefone.replace(/\D/g, "");
    if (!digitos || !userId) return;
    try {
      await supabase
        .from("perfis")
        .update({ whatsapp: `+55${digitos}` })
        .eq("id", userId);
    } catch { /* coluna ainda nao criada ou falha de rede */ }
  }

  function conferirCodigo() {
    setErro("");
    if (codigo.replace(/\D/g, "").length < 4) {
      return setErro("Digite o código que enviamos.");
    }
    setCodigo("");
    setStep(1);
  }

  /* v7: `estimado` = faturamento do ano informado no step 4 (0 = "Nao
     sei agora"). Vira um lancamento normal — ver o topo do arquivo. */
  async function handleFinalizar(estimado = 0) {
    if (finalizando) return;
    setFinalizando(true);
    salvarPerfilLocal({
      nome,
      perfil: tipoCanonico.toLowerCase(),
      limite: limiteFinal,
    });
    setUserState({
      nome,
      tipo: tipoCanonico,
      mesAbertura: meiEsseAno && mesMei ? parseInt(mesMei) : null,
      anoAbertura: meiEsseAno && mesMei ? anoAtual : null,
    });
    const jaTemEstimado = lancamentos.some((l) => l.descricao === DESCRICAO_ESTIMADO);
    if (estimado > 0 && !jaTemEstimado) {
      // Igual ao "+": sai do modo simulacao para o velocimetro somar os lancamentos
      setModoSimulacao(false);
      adicionarLancamento({
        descricao: DESCRICAO_ESTIMADO,
        valor: estimado,
        data: new Date().toISOString(),
      });
    }
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await salvarWhatsapp(data.user.id);
        await supabase.from("perfis").update({
          nome,
          tipo_mei: tipoCanonico,
          onboarding_ok: true,
          mes_abertura: meiEsseAno && mesMei ? parseInt(mesMei) : null,
          ano_abertura: meiEsseAno && mesMei ? anoAtual : null,
          atualizado_em: new Date().toISOString(),
        }).eq("id", data.user.id);
      }
    } catch { /* visitante */ }
    /* v10: troca a marca do historico pelo Inicio (ver "GESTO DE VOLTAR") */
    saindoRef.current = true;
    navigate("/dashboard", { replace: true });
  }

  function handleBack() {
    if (step === "verificar") { setErro(""); setStep(0); }
    else if (step === 1 && origemGoogle) { setErro(""); setStep(0); }
    else if (step > 1) setStep(step - 1);
    else sairDoOnboarding();
  }

  /* ===================================================================
     v10 (05/10/2026) — GESTO DE VOLTAR DO SAFARI

     O BUG: as etapas do onboarding sao uma pagina so. O "arrastar da
     borda" do iPhone e o VOLTAR do navegador, entao ele saia do
     onboarding inteiro e caia na pagina anterior do historico — as
     vezes o Inicio, com o cadastro pela metade.

     A CORRECAO: ao abrir, o onboarding coloca uma "marca" no historico
     (mesmo endereco). O gesto de voltar so tira a marca; a tela percebe
     (popstate), volta UMA ETAPA (ou fecha a folha do valor) e poe a
     marca de novo. Na primeira etapa o gesto nao faz nada. A marca
     tambem apaga o "avancar" do historico, entao o gesto para a frente
     nao leva ao Inicio. A setinha da primeira etapa leva para as
     boas-vindas (sairDoOnboarding).
     =================================================================== */
  const saindoRef = useRef(false);
  const voltarPeloGestoRef = useRef(null);
  voltarPeloGestoRef.current = () => {
    if (folhaValor) { setFolhaValor(false); return; }
    if (step === "verificar") { setErro(""); setStep(0); }
    else if (step === 1 && origemGoogle) { setErro(""); setStep(0); }
    else if (typeof step === "number" && step > 1) setStep(step - 1);
    // primeira etapa: fica aqui
  };

  useEffect(() => {
    const marcar = () =>
      window.history.pushState({ ...(window.history.state || {}), marcaOnboarding: true }, "");
    if (!window.history.state?.marcaOnboarding) marcar();
    const aoVoltar = () => {
      if (saindoRef.current) return;
      voltarPeloGestoRef.current?.();
      marcar();
    };
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  /* Setinha da primeira etapa: volta para as boas-vindas ("/"). Nao usa
     o "voltar" do navegador: a pagina anterior podia ser o Inicio, e a
     pessoa entraria no app com o cadastro pela metade. */
  function sairDoOnboarding() {
    saindoRef.current = true;
    navigate("/", { replace: true });
  }

  const isVerificar = step === "verificar";

  /* ⚠️ A LINHA QUE RESOLVE O BUG DO TECLADO.

     Steps com campo de digitacao precisam rolar E ancorar no topo,
     senao o teclado cobre o campo (ver o bloco no inicio do arquivo).
     Antes so o "verificar" tinha esse tratamento; agora o 0 (WhatsApp)
     e o 1 (nome) tambem.

     Os steps 2 e 3 sao escolhas por botao — nao abrem teclado, entao
     continuam centralizados e travados, como sempre. */
  /* v8: o step 4 NAO entra aqui — o "Digitar valor" abre uma folha
     propria (FolhaDigitarValor), que ja cuida do teclado. */
  const temCampoDeTexto = step === 0 || step === 1 || isVerificar;

  return (
    <div
      className="tela-fixa w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {isVerificar && (
        <input
          ref={inputCodigoRef}
          type="tel"
          inputMode="numeric"
          value={codigo}
          maxLength={6}
          onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6)); if (erro) setErro(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") conferirCodigo(); }}
          aria-label="Código de verificação"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            caretColor: "transparent",
          }}
        />
      )}

      <div className="px-4 pt-5 shrink-0 flex items-center">
        <button
          onClick={handleBack}
          aria-label="Voltar"
          className="w-[46px] h-[46px] flex items-center justify-center rounded-lg hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={26} strokeWidth={2} />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 flex flex-col px-6"
        style={{
          overflowY: temCampoDeTexto ? "auto" : "hidden",
          WebkitOverflowScrolling: "touch",
          /* Folga no fim para o teclado ter para onde empurrar. */
          paddingBottom: temCampoDeTexto ? 320 : 0,
        }}
      >
        <div
          className="max-w-sm w-full mx-auto flex-1 min-h-0 flex flex-col"
          style={{ justifyContent: temCampoDeTexto ? "flex-start" : "center" }}
        >
          <div className="flex justify-center mb-5 shrink-0" style={{ marginTop: temCampoDeTexto ? 24 : 0 }}>
            <Gauge size={48} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          {step !== 0 && step !== "verificar" && (
            <div className="shrink-0">
              <Progress step={progressStep} />
            </div>
          )}

          {/* ====== STEP 0: WHATSAPP ====== */}
          {step === 0 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Qual é o seu WhatsApp?
              </h1>

              <div className="flex items-stretch gap-2">
                <div
                  className="flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-[16px] shrink-0"
                  style={fieldStyle}
                >
                  <span aria-hidden style={{ fontSize: 16 }}>🇧🇷</span>
                  <span style={{ color: "var(--text-secondary)" }}>+55</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); if (erro) setErro(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && telefoneValido(telefone)) {
                      setErro("");
                      setStep("verificar");
                    }
                  }}
                  className="campo-tacerto flex-1 min-w-0 px-4 py-3.5 rounded-xl text-[16px] focus:outline-none placeholder:opacity-70"
                  style={fieldStyle}
                  autoFocus
                />
              </div>

              <div style={{ minHeight: 26 }} className="flex items-center justify-center mt-1">
                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "var(--danger)" }}>
                    {erro}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!telefoneValido(telefone)) {
                    return setErro("Digite um número de WhatsApp válido com DDD.");
                  }
                  setErro("");
                  setStep("verificar");
                }}
                disabled={!telefoneValido(telefone)}
                className={btnPrincipalClasse}
                style={btnPrincipal}
              >
                Continuar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* ====== STEP VERIFICAR: CODIGO ====== */}
          {step === "verificar" && (
            <div
              className="w-full shrink-0"
              style={{ paddingBottom: 48 }}
              onClick={() => inputCodigoRef.current?.focus()}
            >
              <h1
                className="text-2xl font-bold text-center mb-2"
                style={{ color: "var(--text)" }}
              >
                Confirme seu WhatsApp
              </h1>
              <p
                className="text-[15px] text-center mb-6 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Enviamos um código para{" "}
                <span style={{ color: "var(--text)", fontWeight: 600 }}>+55 {telefone}</span>
              </p>

              <div
                className="flex items-center justify-center gap-2"
                onClick={() => inputCodigoRef.current?.focus()}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const preenchido = codigo.length > i;
                  const atual = codigo.length === i;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: 46,
                        height: 56,
                        fontSize: 24,
                        fontWeight: 700,
                        color: "var(--text)",
                        backgroundColor: "transparent",
                        border: `1px solid ${
                          atual || preenchido
                            ? "rgba(255,255,255,0.62)"
                            : "rgba(255,255,255,0.18)"
                        }`,
                      }}
                    >
                      {codigo[i] || ""}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "var(--danger)" }}>
                    {erro}
                  </p>
                )}

                <button
                  onClick={conferirCodigo}
                  disabled={codigo.length < 4}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Validar código
                  <ArrowRight size={18} strokeWidth={2.4} />
                </button>

                <button
                  onClick={() => setErro("Reenvio disponível quando o envio de código for ativado.")}
                  className="w-full text-center text-[15px] pt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {/* ====== STEP 1: NOME ====== */}
          {step === 1 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Como posso te chamar?
              </h1>

              <input
                type="text"
                name="apelido-tacerto"
                placeholder="Digite seu nome ou apelido"
                value={nome}
                maxLength={LIMITE_NOME_INPUT}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck={false}
                onChange={(e) => { setNome(e.target.value); if (erro) setErro(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                    else { setErro(""); setStep(2); }
                  }
                }}
                className="campo-tacerto w-full px-4 py-3.5 rounded-xl text-[16px] placeholder:opacity-70"
                style={fieldStyle}
              />

              <div style={{ minHeight: 26 }} className="flex items-center justify-center">
                {erro && (
                  <p className="text-center text-[13px]" style={{ color: "var(--danger)" }}>
                    {erro}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!nome.trim()) setErro("Por favor, diga como podemos te chamar!");
                  else { setErro(""); setStep(2); }
                }}
                className={btnPrincipalClasse}
                style={btnPrincipal}
              >
                Continuar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* ====== STEP 2: TIPO MEI ====== */}
          {step === 2 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Qual é o seu MEI?
              </h1>

              <div className="space-y-2.5">
                {/* v7: Caminhoneiro primeiro (publico do piloto) */}
                {[
                  { v: "MEI_CAMINHONEIRO", Icon: Truck, titulo: "MEI Caminhoneiro",
                    limite: LIMITES_ANUAIS.MEI_CAMINHONEIRO },
                  { v: "MEI", Icon: Briefcase, titulo: "MEI (outras atividades)",
                    limite: LIMITES_ANUAIS.MEI },
                ].map((o) => {
                  const sel = tipoMei === o.v;
                  const Ico = o.Icon;
                  return (
                    <button
                      key={o.v}
                      onClick={() => setTipoMei(o.v)}
                      className="w-full flex items-center gap-3.5 rounded-2xl text-left"
                      style={{ ...estiloCard(sel, !!tipoMei), padding: "16px 16px" }}
                    >
                      <Ico
                        size={24}
                        strokeWidth={1.75}
                        className="shrink-0"
                        style={{ color: sel ? "var(--text)" : "var(--text-secondary)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold"
                          style={{ color: "var(--text)", fontSize: 16.5 }}
                        >
                          {o.titulo}
                        </div>
                        <div
                          className="text-[13.5px] mt-0.5 flex items-center gap-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Limite: <Valor tamanho="sm">{o.limite}</Valor>
                          <span style={{ color: "var(--text-secondary)" }}>/ ano</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setStep(3)}
                  disabled={!tipoMei}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Continuar
                  <ArrowRight size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}

          {/* ====== STEP 3: ABERTURA ====== */}
          {step === 3 && (
            <div className="shrink-0">
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)" }}
              >
                Você abriu seu MEI em {anoAtual}?
              </h1>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { v: true, Icon: CheckCircle2, l: "Sim, esse ano" },
                  { v: false, Icon: Clock, l: "Não, já faz tempo" },
                ].map((o) => {
                  const sel = meiEsseAno === o.v;
                  const Ico = o.Icon;
                  return (
                    <button
                      key={String(o.v)}
                      onClick={() => { setMeiEsseAno(o.v); if (!o.v) setMesMei(""); }}
                      className="rounded-2xl text-[15px] font-medium inline-flex items-center justify-center gap-2"
                      style={{
                        ...estiloCard(sel, meiEsseAno !== null),
                        color: "var(--text)",
                        padding: "14px 6px",
                      }}
                    >
                      <Ico
                        size={17}
                        strokeWidth={1.75}
                        style={{ color: sel ? "var(--text)" : "var(--text-secondary)" }}
                      />
                      {o.l}
                    </button>
                  );
                })}
              </div>

              <div style={{ minHeight: 96 }} className="pt-3">
                {meiEsseAno === true && (
                  <>
                    <p
                      className="text-[13.5px] font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Qual mês você abriu?
                    </p>
                    <button
                      onClick={() => setSeletorMes(true)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 rounded-2xl"
                      style={fieldStyle}
                    >
                      <div className="flex-1 min-w-0 text-left flex items-center gap-2">
                        <span
                          className="text-[16px] shrink-0"
                          style={{
                            fontWeight: mesMei ? 600 : 400,
                            color: mesMei ? "var(--text)" : "var(--text-secondary)",
                          }}
                        >
                          {mesMei ? MESES[parseInt(mesMei) - 1] : "Selecione o mês"}
                        </span>
                        {mesMei && (
                          <>
                            <span
                              className="shrink-0 text-sm"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              .
                            </span>
                            <span
                              className="min-w-0 flex items-center"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <Valor tamanho="sm">{limiteFinal}</Valor>
                            </span>
                          </>
                        )}
                      </div>
                      <CalendarDays size={18} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
                    </button>
                  </>
                )}

                {meiEsseAno === false && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    <p
                      className="text-[14px] font-medium inline-flex items-center gap-1.5"
                      style={{ color: "var(--text)" }}
                    >
                      <CheckCircle2
                        size={14}
                        strokeWidth={2}
                        style={{ color: "var(--text-secondary)" }}
                      />
                      Limite cheio: <Valor tamanho="sm">{limiteCheio}</Valor> / ano
                    </p>
                  </div>
                )}
              </div>

              {/* v7: segue para o faturamento estimado (step 4) */}
              <button
                onClick={() => setStep(4)}
                disabled={meiEsseAno === null || (meiEsseAno === true && !mesMei)}
                className={btnPrincipalClasse}
                style={btnPrincipal}
              >
                Continuar
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* ====== STEP 4: FATURAMENTO ESTIMADO (v7) ====== */}
          {step === 4 && (
            <div className="shrink-0">
              {/* v8: linhas equilibradas ("Quanto você já / faturou em
                  2026?") — sem isso o "2026?" ficava sozinho embaixo */}
              <h1
                className="text-2xl font-bold text-center mb-5"
                style={{ color: "var(--text)", textWrap: "balance" }}
              >
                Quanto você já faturou em{" "}{anoAtual}?
              </h1>

              {/* Mesmo padrao de escolha do step 3 (grade de 2).
                  v8: "Digitar valor" abre a folha; depois de digitado, o
                  quadrinho mostra o valor ("R$ 98.000"). */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ...FAIXAS_FATURAMENTO,
                  {
                    id: FAIXA_DIGITAR,
                    rotulo: valorDigitado
                      ? `R$ ${Number(valorDigitado).toLocaleString("pt-BR")}`
                      : "Digitar valor",
                  },
                ].map((f) => {
                  const sel = faixaFat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFaixaFat(f.id);
                        if (f.id === FAIXA_DIGITAR) setFolhaValor(true);
                      }}
                      className="py-3 px-2 rounded-2xl text-[15px] font-medium inline-flex items-center justify-center text-center"
                      style={{
                        ...estiloCard(sel, faixaFat !== null),
                        color: "var(--text)",
                        minHeight: 52,
                      }}
                    >
                      {f.rotulo}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleFinalizar(valorEstimado)}
                  disabled={finalizando || valorEstimado <= 0}
                  className={btnPrincipalClasse}
                  style={btnPrincipal}
                >
                  Começar a usar
                  <ArrowRight size={18} strokeWidth={2.4} />
                </button>

                <button
                  onClick={() => handleFinalizar(0)}
                  disabled={finalizando}
                  className="w-full text-center text-[15px] pt-4 disabled:opacity-40"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Não sei agora
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* v8: folha do "Digitar valor" — fica acima do teclado */}
      {folhaValor && (
        <FolhaDigitarValor
          ano={anoAtual}
          valor={valorDigitado}
          onMudar={setValorDigitado}
          finalizando={finalizando}
          onFechar={() => {
            setFolhaValor(false);
            // Fechou sem digitar nada: desmarca o quadrinho
            if (!valorDigitado) setFaixaFat(null);
          }}
          onConfirmar={() => handleFinalizar(Number(valorDigitado || 0))}
        />
      )}

      <SeletorMesAno
        aberto={seletorMes}
        titulo="Mês de abertura"
        mes={mesMei ? parseInt(mesMei) : null}
        ano={anoAtual}
        comAno={false}
        onFechar={() => setSeletorMes(false)}
        onSelecionar={(m) => { setMesMei(String(m)); setSeletorMes(false); }}
      />
    </div>
  );
}
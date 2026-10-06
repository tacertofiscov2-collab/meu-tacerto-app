/* ESCOLHERBANCO v3 — setinha de voltar maior (bolinha 46, seta 24; sem bolinha, seta 26) (v2: "Escolha seu banco", textos de entradas e gastos, X da folha sem cobrir o campo) */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, X, Gauge, ArrowLeftRight, ChevronRight, Loader2, Check,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import AuthError from "@/components/AuthError";
import SimboloPluggy from "@/components/SimboloPluggy";
import {
  listarBancos, listarConexoes, criarConexao, statusConexao,
} from "@/lib/openfinance";

/* ===================================================================
   ESCOLHERBANCO — /conectar-banco/escolher (caminho B, 24/09/2026)

   A pessoa chega aqui pelo botao "Conectar banco" da tela "Conexao
   bancaria". Tudo nosso, sem a janela (widget) da Pluggy.

   v2: o TaCerto deixou de ser so educativo fiscal e virou app de
   GESTAO do MEI, sem complexidade: ENTRADAS E GASTOS, sempre. Por isso
   o titulo virou "Escolha seu banco" (antes "Onde voce recebe?") e os
   textos falam de receber E pagar. ⚠️ A funcao `pluggy` ainda busca
   so as entradas — os gastos entram com o modulo de despesas.

   A TELA
     - chave no topo: Conta pessoal (CPF) | Conta da empresa (CNPJ)
     - busca
     - "Mais usados" (e o banco de teste, no sandbox) + "Outros bancos"
       em ordem alfabetica
     - banco ja conectado aparece marcado e nao abre de novo (conexao
       repetida ocupa vaga paga na Pluggy)

   A FOLHA "CONECTAR CONTA" (abre ao tocar num banco)
     - TaCerto <-> logo do banco
     - campo do CPF/CNPJ com mascara e conferencia dos digitos
     - o que a pessoa esta autorizando: o que o TaCerto ve, por quanto
       tempo e quem faz a conexao (regra do Open Finance + LGPD: tem
       que estar claro ANTES de ir ao banco — pesquisa de 24/09)
     - aviso dos "tres lugares": nossa tela -> banco -> Pluggy
     - junto do botao: "ao continuar, voce concorda com os Termos..."
       (sem a janela da Pluggy, esse aceite passou a ser nosso)

   O CPF/CNPJ vai direto para a Pluggy (o Open Finance exige). NAO e
   guardado, nem aqui, nem no navegador, nem em log.

   CONTINUAR PARA O BANCO
     1. criarConexao  -> a Pluggy cria a conexao e devolve o itemId
     2. statusConexao -> repete a cada 2,5 s ate o link do banco ficar
                         pronto (costuma levar poucos segundos)
     3. vai para o banco NA MESMA ABA (window.location.href).
        Por que nao abrir outra aba: o Safari do iPhone bloqueia
        janela nova que nao nasce direto do toque, e aqui o link so
        chega depois de chamadas ao servidor. Na volta, o banco devolve
        para /conectar-banco/retorno?itemId=..., que retoma tudo sozinha
        pelo itemId do endereco.

   TECLADO NO IPHONE
     A folha vive numa area que acompanha o espaco visivel acima do
     teclado (mesma tecnica da caixinha do Fisco no Dashboard). O botao
     fica sempre no rodape da folha, visivel; o miolo rola por dentro.

   PENDENCIAS CONHECIDAS
     - Conexao criada que a pessoa abandona (fecha a folha ou nao volta
       do banco) fica parada na Pluggy. No sandbox some em 30 dias.
       Perguntar a Pluggy se conexao nao concluida conta como vaga.
     - CNPJ alfanumerico (novos CNPJs a partir de jul/2026): hoje o
       campo aceita so numeros, como a funcao `pluggy` e o
       criarConexao. Ajustar os tres juntos quando for a hora.
   =================================================================== */

/* "Mais usados", na ordem em que aparecem. A comparacao e feita sem
   acento e em minusculas (ver normalizar). */
const MAIS_USADOS = [
  /\bnubank\b/,
  /\bitau\b/,
  /\bcaixa\b/,
  /\bbanco do brasil\b/,
  /\bbradesco\b/,
  /\bsantander\b/,
  /\binter\b/,
  /\bc6\b/,
  /\bmercado pago\b/,
  /\bpicpay\b/,
  /\bsicoob\b/,
  /\bsicredi\b/,
];

/* De quanto em quanto tempo pergunta se o link do banco ficou pronto,
   e quanto tempo espera no maximo antes de desistir. */
const INTERVALO_STATUS_MS = 2500;
const TEMPO_MAX_LINK_MS = 60000;

/* Pagina da Pluggy com os Termos de uso e a Politica de privacidade. */
const LINK_PLUGGY_LEGAL = "https://www.pluggy.ai/legal";

/* ---------------------------- ajudantes ---------------------------- */

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function posicaoMaisUsado(nome) {
  const n = normalizar(nome);
  return MAIS_USADOS.findIndex((re) => re.test(n));
}

function porNome(a, b) {
  return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", {
    sensitivity: "base",
  });
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* CPF: 11 digitos + os dois digitos verificadores certos. */
function cpfValido(d) {
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return (
    digito(d.slice(0, 9), 10) === Number(d[9]) &&
    digito(d.slice(0, 10), 11) === Number(d[10])
  );
}

/* CNPJ: 14 digitos + os dois digitos verificadores certos. */
function cnpjValido(d) {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const digito = (base) => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return (
    digito(d.slice(0, 12)) === Number(d[12]) &&
    digito(d.slice(0, 13)) === Number(d[13])
  );
}

function formatarCpf(d) {
  let s = d.slice(0, 3);
  if (d.length > 3) s += "." + d.slice(3, 6);
  if (d.length > 6) s += "." + d.slice(6, 9);
  if (d.length > 9) s += "-" + d.slice(9, 11);
  return s;
}

function formatarCnpj(d) {
  let s = d.slice(0, 2);
  if (d.length > 2) s += "." + d.slice(2, 5);
  if (d.length > 5) s += "." + d.slice(5, 8);
  if (d.length > 8) s += "/" + d.slice(8, 12);
  if (d.length > 12) s += "-" + d.slice(12, 14);
  return s;
}

/* ============================== TELA ============================== */

export default function EscolherBanco() {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("PF"); // PF = conta pessoal, PJ = empresa
  const [busca, setBusca] = useState("");
  const [buscaFocada, setBuscaFocada] = useState(false);

  const [bancos, setBancos] = useState([]);
  const [conectados, setConectados] = useState([]); // nomes normalizados
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const [escolhido, setEscolhido] = useState(null);

  /* Lista de bancos + quais ja estao conectados. */
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErroLista("");
    (async () => {
      try {
        const lista = await listarBancos();
        if (!ativo) return;
        setBancos(lista);

        // Marca "Conectado" nos bancos que a pessoa ja tem. Se falhar,
        // a tela funciona igual, so sem a marca.
        try {
          const { data } = await supabase.auth.getUser();
          const user = data?.user;
          if (user) {
            const conexoes = await listarConexoes(user.id);
            if (ativo) setConectados(conexoes.map((c) => normalizar(c.instituicao)));
          }
        } catch {
          /* sem a marca de conectado */
        }
      } catch {
        if (ativo) setErroLista("Não foi possível carregar os bancos agora.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [tentativa]);

  const doTipo = useMemo(() => bancos.filter((b) => b.tipo === tipo), [bancos, tipo]);

  const { maisUsados, outros } = useMemo(() => {
    const mais = [];
    const resto = [];
    for (const b of doTipo) {
      if (b.sandbox || posicaoMaisUsado(b.nome) >= 0) mais.push(b);
      else resto.push(b);
    }
    mais.sort((a, b) => {
      // no sandbox, o banco de teste vem primeiro
      if (Boolean(a.sandbox) !== Boolean(b.sandbox)) return a.sandbox ? -1 : 1;
      const pa = posicaoMaisUsado(a.nome);
      const pb = posicaoMaisUsado(b.nome);
      if (pa !== pb) return pa - pb;
      return porNome(a, b);
    });
    resto.sort(porNome);
    return { maisUsados: mais, outros: resto };
  }, [doTipo]);

  const termo = normalizar(busca);
  const resultados = useMemo(() => {
    if (!termo) return [];
    return doTipo.filter((b) => normalizar(b.nome).includes(termo)).sort(porNome);
  }, [doTipo, termo]);

  function escolher(banco) {
    if (banco.online === false) return;
    if (conectados.includes(normalizar(banco.nome))) {
      toast("Esse banco já está conectado", {
        description: "Para trocar, desconecte na tela Conexão bancária.",
      });
      return;
    }
    setEscolhido(banco);
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("/conectar-banco", { replace: true })}
          aria-label="Voltar"
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={24} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Escolha seu banco
        </h1>
      </header>

      {/* Chave e busca ficam paradas no topo; so a lista rola */}
      <div className="px-5 pb-3 shrink-0">
        <div className="max-w-sm w-full mx-auto">
          <p
            className="text-[13.5px] leading-relaxed mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            O banco que você usa no seu MEI, para receber dos clientes e pagar
            os gastos.
          </p>

          <ChaveTipo tipo={tipo} onTrocar={setTipo} />

          <div
            className="flex items-center gap-2 rounded-2xl px-3.5"
            style={{
              height: 46,
              backgroundColor: "var(--surface)",
              border: `1px solid ${buscaFocada ? "var(--primary)" : "var(--border)"}`,
              transition: "border-color 150ms",
            }}
          >
            <Search size={17} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setBuscaFocada(true)}
              onBlur={() => setBuscaFocada(false)}
              placeholder="Buscar banco"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent outline-none"
              // 16px ou mais: abaixo disso o iPhone da zoom ao tocar no campo
              style={{ color: "var(--text)", fontSize: 16, border: "none" }}
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="shrink-0 rounded-full flex items-center justify-center"
                style={{ width: 26, height: 26 }}
              >
                <X size={16} style={{ color: "var(--text-tertiary)" }} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-sm w-full mx-auto pt-2">
          {carregando ? (
            <div className="flex flex-col items-center gap-3" style={{ paddingTop: 48 }}>
              <Loader2 size={22} className="animate-spin" style={{ color: "var(--primary)" }} />
              <p className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
                Carregando bancos...
              </p>
            </div>
          ) : erroLista ? (
            <div className="text-center" style={{ paddingTop: 40 }}>
              <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
                {erroLista}
              </p>
              <button
                onClick={() => setTentativa((t) => t + 1)}
                className="mt-4 rounded-2xl px-5 py-2.5 font-semibold text-[14px] transition active:scale-[0.98]"
                style={{ border: "1px solid var(--border)", color: "var(--text)" }}
              >
                Tentar de novo
              </button>
            </div>
          ) : termo ? (
            resultados.length ? (
              <ListaBancos
                titulo="Resultados"
                bancos={resultados}
                conectados={conectados}
                onEscolher={escolher}
              />
            ) : (
              <div className="text-center" style={{ paddingTop: 32 }}>
                <p className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                  Nenhum banco encontrado
                </p>
                <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  Confira o nome ou troque para{" "}
                  {tipo === "PF" ? "Conta da empresa" : "Conta pessoal"}.
                </p>
              </div>
            )
          ) : (
            <>
              {maisUsados.length > 0 && (
                <ListaBancos
                  titulo="Mais usados"
                  bancos={maisUsados}
                  conectados={conectados}
                  onEscolher={escolher}
                />
              )}
              {outros.length > 0 && (
                <ListaBancos
                  titulo="Outros bancos"
                  bancos={outros}
                  conectados={conectados}
                  onEscolher={escolher}
                />
              )}
            </>
          )}
        </div>
      </div>

      {escolhido && (
        <FolhaConectarConta
          key={escolhido.id}
          banco={escolhido}
          onFechar={() => setEscolhido(null)}
        />
      )}
    </div>
  );
}

/* ========================== PECAS DA TELA ========================== */

function ChaveTipo({ tipo, onTrocar }) {
  const opcoes = [
    { valor: "PF", titulo: "Conta pessoal", detalhe: "CPF" },
    { valor: "PJ", titulo: "Conta da empresa", detalhe: "CNPJ" },
  ];
  return (
    <div
      role="tablist"
      className="flex rounded-2xl p-1 mb-3"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {opcoes.map((o) => {
        const ativo = tipo === o.valor;
        return (
          <button
            key={o.valor}
            role="tab"
            aria-selected={ativo}
            onClick={() => onTrocar(o.valor)}
            className="flex-1 rounded-xl transition"
            style={{
              paddingTop: 7,
              paddingBottom: 7,
              backgroundColor: ativo ? "var(--primary)" : "transparent",
              color: ativo ? "var(--primary-contrast)" : "var(--text-secondary)",
            }}
          >
            <span className="block text-[13.5px] font-semibold leading-tight">{o.titulo}</span>
            <span className="block text-[11px] leading-tight" style={{ opacity: 0.75 }}>
              {o.detalhe}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ListaBancos({ titulo, bancos, conectados, onEscolher }) {
  return (
    <div className="mb-5">
      <p
        className="text-[12px] font-semibold uppercase tracking-wide mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        {titulo}
      </p>
      <div className="card-tacerto rounded-2xl overflow-hidden">
        {bancos.map((b, i) => (
          <LinhaBanco
            key={b.id}
            banco={b}
            primeira={i === 0}
            conectado={conectados.includes(normalizar(b.nome))}
            onEscolher={onEscolher}
          />
        ))}
      </div>
    </div>
  );
}

function LinhaBanco({ banco, primeira, conectado, onEscolher }) {
  const foraDoAr = banco.online === false;
  const detalhe = conectado
    ? "Conectado"
    : foraDoAr
    ? "Fora do ar agora"
    : banco.sandbox
    ? "Banco de teste"
    : "";

  return (
    <button
      onClick={() => onEscolher(banco)}
      disabled={foraDoAr}
      className="w-full flex items-center gap-3 px-4 text-left transition active:opacity-70 disabled:opacity-45"
      style={{
        minHeight: 60,
        paddingTop: 10,
        paddingBottom: 10,
        borderTop: primeira ? "none" : "1px solid var(--border)",
        backgroundColor: "transparent",
      }}
    >
      <LogoBanco banco={banco} tamanho={36} />
      <span className="flex-1 min-w-0">
        <span
          className="block text-[14.5px] font-semibold truncate"
          style={{ color: "var(--text)" }}
        >
          {banco.nome}
        </span>
        {detalhe && (
          <span
            className="block text-[12px]"
            style={{ color: conectado ? "var(--primary)" : "var(--text-tertiary)" }}
          >
            {detalhe}
          </span>
        )}
      </span>
      {!conectado && !foraDoAr && (
        <ChevronRight size={17} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
      )}
    </button>
  );
}

/* Logo oficial do banco (vem da Pluggy). Fundo branco porque muitos
   logos sao escuros e sumiriam no tema escuro. Se a imagem falhar,
   mostra a inicial do banco na cor dele. */
function LogoBanco({ banco, tamanho = 36 }) {
  const [falhou, setFalhou] = useState(false);
  const raio = Math.round(tamanho * 0.28);

  if (!banco.logo || falhou) {
    return (
      <span
        className="shrink-0 flex items-center justify-center font-bold"
        style={{
          width: tamanho,
          height: tamanho,
          borderRadius: raio,
          backgroundColor: banco.cor || "var(--surface)",
          color: "#fff",
          fontSize: Math.round(tamanho * 0.42),
        }}
      >
        {String(banco.nome || "?").trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className="shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: tamanho, height: tamanho, borderRadius: raio, backgroundColor: "#fff" }}
    >
      <img
        src={banco.logo}
        alt=""
        loading="lazy"
        onError={() => setFalhou(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </span>
  );
}

/* ====================== FOLHA "CONECTAR CONTA" ====================== */

function FolhaConectarConta({ banco, onFechar }) {
  const ehCpf = banco.documento !== "cnpj";
  const nomeDoc = ehCpf ? "CPF" : "CNPJ";
  const tamanhoDoc = ehCpf ? 11 : 14;

  const [digitos, setDigitos] = useState("");
  const [focado, setFocado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [fechando, setFechando] = useState(false);

  const areaRef = useRef(null);
  const rolagemRef = useRef(null);
  const inputRef = useRef(null);
  const canceladoRef = useRef(false);

  const completo = digitos.length === tamanhoDoc;
  const valido = completo && (ehCpf ? cpfValido(digitos) : cnpjValido(digitos));
  const mostrarInvalido = completo && !valido;
  const formatado = ehCpf ? formatarCpf(digitos) : formatarCnpj(digitos);

  function fechar() {
    if (fechando) return;
    canceladoRef.current = true; // para de acompanhar a conexao, se estava
    setFechando(true);
    setTimeout(onFechar, 200);
  }

  /* Se a folha sair da tela por qualquer motivo, para de acompanhar. */
  useEffect(() => () => { canceladoRef.current = true; }, []);

  /* A area da folha acompanha o espaco visivel acima do teclado, e a
     tela de tras nao rola enquanto a folha esta aberta. */
  useEffect(() => {
    const area = areaRef.current;
    const vv = window.visualViewport;

    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const overflowHtmlAntes = htmlEl.style.overflow;
    const overflowBodyAntes = bodyEl.style.overflow;
    htmlEl.style.overflow = "hidden";
    bodyEl.style.overflow = "hidden";

    const bloquearArrasto = (e) => {
      const miolo = rolagemRef.current;
      if (miolo && miolo.contains(e.target)) return; // o miolo da folha rola
      e.preventDefault();
    };
    document.addEventListener("touchmove", bloquearArrasto, { passive: false });

    const ajustar = () => {
      if (!area || !vv) return;
      area.style.top = `${vv.offsetTop}px`;
      area.style.height = `${vv.height}px`;
    };
    ajustar();
    vv?.addEventListener("resize", ajustar);
    vv?.addEventListener("scroll", ajustar);

    return () => {
      document.removeEventListener("touchmove", bloquearArrasto);
      htmlEl.style.overflow = overflowHtmlAntes;
      bodyEl.style.overflow = overflowBodyAntes;
      vv?.removeEventListener("resize", ajustar);
      vv?.removeEventListener("scroll", ajustar);
    };
  }, []);

  function aoFocar() {
    setFocado(true);
    // espera o teclado subir e traz o campo para o meio da folha
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 320);
  }

  async function continuar() {
    if (!valido || ocupado) return;
    inputRef.current?.blur();
    canceladoRef.current = false;
    setOcupado(true);
    setErro("");

    try {
      const itemId = await criarConexao(banco.id, digitos);

      const inicio = Date.now();
      while (Date.now() - inicio < TEMPO_MAX_LINK_MS) {
        if (canceladoRef.current) return;
        const s = await statusConexao(itemId);
        if (canceladoRef.current) return;

        if (s?.urlBanco) {
          // MESMA ABA de proposito — ver o comentario no topo do arquivo
          window.location.href = s.urlBanco;
          return;
        }
        if (s?.erro) throw new Error("recusado");

        await esperar(INTERVALO_STATUS_MS);
      }
      throw new Error("demorou");
    } catch (e) {
      if (canceladoRef.current) return;
      setErro(
        e?.message === "demorou"
          ? "O banco demorou para responder. Tente de novo em instantes."
          : "Não foi possível abrir o banco agora. Tente de novo em instantes.",
      );
      setOcupado(false);
    }
  }

  return createPortal(
    <>
      <style>{`
        @keyframes folhaConectarSobe {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes folhaConectarDesce {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
        @keyframes folhaConectarFundo {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .folha-conectar { animation: none !important; }
        }
      `}</style>

      {/* Fundo escuro: tocar fora fecha */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 80,
          background: "rgba(0,0,0,0.55)",
          opacity: fechando ? 0 : 1,
          transition: "opacity 200ms ease-out",
          animation: "folhaConectarFundo 220ms ease-out",
        }}
        onClick={fechar}
      />

      {/* Area = espaco visivel (acima do teclado). A folha fica no fim. */}
      <div
        ref={areaRef}
        className="fixed flex flex-col justify-end"
        style={{
          zIndex: 81,
          left: 0,
          right: 0,
          top: 0,
          height: "100dvh",
          paddingTop: 24,
          pointerEvents: "none",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Conectar conta ${banco.nome}`}
          className="folha-conectar w-full mx-auto flex flex-col rounded-t-3xl"
          style={{
            pointerEvents: "auto",
            maxWidth: 480,
            maxHeight: "100%",
            backgroundColor: "var(--bg)",
            border: "1px solid var(--card-borda)",
            borderBottom: "none",
            animation: fechando
              ? "folhaConectarDesce 200ms cubic-bezier(0.4,0,1,1) forwards"
              : "folhaConectarSobe 280ms cubic-bezier(0.22,0.61,0.36,1)",
          }}
        >
          {/* Alca + fechar. A faixa tem altura propria (50) para o X nao
              ficar por cima do conteudo quando o miolo rola. */}
          <div
            className="relative shrink-0 flex justify-center"
            style={{ height: 50, paddingTop: 10 }}
          >
            <span
              aria-hidden
              style={{ width: 38, height: 4, borderRadius: 99, backgroundColor: "var(--border)" }}
            />
            <button
              onClick={fechar}
              aria-label="Fechar"
              className="absolute rounded-full flex items-center justify-center"
              style={{
                top: 10,
                right: 14,
                width: 32,
                height: 32,
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
              }}
            >
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Miolo que rola */}
          <div
            ref={rolagemRef}
            className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5"
            style={{ overscrollBehavior: "contain", paddingBottom: 14 }}
          >
            {/* TaCerto <-> banco */}
            <div className="flex items-center justify-center gap-3" style={{ marginTop: 16 }}>
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <Gauge size={28} strokeWidth={2.2} style={{ color: "var(--primary)" }} />
              </span>
              <ArrowLeftRight size={18} style={{ color: "var(--text-tertiary)" }} />
              <LogoBanco banco={banco} tamanho={52} />
            </div>

            <h2
              className="text-center font-bold"
              style={{ fontSize: 19, marginTop: 14, color: "var(--text)" }}
            >
              Conectar conta
            </h2>
            <p
              className="text-center text-[13.5px]"
              style={{ color: "var(--text-secondary)", marginTop: 2 }}
            >
              {banco.nome}
            </p>

            {/* Campo do CPF/CNPJ */}
            <label
              htmlFor="documento-conta"
              className="block text-[13.5px] leading-snug"
              style={{ color: "var(--text)", marginTop: 20, marginBottom: 8 }}
            >
              Digite o {nomeDoc} da conta que você usa no seu MEI
            </label>
            <div
              className="flex items-center gap-2 rounded-2xl px-4"
              style={{
                height: 52,
                backgroundColor: "var(--surface)",
                border: `1px solid ${
                  mostrarInvalido ? "var(--danger)" : focado ? "var(--primary)" : "var(--border)"
                }`,
                transition: "border-color 150ms",
              }}
            >
              <input
                id="documento-conta"
                ref={inputRef}
                value={formatado}
                onChange={(e) => {
                  setErro("");
                  setDigitos(e.target.value.replace(/\D/g, "").slice(0, tamanhoDoc));
                }}
                onFocus={aoFocar}
                onBlur={() => setFocado(false)}
                inputMode="numeric"
                autoComplete="off"
                placeholder={ehCpf ? "000.000.000-00" : "00.000.000/0000-00"}
                disabled={ocupado}
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{
                  color: "var(--text)",
                  fontSize: 18,
                  letterSpacing: "0.02em",
                  border: "none",
                }}
              />
              {valido && (
                <Check size={18} className="shrink-0" style={{ color: "var(--primary)" }} />
              )}
            </div>
            {mostrarInvalido && (
              <p className="text-[12.5px]" style={{ color: "var(--danger)", marginTop: 6 }}>
                {nomeDoc} inválido. Confira os números.
              </p>
            )}
            <p
              className="text-[12px] leading-snug"
              style={{ color: "var(--text-tertiary)", marginTop: 6 }}
            >
              O {nomeDoc} vai direto para a conexão com o banco. O TaCerto não guarda
              esse número.
            </p>

            {/* O que a pessoa esta autorizando */}
            <div className="card-tacerto rounded-2xl p-4 space-y-3" style={{ marginTop: 18 }}>
              <LinhaConsentimento titulo="O que o TaCerto vai ver">
                As entradas e os gastos da sua conta, a partir de 1º de janeiro deste
                ano, para organizar seu faturamento e suas despesas. O banco pode pedir
                autorização para outros dados também, mas o TaCerto usa só as entradas
                e os gastos.
              </LinhaConsentimento>
              <LinhaConsentimento titulo="Por quanto tempo">
                Até você desconectar, aqui no app ou no app do seu banco.
              </LinhaConsentimento>
              <LinhaConsentimento
                titulo="Quem faz a conexão"
                icone={<SimboloPluggy altura={11} />}
              >
                A Pluggy, instituição autorizada pelo Banco Central.
              </LinhaConsentimento>
            </div>

            {/* Os tres lugares */}
            <p
              className="text-[12.5px] leading-relaxed text-center"
              style={{ color: "var(--text-secondary)", marginTop: 14 }}
            >
              Você vai autorizar no seu banco e confirmar com a Pluggy, nossa parceira
              regulada pelo Banco Central. Leva menos de 1 minuto.
            </p>

            {erro && (
              <div style={{ marginTop: 12 }}>
                <AuthError>{erro}</AuthError>
              </div>
            )}
          </div>

          {/* Rodape fixo da folha: o botao nunca some atras do teclado */}
          <div
            className="shrink-0 px-5"
            style={{
              paddingTop: 12,
              paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={continuar}
              disabled={!valido || ocupado}
              className="w-full py-3.5 rounded-2xl font-semibold transition active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-contrast)",
                fontSize: 16,
                lineHeight: "22px",
              }}
            >
              {ocupado && <Loader2 size={18} className="animate-spin" />}
              {ocupado ? "Abrindo o banco..." : "Continuar para o banco"}
            </button>
            <p
              className="text-center text-[11.5px] leading-snug"
              style={{ color: "var(--text-tertiary)", marginTop: 10 }}
            >
              Ao tocar em Continuar para o banco, você concorda com os{" "}
              <a
                href="/termos"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-secondary)", textDecoration: "underline" }}
              >
                Termos de uso do TaCerto
              </a>{" "}
              e com os{" "}
              <a
                href={LINK_PLUGGY_LEGAL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-secondary)", textDecoration: "underline" }}
              >
                Termos e a Política de privacidade da Pluggy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function LinhaConsentimento({ titulo, icone, children }) {
  return (
    <div>
      <p
        className="text-[12.5px] font-semibold flex items-center gap-1.5"
        style={{ color: "var(--text)" }}
      >
        {icone}
        {titulo}
      </p>
      <p
        className="text-[12.5px] leading-relaxed"
        style={{ color: "var(--text-secondary)", marginTop: 2 }}
      >
        {children}
      </p>
    </div>
  );
}
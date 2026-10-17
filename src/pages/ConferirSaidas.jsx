/* CONFERIRSAIDAS v3 — "Pode ser repetido": os gastos com o mesmo dia e valor de outro extrato vem num grupo so, primeiro (Sim, é repetido = nao conta; Não é repetido = viram as perguntas normais por fornecedor) (resposta 11 do Fernando) (v2: grava em partes de 100 ids (o "O resto é pessoal" com centenas de gastos falhava calado) (v1: conferencia dos GASTOS que vieram do extrato e ficaram em duvida: "É gasto do caminhão?" com a categoria (Diesel e Arla, Pedágio...) ou "Não, é pessoal"; uma pergunta por fornecedor, grava na hora e lembra para a proxima; "O resto é pessoal" encerra */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  categoriasSaida, chaveFornecedor, sugerirCategoriaSaida, ehRepetido, CATEGORIA_REPETIDO,
} from "@/lib/categorias";
import { PREFIXO_EXTRATO } from "@/lib/conciliacao";
import { nomeParaDescricao } from "@/lib/openfinance";

/* ===================================================================
   CONFERIR GASTOS — /conferir-saidas (10/10/2026, tarefa de 08-10)

   Vem depois da conferencia das entradas, quando a pessoa enviou um
   extrato. "Aparece so quando precisa": so pergunta o gasto em DUVIDA
   (do_negocio vazio). O que o app ja reconheceu (POSTO -> Diesel, SEM
   PARAR -> Pedagio...) ou que a pessoa ja respondeu para o mesmo
   fornecedor nao aparece aqui (src/lib/importarExtrato.js).

   - Uma pergunta por FORNECEDOR (chaveFornecedor: documento, nome ou a
     descricao sem numeros), com o total e quantas vezes.
   - Caminhoneiro: "É gasto do caminhão?"; MEI comum: "É gasto do
     trabalho?". Resposta = a categoria (vira "do negocio") ou "Não, é
     pessoal".
   - GRAVA NA HORA (saidas.do_negocio e saidas.categoria). Da proxima
     vez o mesmo fornecedor ja vem resolvido.
   - "O resto é pessoal": os que faltam viram pessoal (regra do
     produto: sem resposta = pessoal, nao entra no lucro nem no IR) e a
     conferencia acaba. Assim nao pergunta de novo.
   - Sem as colunas novas no banco ou sem nada em duvida: vai direto
     para o Inicio.
   - v3 POSSIVEL REPETIDO (resposta 11 do Fernando): o gasto que chegou
     com o mesmo dia e valor de outro extrato (categoria "repetido",
     src/lib/importarExtrato.js) vem num GRUPO SO, primeiro:
       Sim, é repetido -> do_negocio = false e categoria "repetido"
                          (nao conta; aparece em Gastos pessoais como
                          "repetido", para poder desfazer)
       Não é repetido  -> abre nas perguntas normais, por fornecedor,
                          com a categoria sugerida pela descricao
   =================================================================== */

function reais(v) {
  return "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function diaMes(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* Nome do fornecedor para mostrar: o nome do extrato ou a descricao
   sem codigos */
function nomeDoFornecedor(s) {
  if (s.recebedor_nome) return nomeParaDescricao(s.recebedor_nome);
  const limpa = String(s.descricao || "")
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, " ")
    .replace(/[0-9]{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return limpa ? nomeParaDescricao(limpa) : "Gasto";
}

/* v3: { abrirRepetidas, tipoMEI } — com abrirRepetidas, as marcadas
   "repetido" viram grupos normais por fornecedor (chave "rep:...", para
   nao misturar com os grupos que ja existem) */
function montarGrupos(saidas, { abrirRepetidas = false, tipoMEI } = {}) {
  const mapa = new Map();
  for (const s of saidas) {
    if (!abrirRepetidas && ehRepetido(s)) {
      if (!mapa.has("repetido")) mapa.set("repetido", { chave: "repetido", repetido: true, itens: [], categoria: CATEGORIA_REPETIDO });
      mapa.get("repetido").itens.push(s);
      continue;
    }
    const base = chaveFornecedor({ documento: s.recebedor_documento, nome: s.recebedor_nome, descricao: s.descricao });
    const chave = abrirRepetidas ? `rep:${base}` : base;
    const categoria = ehRepetido(s) ? sugerirCategoriaSaida(s.descricao, tipoMEI) || null : s.categoria || null;
    if (!mapa.has(chave)) mapa.set(chave, { chave, itens: [], categoria, aberto: abrirRepetidas });
    mapa.get(chave).itens.push(s);
  }
  return [...mapa.values()]
    .map((g) => {
      const datas = g.itens.map((s) => new Date(s.data)).sort((a, b) => a - b);
      return {
        ...g,
        nome: nomeDoFornecedor(g.itens[0]),
        total: g.itens.reduce((t, s) => t + (Number(s.valor) || 0), 0),
        primeira: datas[0],
        ultima: datas[datas.length - 1],
      };
    })
    // v3: o do "pode ser repetido" antes de tudo; depois os maiores (e
    // o que mais pesa no lucro)
    .sort((a, b) => (b.repetido ? 1 : 0) - (a.repetido ? 1 : 0) || b.total - a.total);
}

export default function ConferirSaidas() {
  const navigate = useNavigate();
  const { tipoMEI } = useAppState();
  const caminhoneiro = tipoMEI === "MEI_CAMINHONEIRO";
  const opcoes = useMemo(() => categoriasSaida(tipoMEI), [tipoMEI]);

  // carregando | pergunta | salvando | fim
  const [fase, setFase] = useState("carregando");
  const [userId, setUserId] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [doNegocio, setDoNegocio] = useState(0);
  const [listaAberta, setListaAberta] = useState(false);
  const [erro, setErro] = useState("");

  const sair = () => navigate("/dashboard", { replace: true });

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return sair();
        const ano = new Date().getFullYear();
        const { data: lista, error } = await supabase
          .from("saidas")
          .select("id, descricao, valor, data, recebedor_nome, recebedor_documento, categoria, do_negocio, pluggy_transaction_id")
          .eq("user_id", user.id)
          .is("do_negocio", null)
          .like("pluggy_transaction_id", `${PREFIXO_EXTRATO}%`)
          .gte("data", `${ano}-01-01T00:00:00-03:00`);
        if (!ativo) return;
        if (error || !lista?.length) return sair();
        setUserId(user.id);
        setGrupos(montarGrupos(lista, { tipoMEI }));
        setFase("pergunta");
      } catch {
        if (ativo) sair();
      }
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* v2: em partes de 100 ids (centenas de uma vez estouram o tamanho do
     endereco do pedido) */
  async function atualizarEmPartes(ids, patch) {
    for (let i = 0; i < ids.length; i += 100) {
      const { error } = await supabase
        .from("saidas")
        .update(patch)
        .in("id", ids.slice(i, i + 100))
        .eq("user_id", userId);
      if (error) throw error;
    }
  }

  async function gravarGrupo(g, { negocio, categoria }) {
    await atualizarEmPartes(g.itens.map((s) => s.id), { do_negocio: negocio, categoria: negocio ? categoria : g.categoria });
  }

  /* v3: "Não é repetido": o grupo vira as perguntas normais, por
     fornecedor, no mesmo lugar da fila (nada e gravado ainda) */
  function abrirRepetidas() {
    const atual = grupos[indice];
    const separados = montarGrupos(atual.itens, { abrirRepetidas: true, tipoMEI });
    setGrupos([...grupos.slice(0, indice), ...separados, ...grupos.slice(indice + 1)]);
    setListaAberta(false);
  }

  async function responder(resposta) {
    const g = grupos[indice];
    setErro("");
    try {
      await gravarGrupo(g, resposta);
    } catch {
      setErro("Não consegui guardar agora. Tente de novo.");
      return;
    }
    if (resposta.negocio) setDoNegocio((v) => v + g.total);
    setListaAberta(false);
    if (indice < grupos.length - 1) setIndice(indice + 1);
    else setFase("fim");
  }

  /* "O resto é pessoal": os que faltam viram pessoal e acaba */
  async function restoPessoal() {
    setFase("salvando");
    const resto = grupos.slice(indice);
    try {
      /* v3: os que a pessoa disse que nao sao repetidos levam a categoria
         sugerida (deixam de ser "repetido") */
      for (const g of resto.filter((x) => x.aberto)) {
        await atualizarEmPartes(g.itens.map((s) => s.id), { do_negocio: false, categoria: g.categoria });
      }
      await atualizarEmPartes(resto.filter((x) => !x.aberto).flatMap((g) => g.itens.map((s) => s.id)), { do_negocio: false });
    } catch { /* sem rede: ficam em branco (tambem = pessoal) */ }
    setFase("fim");
  }

  const g = grupos[indice];

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header className="px-5 pt-7 pb-3 shrink-0">
        <h1 className="font-bold text-center" style={{ color: "var(--text)", fontSize: 27 }}>
          Seus gastos
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0 }}
      >
        <div
          className="max-w-sm w-full mx-auto"
          style={fase === "pergunta" ? { paddingTop: 6 } : { marginTop: "auto", marginBottom: "auto", paddingTop: 12 }}
        >
          {(fase === "carregando" || fase === "salvando") && (
            <div className="flex justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          )}

          {fase === "pergunta" && g && (
            <div key={g.chave}>
              <p className="text-[13px] font-semibold text-center" style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
                {indice + 1} de {grupos.length}
              </p>
              <div className="rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "var(--border)" }}>
                <div style={{ height: "100%", width: `${((indice + 1) / grupos.length) * 100}%`, backgroundColor: "var(--primary)", transition: "width 300ms ease" }} />
              </div>

              {g.repetido ? (
                /* v3: o aviso do possivel repetido, com a lista */
                <div className="card-tacerto rounded-2xl" style={{ marginTop: 16, padding: "14px 16px" }}>
                  <p className="font-semibold uppercase" style={{ color: "var(--text-tertiary)", fontSize: 11, letterSpacing: "0.08em" }}>
                    Pode ser repetido
                  </p>
                  <p className="font-bold" style={{ fontSize: 17, color: "var(--text)", marginTop: 8 }}>
                    {g.itens.length === 1 ? "1 gasto igual ao de outro extrato" : `${g.itens.length} gastos iguais aos de outro extrato`}
                  </p>
                  <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 2 }}>Mesmo dia e mesmo valor</p>
                  <p className="font-bold" style={{ fontSize: 22, color: "var(--text)", marginTop: 8 }}>{reais(g.total)}</p>
                  <button
                    type="button"
                    onClick={() => setListaAberta((v) => !v)}
                    className="flex items-center gap-1"
                    style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 13 }}
                  >
                    {listaAberta ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {listaAberta ? "Esconder os gastos" : "Ver os gastos"}
                  </button>
                  {listaAberta && (
                    <div style={{ marginTop: 6 }}>
                      {g.itens.map((s) => (
                        <div key={s.id} className="flex items-baseline justify-between" style={{ gap: 10, paddingTop: 8, paddingBottom: 8, borderTop: "1px solid var(--border)" }}>
                          <span className="min-w-0 truncate" style={{ fontSize: 13, color: "var(--text)" }}>
                            {diaMes(s.data)} · {nomeDoFornecedor(s)}
                          </span>
                          <span className="shrink-0 font-semibold" style={{ fontSize: 13, color: "var(--text)" }}>{reais(s.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <div className="card-tacerto rounded-2xl" style={{ marginTop: 16, padding: "14px 16px" }}>
                <p className="font-bold" style={{ fontSize: 17, color: "var(--text)", overflowWrap: "anywhere" }}>{g.nome}</p>
                <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {g.itens.length === 1 ? `em ${diaMes(g.primeira)}` : `${g.itens.length} vezes · ${diaMes(g.primeira)} a ${diaMes(g.ultima)}`}
                </p>
                <p className="font-bold" style={{ fontSize: 22, color: "var(--text)", marginTop: 8 }}>{reais(g.total)}</p>
              </div>
              )}

              {g.repetido ? (
                <>
                  <p className="font-bold text-center" style={{ fontSize: 20, marginTop: 22 }}>É repetido?</p>
                  <div className="grid grid-cols-1" style={{ gap: 8, marginTop: 12 }}>
                    <BotaoOpcao rotulo="Sim, é repetido" sugerida aoTocar={() => responder({ negocio: false })} />
                    <BotaoOpcao rotulo="Não é repetido" seguir aoTocar={abrirRepetidas} />
                  </div>
                </>
              ) : (
              <>
              <p className="font-bold text-center" style={{ fontSize: 20, marginTop: 22 }}>
                {caminhoneiro ? "É gasto do caminhão?" : "É gasto do trabalho?"}
              </p>
              <div className="grid grid-cols-2" style={{ gap: 8, marginTop: 12 }}>
                {opcoes.map((o) => (
                  <BotaoOpcao
                    key={o.id}
                    rotulo={o.rotulo}
                    sugerida={g.categoria === o.id}
                    aoTocar={() => responder({ negocio: true, categoria: o.id })}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => responder({ negocio: false })}
                className="toque w-full rounded-2xl font-semibold"
                style={{ marginTop: 8, minHeight: 50, fontSize: 14.5, border: "1px solid var(--border)", background: "none", color: "var(--text)" }}
              >
                Não, é pessoal
              </button>
              </>
              )}

              {erro && (
                <p className="text-center" style={{ color: "var(--danger)", fontSize: 13.5, marginTop: 10 }}>{erro}</p>
              )}

              <button
                type="button"
                onClick={restoPessoal}
                className="w-full text-center"
                style={{ marginTop: 18, color: "var(--text-secondary)", fontSize: 14.5 }}
              >
                O resto é pessoal
              </button>
            </div>
          )}

          {fase === "fim" && (
            <div className="flex flex-col items-center text-center">
              <span className="flex items-center justify-center rounded-full" style={{ width: 76, height: 76, backgroundColor: "rgba(34,197,94,0.14)" }}>
                <Check size={38} strokeWidth={2.6} style={{ color: "var(--primary)" }} />
              </span>
              <h2 className="font-bold" style={{ fontSize: 22, marginTop: 20 }}>Pronto!</h2>
              {doNegocio > 0 && (
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                  {reais(doNegocio)} em gastos {caminhoneiro ? "do caminhão" : "do trabalho"}.
                </p>
              )}
              <button
                type="button"
                onClick={sair}
                className="botao-confirmar w-full py-3.5 rounded-2xl font-semibold"
                style={{ marginTop: 26, fontSize: 16 }}
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Categoria do gasto. Sugerida pela descricao = borda verde fina.
   v3: seguir = "Não é repetido" (setinha: abre as perguntas normais) */
function BotaoOpcao({ rotulo, sugerida, seguir = false, aoTocar }) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      className="toque rounded-2xl text-left font-semibold leading-snug flex items-center justify-between"
      style={{
        minHeight: 50,
        padding: "9px 12px",
        fontSize: 14.5,
        background: "none",
        color: "var(--text)",
        border: `1px solid ${sugerida ? "rgba(34,197,94,0.55)" : "var(--border)"}`,
      }}
    >
      {rotulo}
      {seguir && <ChevronRight size={17} strokeWidth={2.2} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />}
    </button>
  );
}

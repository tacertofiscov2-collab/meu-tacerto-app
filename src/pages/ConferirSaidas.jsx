/* CONFERIRSAIDAS v1 — conferencia dos GASTOS que vieram do extrato e ficaram em duvida: "É gasto do caminhão?" com a categoria (Diesel e Arla, Pedágio...) ou "Não, é pessoal"; uma pergunta por fornecedor, grava na hora e lembra para a proxima; "O resto é pessoal" encerra */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import { categoriasSaida, chaveFornecedor } from "@/lib/categorias";
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

function montarGrupos(saidas) {
  const mapa = new Map();
  for (const s of saidas) {
    const chave = chaveFornecedor({ documento: s.recebedor_documento, nome: s.recebedor_nome, descricao: s.descricao });
    if (!mapa.has(chave)) mapa.set(chave, { chave, itens: [], categoria: s.categoria || null });
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
    // Os maiores primeiro: e o que mais pesa no lucro
    .sort((a, b) => b.total - a.total);
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
        setGrupos(montarGrupos(lista));
        setFase("pergunta");
      } catch {
        if (ativo) sair();
      }
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function gravarGrupo(g, { negocio, categoria }) {
    const { error } = await supabase
      .from("saidas")
      .update({ do_negocio: negocio, categoria: negocio ? categoria : g.categoria })
      .in("id", g.itens.map((s) => s.id))
      .eq("user_id", userId);
    if (error) throw error;
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
    if (indice < grupos.length - 1) setIndice(indice + 1);
    else setFase("fim");
  }

  /* "O resto é pessoal": os que faltam viram pessoal e acaba */
  async function restoPessoal() {
    setFase("salvando");
    const resto = grupos.slice(indice);
    try {
      const ids = resto.flatMap((g) => g.itens.map((s) => s.id));
      await supabase.from("saidas").update({ do_negocio: false }).in("id", ids).eq("user_id", userId);
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

              <div className="card-tacerto rounded-2xl" style={{ marginTop: 16, padding: "14px 16px" }}>
                <p className="font-bold" style={{ fontSize: 17, color: "var(--text)", overflowWrap: "anywhere" }}>{g.nome}</p>
                <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 2 }}>
                  {g.itens.length === 1 ? `em ${diaMes(g.primeira)}` : `${g.itens.length} vezes · ${diaMes(g.primeira)} a ${diaMes(g.ultima)}`}
                </p>
                <p className="font-bold" style={{ fontSize: 22, color: "var(--text)", marginTop: 8 }}>{reais(g.total)}</p>
              </div>

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

/* Categoria do gasto. Sugerida pela descricao = borda verde fina. */
function BotaoOpcao({ rotulo, sugerida, aoTocar }) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      className="toque rounded-2xl text-left font-semibold leading-snug"
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
    </button>
  );
}

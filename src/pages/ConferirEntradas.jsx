/* CONFERIRENTRADAS v4 — titulo grande e centralizado + explicacao SO na primeira conferencia */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown, ChevronUp, ChevronLeft, Check, Loader2, AlertCircle, ArrowDownLeft, X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  organizarPelasRegras, salvarRegra, classificarGrupo, nomeParaDescricao,
} from "@/lib/openfinance";

/* ===================================================================
   CONFERIRENTRADAS — /conferir-entradas

   v4 (27/09/2026)
     - "Novas entradas" grande e centralizado (e o "1 de 7" tambem).
     - EXPLICACAO SO NA PRIMEIRA VEZ: antes da primeira pergunta, uma
       tela explica o que a pessoa vai responder e o jeito certo
       (Sim = pagamento de cliente pelo trabalho; Não = transferencia
       entre contas proprias, presente, emprestimo, reembolso).
       "Primeira vez" = a pessoa NUNCA teve entrada conferida (nenhuma
       entrada fora de "pendente"). Vem do banco de dados, entao vale
       em qualquer aparelho, sem coluna nova. Depois da primeira
       conferencia, a explicacao nao aparece mais.

   v3 (27/09/2026) — CARA DE COMPROVANTE
     O card do pagador virou um "comprovante": pagador com documento
     MASCARADO como os bancos fazem (CNPJ 12.345.•••/••01-90,
     CPF •••.654.321-••), picote no meio, e as linhas Entradas /
     Periodo / Meio / Total recebido. So aparece o que o banco mandou;
     o que faltar some sem deixar campo vazio.

   v2 (27/09/2026) — BASICO E MINIMALISTA (pedido do Fernando)
     - UMA pergunta por pagador: "É faturamento?"  [Sim] [Não]
     - sem tela de abertura e sem explicacao: abre direto na 1a pergunta
     - a pessoa NAO sai antes de terminar (sem seta de voltar, sem
       "deixar para depois"). O Dashboard manda para ca sempre que ha
       entrada nova esperando (o "portao" — ver DASHBOARD v15). So
       depois de confirmar tudo ela usa o app normalmente.
     - Sim -> todas as entradas do pagador viram faturamento e o Fisco
       aprende (da proxima vez, as entradas dele ja chegam organizadas)
     - Não -> ficam de fora e NAO vira regra: a mesma pessoa pode virar
       cliente depois, entao da proxima vez pergunta de novo. (Assim um
       "Não" por engano nunca esconde faturamento para sempre.)
     - WhatsApp: quando as confirmacoes tambem acontecerem por la, esta
       tela ja respeita — ela so pergunta o que ainda esta pendente no
       banco. (A integracao em si fica para depois.)

   AGRUPAMENTO (desde a v1)
     - com documento do pagador: pelo CPF/CNPJ (o mesmo pagador aparece
       como "TRANSPORTES ALMEIDA LTDA" e "TRANSP ALMEIDA")
     - sem documento (deposito, algumas TEDs): pela descricao do
       extrato, sem numeros ("TED RECEBIDA 001 AG 1234" -> "TED RECEBIDA")
     - ordem: POR DATA — o pagador da entrada mais antiga primeiro

   AS RESPOSTAS SO SAO GRAVADAS NO FIM
     Por isso o "Anterior" deixa trocar a resposta sem desfazer nada no
     banco. A gravacao usa classificarGrupo, que nunca duplica
     lancamento.

   Abre por: portao do Dashboard, faixa "X entradas esperando voce"
   (Lancar) e "Conferir agora" (tela de volta do banco).
   =================================================================== */

/* ---------------------------- ajudantes ---------------------------- */

function reais(v) {
  return (
    "R$ " +
    Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function diaMes(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* Documento mascarado, como nos comprovantes dos bancos:
   CNPJ 12.345.•••/••01-90  |  CPF •••.654.321-•• */
function mascararDocumento(doc) {
  const d = String(doc || "").replace(/\D/g, "");
  if (d.length === 14) return `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.•••/••${d.slice(10, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `CPF •••.${d.slice(3, 6)}.${d.slice(6, 9)}-••`;
  return "";
}

/* "PIX" -> "Pix", "DEPOSITO" -> "Depósito"... */
const NOMES_MEIO = {
  PIX: "Pix",
  TED: "TED",
  DOC: "DOC",
  BOLETO: "Boleto",
  DEPOSITO: "Depósito",
  TRANSFER: "Transferência",
  TRANSFERENCIA: "Transferência",
  CREDIT_CARD: "Cartão",
  DEBIT_CARD: "Cartão",
  CARTAO: "Cartão",
};

function nomeMeio(meio) {
  const chave = String(meio || "").toUpperCase().replace(/[^A-Z_]/g, "");
  if (!chave) return "";
  return NOMES_MEIO[chave] || chave.charAt(0) + chave.slice(1).toLowerCase();
}

function meiosDoGrupo(g) {
  return [...new Set(g.entradas.map((e) => nomeMeio(e.meio)).filter(Boolean))].join(" · ");
}

/* "05/03 a 02/09" ou "em 17/06" */
function periodoCurto(g) {
  const a = diaMes(g.primeira.toISOString());
  const b = diaMes(g.ultima.toISOString());
  return a === b ? `em ${a}` : `${a} a ${b}`;
}

/* Descricao do extrato sem numeros nem ruido, para agrupar quem nao
   tem documento: "TED RECEBIDA 001 AG 1234" -> "TED RECEBIDA". */
function chaveDescricao(desc) {
  return String(desc || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0-9]/g, " ")
    .replace(/[^A-Z ]/g, " ")
    .replace(/\b(AG|CC|CONTA|DOC|NR|N)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function montarGrupos(entradas) {
  const mapa = new Map();

  for (const e of entradas) {
    const doc = String(e.pagador_documento || "").replace(/\D/g, "");
    const chave = doc ? `doc:${doc}` : `desc:${chaveDescricao(e.descricao) || "SEM DESCRICAO"}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        documento: doc,
        tipoDoc: doc.length === 14 ? "CNPJ" : doc.length === 11 ? "CPF" : null,
        entradas: [],
      });
    }
    mapa.get(chave).entradas.push(e);
  }

  const grupos = [...mapa.values()].map((g) => {
    const total = g.entradas.reduce((s, e) => s + (Number(e.valor) || 0), 0);
    // o nome mais completo: "TRANSPORTES ALMEIDA LTDA" ganha de "TRANSP ALMEIDA"
    const nomes = g.entradas
      .map((e) => String(e.pagador_nome || "").trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const nome = nomes[0]
      ? nomeParaDescricao(nomes[0])
      : nomeParaDescricao(chaveDescricao(g.entradas[0].descricao) || "Recebimento");
    const datas = g.entradas.map((e) => new Date(e.data)).sort((a, b) => a - b);
    const entradasOrdenadas = [...g.entradas].sort((a, b) => new Date(a.data) - new Date(b.data));
    return {
      ...g,
      entradas: entradasOrdenadas,
      total,
      nome,
      primeira: datas[0],
      ultima: datas[datas.length - 1],
    };
  });

  // Por data: quem pagou primeiro no ano vem primeiro
  grupos.sort((a, b) => a.primeira - b.primeira);
  return grupos;
}

/* ============================== TELA ============================== */

export default function ConferirEntradas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adicionarLancamento } = useAppState();

  // Para onde vai no fim: a faixa de Lancar volta para Lancar; o resto,
  // Dashboard.
  const destinoFinal = location.state?.de === "lancar" ? "/lancar" : "/dashboard";

  // carregando | explicacao | pergunta | salvando | fim | erro
  const [fase, setFase] = useState("carregando");
  const [userId, setUserId] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState({}); // chave -> "sim" | "nao"
  const [listaAberta, setListaAberta] = useState(false);
  const [faturado, setFaturado] = useState(0);
  const [erro, setErro] = useState({ texto: "", tipo: "" }); // tipo: carregar | salvar

  // O que ja foi gravado entre uma tentativa e outra (nao repete)
  const salvosRef = useRef({});
  const faturadoRef = useRef(0);

  /* Organiza o que o Fisco ja sabe e agrupa o resto. Sem nada para
     conferir, segue direto (nao mostra tela nenhuma). */
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (ativo) setUserId(user.id);

        const { pendentes } = await organizarPelasRegras(user.id, {
          criarLancamento: adicionarLancamento,
        });
        if (!ativo) return;

        const g = montarGrupos(pendentes);
        if (!g.length) {
          navigate(destinoFinal, { replace: true });
          return;
        }
        // Primeira conferencia da vida? (nenhuma entrada ja conferida)
        let primeiraVez = false;
        try {
          const { count } = await supabase
            .from("entradas")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .neq("status", "pendente");
          primeiraVez = (count || 0) === 0;
        } catch {
          primeiraVez = false; // na duvida, nao atrapalha
        }
        if (!ativo) return;

        setGrupos(g);
        setFase(primeiraVez ? "explicacao" : "pergunta");
      } catch {
        if (ativo) {
          setErro({ texto: "Não foi possível carregar as entradas agora.", tipo: "carregar" });
          setFase("erro");
        }
      }
    })();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Grava as respostas ainda nao gravadas. Lanca erro se falhar — o
     que ja foi gravado fica marcado e nao repete. */
  async function gravar(resps) {
    for (const g of grupos) {
      const r = resps[g.chave];
      if (!r || salvosRef.current[g.chave]) continue;

      const sim = r === "sim";
      const res = await classificarGrupo(userId, g.entradas, sim ? "faturamento" : "ignorada", {
        criarLancamento: adicionarLancamento,
      });
      salvosRef.current[g.chave] = true;

      if (sim) {
        faturadoRef.current += res?.total || 0;
        // Sim vira regra (o Fisco aprende); Não, nao.
        if (g.documento) {
          try {
            await salvarRegra(userId, g.documento, g.nome, "faturamento");
          } catch {
            /* sem a regra, da proxima vez pergunta de novo — nao e grave */
          }
        }
      }
    }
  }

  async function finalizar(resps) {
    setFase("salvando");
    try {
      await gravar(resps);
      setFaturado(faturadoRef.current);
      setFase("fim");
    } catch {
      setErro({
        texto: "Não consegui guardar suas respostas agora. Elas continuam aqui.",
        tipo: "salvar",
      });
      setFase("erro");
    }
  }

  function responder(valor) {
    const g = grupos[indice];
    const novas = { ...respostas, [g.chave]: valor };
    setRespostas(novas);
    setListaAberta(false);
    if (indice < grupos.length - 1) {
      setIndice(indice + 1);
    } else {
      finalizar(novas);
    }
  }

  function anterior() {
    if (indice === 0) return;
    setIndice(indice - 1);
    setListaAberta(false);
  }

  const centralizado = fase !== "pergunta";
  const g = grupos[indice];

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <style>{`
        @keyframes conferirEntra {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .conferir-entra { animation: conferirEntra 260ms cubic-bezier(0.22,0.61,0.36,1); }
        @media (prefers-reduced-motion: reduce) {
          .conferir-entra { animation: none; }
        }
      `}</style>

      {/* Sem seta de voltar de proposito: a pessoa confere antes de seguir */}
      <header className="px-5 pt-7 pb-3 shrink-0">
        <h1 className="font-bold text-center" style={{ color: "var(--text)", fontSize: 27 }}>
          Novas entradas
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        <div
          className="max-w-sm w-full mx-auto"
          style={{
            // Telas de aviso ficam no meio da altura; a pergunta, no topo
            marginTop: centralizado ? "auto" : 0,
            marginBottom: centralizado ? "auto" : 0,
            paddingTop: centralizado ? 12 : 6,
            flexShrink: 0,
          }}
        >
          {/* ------------------------- CARREGANDO ------------------------- */}
          {fase === "carregando" && (
            <div className="flex flex-col items-center text-center" style={{ gap: 12 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          )}

          {/* -------------------------- EXPLICACAO --------------------------
              So na primeira conferencia (ver topo do arquivo). */}
          {fase === "explicacao" && (
            <div className="conferir-entra flex flex-col items-center text-center">
              <Circulo>
                <ArrowDownLeft size={34} strokeWidth={2.4} style={{ color: "var(--primary)" }} />
              </Circulo>

              <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 18 }}>
                O Fisco encontrou dinheiro que entrou na sua conta. Para cada pagador,
                ele faz uma pergunta só:{" "}
                <strong style={{ color: "var(--text)" }}>é faturamento?</strong>
              </p>

              <div className="w-full text-left space-y-2.5" style={{ marginTop: 18 }}>
                <ExemploResposta
                  sim
                  titulo="Responda Sim"
                  texto="Quando é pagamento de cliente pelo seu trabalho: serviço, frete ou venda."
                />
                <ExemploResposta
                  titulo="Responda Não"
                  texto="Quando não vem do seu trabalho: transferência entre contas suas, presente, empréstimo ou reembolso."
                />
              </div>

              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-tertiary)", marginTop: 16 }}>
                Na dúvida, toque em <strong style={{ color: "var(--text-secondary)" }}>Ver as entradas</strong>{" "}
                para conferir cada valor e data. Cada Sim ensina o Fisco: da próxima vez, as
                entradas daquele pagador já entram sozinhas.
              </p>

              <BotaoLargo rotulo="Entendi, vamos lá" aoTocar={() => setFase("pergunta")} />
            </div>
          )}

          {/* --------------------------- PERGUNTA --------------------------- */}
          {fase === "pergunta" && g && (
            <div key={g.chave} className="conferir-entra">
              {/* progresso */}
              <p
                className="text-[13px] font-semibold text-center"
                style={{ color: "var(--text-secondary)", marginBottom: 8 }}
              >
                {indice + 1} de {grupos.length}
              </p>
              <div
                className="rounded-full overflow-hidden"
                style={{ height: 5, backgroundColor: "var(--border)" }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${((indice + 1) / grupos.length) * 100}%`,
                    backgroundColor: "var(--primary)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>

              {/* o pagador, com cara de comprovante (v3) */}
              <div className="card-tacerto rounded-2xl overflow-hidden" style={{ marginTop: 16 }}>
                {/* quem pagou */}
                <div style={{ padding: "14px 16px 12px" }}>
                  <p
                    className="font-semibold uppercase"
                    style={{ color: "var(--text-tertiary)", fontSize: 11, letterSpacing: "0.08em" }}
                  >
                    Pagador
                  </p>
                  <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
                    <span
                      className="rounded-full flex items-center justify-center shrink-0 font-bold"
                      style={{
                        width: 42,
                        height: 42,
                        fontSize: 17,
                        backgroundColor: "rgba(34,197,94,0.14)",
                        color: "var(--primary)",
                      }}
                    >
                      {g.nome.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ fontSize: 16.5, color: "var(--text)" }}>
                        {g.nome}
                      </p>
                      <p
                        className="text-[12.5px]"
                        style={{ color: "var(--text-tertiary)", marginTop: 1, letterSpacing: "0.02em" }}
                      >
                        {mascararDocumento(g.documento) || "Documento não informado pelo banco"}
                      </p>
                    </div>
                  </div>
                </div>

                <Picote />

                {/* detalhes */}
                <div style={{ padding: "10px 16px 14px" }}>
                  <LinhaDetalhe rotulo="Entradas" valor={String(g.entradas.length)} />
                  <LinhaDetalhe rotulo="Período" valor={periodoCurto(g)} />
                  {meiosDoGrupo(g) && <LinhaDetalhe rotulo="Meio" valor={meiosDoGrupo(g)} />}

                  <div
                    className="flex items-baseline justify-between"
                    style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)", gap: 10 }}
                  >
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      Total recebido
                    </span>
                    <span className="font-bold" style={{ fontSize: 22, color: "var(--primary)" }}>
                      {reais(g.total)}
                    </span>
                  </div>

                  <button
                    onClick={() => setListaAberta((v) => !v)}
                    className="flex items-center gap-1 active:opacity-70 transition"
                    style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}
                  >
                    {listaAberta ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {listaAberta ? "Esconder as entradas" : "Ver as entradas"}
                  </button>

                  {listaAberta && (
                    <div style={{ marginTop: 6 }}>
                      {g.entradas.map((e) => (
                        <div
                          key={e.id}
                          style={{ paddingTop: 9, paddingBottom: 9, borderTop: "1px solid var(--border)" }}
                        >
                          <div className="flex items-baseline justify-between" style={{ gap: 10 }}>
                            <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                              {diaMes(e.data)}
                              {nomeMeio(e.meio) && (
                                <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>
                                  {" "}· {nomeMeio(e.meio)}
                                </span>
                              )}
                            </span>
                            <span className="text-[13px] font-semibold shrink-0" style={{ color: "var(--text)" }}>
                              {reais(e.valor)}
                            </span>
                          </div>
                          {e.descricao && (
                            <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)", marginTop: 2 }}>
                              {e.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* a pergunta */}
              <p className="font-bold text-center" style={{ fontSize: 20, marginTop: 26 }}>
                É faturamento?
              </p>
              <div className="flex" style={{ gap: 10, marginTop: 14 }}>
                <BotaoResposta
                  rotulo="Sim"
                  marcado={respostas[g.chave] === "sim"}
                  principal
                  aoTocar={() => responder("sim")}
                />
                <BotaoResposta
                  rotulo="Não"
                  marcado={respostas[g.chave] === "nao"}
                  aoTocar={() => responder("nao")}
                />
              </div>

              {indice > 0 && (
                <div className="flex justify-center" style={{ marginTop: 18 }}>
                  <button
                    onClick={anterior}
                    className="flex items-center gap-1 active:opacity-70 transition"
                    style={{ color: "var(--text-secondary)", fontSize: 14 }}
                  >
                    <ChevronLeft size={17} />
                    Anterior
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --------------------------- SALVANDO --------------------------- */}
          {fase === "salvando" && (
            <div className="flex flex-col items-center text-center" style={{ gap: 12 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
            </div>
          )}

          {/* ----------------------------- FIM ----------------------------- */}
          {fase === "fim" && (
            <div className="conferir-entra flex flex-col items-center text-center">
              <Circulo>
                <Check size={38} strokeWidth={2.6} style={{ color: "var(--primary)" }} />
              </Circulo>
              <h2 className="font-bold" style={{ fontSize: 22, marginTop: 20 }}>
                Pronto!
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                {faturado > 0 ? (
                  <>
                    <strong style={{ color: "var(--primary)" }}>{reais(faturado)}</strong> entraram no
                    seu faturamento.
                  </>
                ) : (
                  "Nada entrou no seu faturamento."
                )}
              </p>
              <BotaoLargo rotulo="Continuar" aoTocar={() => navigate(destinoFinal, { replace: true })} />
            </div>
          )}

          {/* ----------------------------- ERRO ----------------------------- */}
          {fase === "erro" && (
            <div className="conferir-entra flex flex-col items-center text-center">
              <Circulo erro>
                <AlertCircle size={34} strokeWidth={2.2} style={{ color: "var(--danger)" }} />
              </Circulo>
              <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 18 }}>
                {erro.texto}
              </p>
              <BotaoLargo
                rotulo="Tentar de novo"
                aoTocar={() => (erro.tipo === "salvar" ? finalizar(respostas) : window.location.reload())}
              />
              {/* Saida de emergencia so no erro de carregar, para ninguem
                  ficar preso na tela sem internet */}
              {erro.tipo === "carregar" && (
                <button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="active:opacity-70 transition"
                  style={{ marginTop: 14, color: "var(--text-secondary)", fontSize: 14 }}
                >
                  Voltar ao início
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================== PECAS DA TELA ========================== */

function BotaoResposta({ rotulo, marcado, principal = false, aoTocar }) {
  const fundo = principal
    ? "var(--primary)"
    : marcado
    ? "rgba(34,197,94,0.12)"
    : "transparent";
  const borda = principal ? "var(--primary)" : marcado ? "rgba(34,197,94,0.6)" : "var(--border)";
  return (
    <button
      onClick={aoTocar}
      className="flex-1 rounded-2xl font-bold transition active:scale-[0.98]"
      style={{
        paddingTop: 15,
        paddingBottom: 15,
        fontSize: 17,
        backgroundColor: fundo,
        border: `1.5px solid ${borda}`,
        color: principal ? "var(--primary-contrast)" : "var(--text)",
        // resposta anterior marcada (ao voltar com "Anterior")
        boxShadow: marcado ? "0 0 0 3px rgba(34,197,94,0.25)" : "none",
      }}
    >
      {rotulo}
    </button>
  );
}

/* Picote de comprovante: linha tracejada com dois "recortes" nas
   laterais, na cor do fundo da tela. */
function Picote() {
  const recorte = {
    position: "absolute",
    top: 0,
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "var(--bg)",
    border: "1px solid var(--card-borda)",
  };
  return (
    <div aria-hidden className="relative" style={{ height: 18 }}>
      <span style={{ ...recorte, left: -10 }} />
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 8,
          borderTop: "1.5px dashed var(--border)",
        }}
      />
      <span style={{ ...recorte, right: -10 }} />
    </div>
  );
}

/* Exemplo de resposta na explicacao da primeira vez */
function ExemploResposta({ sim = false, titulo, texto }) {
  return (
    <div
      className="rounded-2xl flex items-start"
      style={{
        gap: 12,
        padding: "12px 14px",
        backgroundColor: sim ? "rgba(34,197,94,0.1)" : "var(--surface)",
        border: `1px solid ${sim ? "rgba(34,197,94,0.45)" : "var(--border)"}`,
      }}
    >
      <span
        className="rounded-full flex items-center justify-center shrink-0"
        style={{
          width: 30,
          height: 30,
          marginTop: 1,
          backgroundColor: sim ? "var(--primary)" : "var(--field)",
        }}
      >
        {sim ? (
          <Check size={16} strokeWidth={3} style={{ color: "var(--primary-contrast)" }} />
        ) : (
          <X size={15} strokeWidth={3} style={{ color: "var(--text-secondary)" }} />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold" style={{ fontSize: 15, color: "var(--text)" }}>
          {titulo}
        </span>
        <span className="block text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)", marginTop: 2 }}>
          {texto}
        </span>
      </span>
    </div>
  );
}

/* Uma linha "rotulo ........ valor" do comprovante */
function LinhaDetalhe({ rotulo, valor }) {
  return (
    <div className="flex items-baseline justify-between" style={{ gap: 12, paddingTop: 4, paddingBottom: 4 }}>
      <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
        {rotulo}
      </span>
      <span className="text-[13.5px] font-semibold text-right" style={{ color: "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}

function Circulo({ children, erro = false }) {
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: 76,
        height: 76,
        backgroundColor: erro ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.14)",
      }}
    >
      {children}
    </span>
  );
}

function BotaoLargo({ rotulo, aoTocar }) {
  return (
    <button
      onClick={aoTocar}
      className="w-full py-3.5 rounded-2xl font-semibold transition active:scale-[0.99]"
      style={{
        marginTop: 26,
        backgroundColor: "var(--primary)",
        color: "var(--primary-contrast)",
        fontSize: 16,
        lineHeight: "22px",
      }}
    >
      {rotulo}
    </button>
  );
}
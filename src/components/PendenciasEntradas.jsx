import { useEffect, useState, useCallback } from "react";
import { ArrowDownLeft, X, Check, Ban, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/context/AppStateContext";
import {
  listarPendentes,
  classificar,
  lerRegras,
  lerPreferencias,
  sugerirClassificacao,
  nomeParaDescricao,
} from "@/lib/openfinance";

/* ===================================================================
   PENDENCIAS DO OPEN FINANCE

   O que caiu na conta e ainda nao se sabe se é faturamento.

   COMO USAR (por enquanto, na tela de Novo lançamento):

     import PendenciasEntradas from "@/components/PendenciasEntradas";
     ...
     <PendenciasEntradas />

   Ele cuida de tudo: se nao houver pendencia, NAO renderiza nada e a
   tela fica exatamente como era.

   AQUI SO SE PERGUNTA UMA COISA: "isso é faturamento?"
   A pergunta sobre emitir nota fiscal NAO entra nesta tela — ela vai
   acontecer no WhatsApp, depois, com o card da nota ja montada.

   ALINHAMENTO COM O WHATSAPP: a fonte da verdade é a tabela
   `entradas` no banco, nao a tela. Se a pessoa responder no WhatsApp,
   o status muda no banco e a pergunta some daqui sozinha na proxima
   vez que a lista for lida. Por isso a lista recarrega quando a tela
   volta a ficar visivel.
   =================================================================== */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataCurta(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const mesmoDia = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (mesmoDia(d, hoje)) return `hoje, ${hora}`;
  if (mesmoDia(d, ontem)) return `ontem, ${hora}`;
  return `${d.getDate()} de ${MESES[d.getMonth()]}, ${hora}`;
}

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PendenciasEntradas() {
  const { adicionarLancamento } = useAppState();

  const [userId, setUserId] = useState(null);
  const [pendentes, setPendentes] = useState([]);
  const [regras, setRegras] = useState({});
  const [preferencias, setPreferencias] = useState({});
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // id da entrada que está saindo da tela (para a animação)
  const [saindo, setSaindo] = useState(null);
  // entrada que já foi respondida e agora oferece virar regra
  const [ofertaRegra, setOfertaRegra] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      setUserId(user.id);
      setCarregando(true);
      const [lista, r, p] = await Promise.all([
        listarPendentes(user.id),
        lerRegras(user.id),
        lerPreferencias(user.id),
      ]);
      setPendentes(lista);
      setRegras(r);
      setPreferencias(p);
    } catch {
      /* visitante ou falha de rede — a faixa simplesmente não aparece */
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Recarrega quando a pessoa volta para o app. É o que mantém a tela
  // alinhada com o WhatsApp: se ela respondeu por lá, ao voltar aqui
  // a pergunta já não aparece.
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [carregar]);

  async function responder(entrada, decisao) {
    // 1) some da tela com animação
    setSaindo(entrada.id);
    await new Promise((r) => setTimeout(r, 240));

    // 2) grava e, se for faturamento, vira lançamento
    try {
      await classificar(userId, entrada, decisao, {
        criarLancamento: adicionarLancamento,
      });
    } catch {
      /* falhou: recarrega para não deixar a tela mentindo */
      setSaindo(null);
      carregar();
      return;
    }

    // 3) tira da lista
    setPendentes((lista) => lista.filter((e) => e.id !== entrada.id));
    setSaindo(null);

    // 4) oferece virar regra — só se o pagador tiver documento e
    //    ainda não houver regra para ele. A oferta vem DEPOIS da
    //    resposta, de propósito: evita marcar sem querer.
    if (entrada.pagador_documento && !regras[entrada.pagador_documento]) {
      setOfertaRegra({ entrada, decisao });
    }
  }

  async function confirmarRegra(sim) {
    const dados = ofertaRegra;
    setOfertaRegra(null);
    if (!sim || !dados) return;
    try {
      const { salvarRegra } = await import("@/lib/openfinance");
      await salvarRegra(
        userId,
        dados.entrada.pagador_documento,
        dados.entrada.pagador_nome,
        dados.decisao === "faturamento" ? "faturamento" : "ignorar",
      );
      setRegras((r) => ({
        ...r,
        [dados.entrada.pagador_documento]: {
          acao: dados.decisao === "faturamento" ? "faturamento" : "ignorar",
          pagador_nome: dados.entrada.pagador_nome,
        },
      }));
    } catch {
      /* não conseguiu salvar a regra — não é grave, segue */
    }
  }

  // Sem pendência, o componente não existe na tela.
  if (!pendentes.length && !ofertaRegra) return null;

  const total = pendentes.reduce((s, e) => s + (Number(e.valor) || 0), 0);

  return (
    <>
      {/* ---------- A FAIXA ---------- */}
      {pendentes.length > 0 && (
        <button
          onClick={() => setAberto(true)}
          className="card-tacerto toque toque-escala w-full rounded-2xl flex items-center gap-3 px-4 py-3.5 text-left"
          style={{ borderColor: "rgba(34,197,94,0.45)" }}
        >
          <span
            className="rounded-xl flex items-center justify-center shrink-0"
            style={{ width: 38, height: 38, backgroundColor: "rgba(34,197,94,0.14)" }}
          >
            <ArrowDownLeft size={19} style={{ color: "var(--primary)" }} />
          </span>

          <span className="flex-1 min-w-0">
            <span
              className="block font-semibold leading-tight"
              style={{ color: "var(--text)", fontSize: 15 }}
            >
              {pendentes.length === 1
                ? "1 entrada esperando você"
                : `${pendentes.length} entradas esperando você`}
            </span>
            <span
              className="block leading-tight"
              style={{ color: "var(--text-secondary)", fontSize: 12.5, marginTop: 2 }}
            >
              R$ {fmt(total)} · toque para conferir
            </span>
          </span>

          <span
            className="rounded-full shrink-0"
            style={{
              width: 9,
              height: 9,
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 8px rgba(34,197,94,0.7)",
            }}
          />
        </button>
      )}

      {/* ---------- OS CARDS ---------- */}
      {aberto && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.55)", animation: "pendFade 240ms ease-out" }}
          onClick={() => setAberto(false)}
        >
          <style>{`
            @keyframes pendFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes pendSobe {
              from { opacity: 0; transform: translateY(18px) }
              to   { opacity: 1; transform: translateY(0) }
            }
            .pend-card { animation: pendSobe 280ms cubic-bezier(0.22,0.61,0.36,1) both }
            .pend-saindo {
              opacity: 0;
              transform: translateX(60px) scale(0.97);
              transition: opacity 220ms ease, transform 220ms ease;
            }
            @media (prefers-reduced-motion: reduce) {
              .pend-card { animation: none }
            }
          `}</style>

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full flex flex-col"
            style={{
              maxWidth: 520,
              maxHeight: "82vh",
              backgroundColor: "var(--bg)",
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              border: "1px solid var(--card-borda)",
              borderBottom: "none",
              animation: "pendSobe 300ms cubic-bezier(0.22,0.61,0.36,1)",
            }}
          >
            {/* cabeçalho */}
            <div
              className="shrink-0 flex items-center gap-3"
              style={{ padding: "16px 18px 12px" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold" style={{ color: "var(--text)", fontSize: 17 }}>
                  Caiu na sua conta
                </p>
                <p
                  style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}
                >
                  Me diga o que é faturamento
                </p>
              </div>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="toque rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  border: "1px solid var(--card-borda)",
                }}
              >
                <X size={16} style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* lista */}
            <div
              className="flex-1 min-h-0 overflow-y-auto hide-scrollbar"
              style={{
                padding: "0 14px",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {pendentes.length === 0 && (
                <p
                  className="text-center"
                  style={{ color: "var(--text-secondary)", fontSize: 14, padding: "28px 0" }}
                >
                  Tudo respondido. Obrigado!
                </p>
              )}

              {pendentes.map((e) => {
                const s = sugerirClassificacao(e, regras, preferencias);
                return (
                  <div
                    key={e.id}
                    className={`card-tacerto rounded-2xl pend-card ${saindo === e.id ? "pend-saindo" : ""}`}
                    style={{ padding: "14px 15px" }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p
                        className="font-semibold truncate"
                        style={{ color: "var(--text)", fontSize: 15 }}
                      >
                        {nomeParaDescricao(e.pagador_nome)}
                      </p>
                      <p
                        className="font-bold shrink-0"
                        style={{ color: "var(--primary)", fontSize: 16 }}
                      >
                        R$ {fmt(e.valor)}
                      </p>
                    </div>

                    <p
                      style={{ color: "var(--text-tertiary)", fontSize: 12, marginTop: 3 }}
                    >
                      {e.meio || "Transferência"} · {dataCurta(e.data)}
                      {e.pagador_tipo ? ` · ${e.pagador_tipo}` : ""}
                    </p>

                    {/* o que o Fisco acha — só um palpite, nunca decisão */}
                    {s.motivo && (
                      <div
                        className="flex items-start rounded-xl"
                        style={{
                          gap: 7,
                          marginTop: 10,
                          padding: "8px 10px",
                          backgroundColor: "rgba(34,197,94,0.08)",
                        }}
                      >
                        <Sparkles
                          size={13}
                          style={{ color: "var(--primary)", marginTop: 1 }}
                          className="shrink-0"
                        />
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: 12,
                            lineHeight: 1.45,
                          }}
                        >
                          {s.motivo}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-8" style={{ marginTop: 12 }}>
                      <button
                        onClick={() => responder(e, "faturamento")}
                        className="toque toque-escala flex-1 rounded-xl font-semibold flex items-center justify-center gap-2"
                        style={{
                          paddingTop: 11,
                          paddingBottom: 11,
                          fontSize: 14,
                          backgroundColor: "var(--primary)",
                          color: "var(--primary-contrast)",
                        }}
                      >
                        <Check size={16} strokeWidth={2.6} />
                        É faturamento
                      </button>

                      <button
                        onClick={() => responder(e, "ignorada")}
                        className="toque toque-escala flex-1 rounded-xl font-medium flex items-center justify-center gap-2"
                        style={{
                          paddingTop: 11,
                          paddingBottom: 11,
                          fontSize: 14,
                          border: "1px solid var(--card-borda)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Ban size={15} />
                        Não é
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------- OFERTA DE REGRA ----------
          Vem DEPOIS da resposta, de propósito: junto poluiria o card e
          aumentaria a chance de marcar sem querer. */}
      {ofertaRegra && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", padding: 20 }}
          onClick={() => confirmarRegra(false)}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="w-full rounded-3xl"
            style={{
              maxWidth: 380,
              backgroundColor: "var(--bg)",
              border: "1px solid var(--card-borda)",
              padding: 22,
              animation: "pendSobe 260ms cubic-bezier(0.22,0.61,0.36,1)",
            }}
          >
            <p className="font-bold" style={{ color: "var(--text)", fontSize: 16.5 }}>
              Faço sempre assim?
            </p>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                lineHeight: 1.5,
                marginTop: 8,
              }}
            >
              Da próxima vez que{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {nomeParaDescricao(ofertaRegra.entrada.pagador_nome)}
              </span>{" "}
              te pagar, eu já{" "}
              {ofertaRegra.decisao === "faturamento"
                ? "lanço como faturamento"
                : "deixo de fora"}{" "}
              sem perguntar.
            </p>

            <div className="flex gap-8" style={{ marginTop: 18 }}>
              <button
                onClick={() => confirmarRegra(true)}
                className="toque toque-escala flex-1 rounded-xl font-semibold"
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 14.5,
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Pode fazer
              </button>
              <button
                onClick={() => confirmarRegra(false)}
                className="toque toque-escala flex-1 rounded-xl font-medium"
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 14.5,
                  border: "1px solid var(--card-borda)",
                  color: "var(--text-secondary)",
                }}
              >
                Continue perguntando
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
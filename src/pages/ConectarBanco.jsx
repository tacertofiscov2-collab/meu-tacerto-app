/* CONECTARBANCO v5 — simbolo da Pluggy sem o circulo de fundo */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import AuthError from "@/components/AuthError";
import SimboloPluggy from "@/components/SimboloPluggy";
import { listarConexoes, desconectarConexao } from "@/lib/openfinance";

/* ===================================================================
   CONECTARBANCO — a "casa" da conexao bancaria (decidido 24/09/2026)

   Aberta pelo simbolo da Pluggy no Dashboard. Mostra:
     - o simbolo da Pluggy (SEM circulo de fundo — pedido do Fernando)
       e o porque de conectar
     - os tres pontos de confianca
     - os bancos conectados, cada um com DESCONECTAR
     - o botao que leva a escolha do banco (/conectar-banco/escolher)

   CAMINHO B: a conexao em si NAO acontece mais aqui nem pela janela da
   Pluggy (widget). Ela acontece nas telas nossas:
     /conectar-banco/escolher  -> lista de bancos + folha "Conectar conta"
     /conectar-banco/retorno   -> a pessoa volta do banco, a conexao
                                  e guardada e as entradas sao buscadas

   DESCONECTAR (openfinance.js -> desconectarConexao):
     apaga a conexao NA PLUGGY (libera a vaga paga) e marca como
     "desconectada" no nosso banco. As entradas ja guardadas FICAM.
   =================================================================== */

export default function ConectarBanco() {
  const navigate = useNavigate();

  const [conexoes, setConexoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Confirmacao de desconectar
  const [paraDesconectar, setParaDesconectar] = useState(null);
  const [desconectando, setDesconectando] = useState(false);
  const [erroDesconectar, setErroDesconectar] = useState("");

  /* Quais bancos estao conectados. */
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!ativo || !user) return;
        const lista = await listarConexoes(user.id);
        if (ativo) setConexoes(lista);
      } catch {
        /* sem rede — a tela abre assim mesmo */
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  const botaoPrincipal = {
    backgroundColor: "var(--primary)",
    color: "var(--primary-contrast)",
  };

  function abrirConfirmacao(conexao) {
    setErroDesconectar("");
    setParaDesconectar(conexao);
  }

  function fecharConfirmacao() {
    if (desconectando) return;
    setParaDesconectar(null);
    setErroDesconectar("");
  }

  async function confirmarDesconectar() {
    if (!paraDesconectar) return;
    setDesconectando(true);
    setErroDesconectar("");
    try {
      await desconectarConexao(paraDesconectar);
      setConexoes((antes) => antes.filter((c) => c.id !== paraDesconectar.id));
      toast.success(`${paraDesconectar.instituicao || "Banco"} desconectado`);
      setParaDesconectar(null);
    } catch {
      setErroDesconectar("Não foi possível desconectar agora. Tente de novo em instantes.");
    } finally {
      setDesconectando(false);
    }
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Conexão bancária
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-sm w-full mx-auto pt-6">

          {/* So os aneis da Pluggy, sem circulo de fundo */}
          <div className="flex justify-center mb-5">
            <SimboloPluggy altura={34} />
          </div>

          <p
            className="text-[14px] text-center leading-relaxed mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Conecte a conta onde você recebe e o Fisco acompanha seu
            faturamento sozinho.
          </p>

          <div className="card-tacerto rounded-2xl p-4 space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>
                Conexão pelo Open Finance, o sistema oficial do Banco Central.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Lock size={20} className="shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>
                Só leitura: o app não faz Pix, não movimenta dinheiro e não
                vê a senha do seu banco.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>
                Nada entra no seu faturamento sem você confirmar.
              </p>
            </div>
          </div>

          {/* Bancos conectados */}
          {!carregando && conexoes.length > 0 && (
            <div className="mb-6">
              <p
                className="text-[12px] font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Conectados
              </p>
              <div className="space-y-2">
                {conexoes.map((c) => (
                  <div
                    key={c.id}
                    className="card-tacerto rounded-2xl px-4 py-3 flex items-center gap-3"
                  >
                    <Landmark size={18} style={{ color: "var(--text-secondary)" }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate">
                        {c.instituicao || "Banco"}
                      </p>
                      <p className="text-[12px]" style={{ color: "var(--primary)" }}>
                        Conectado
                      </p>
                    </div>
                    <button
                      onClick={() => abrirConfirmacao(c)}
                      className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition active:scale-[0.97]"
                      style={{
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        backgroundColor: "transparent",
                      }}
                    >
                      Desconectar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/conectar-banco/escolher")}
            disabled={carregando}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99] disabled:opacity-40"
            style={botaoPrincipal}
          >
            {conexoes.length > 0 ? "Conectar outro banco" : "Conectar banco"}
          </button>

          {/* Rodape: quem faz a conexao */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <SimboloPluggy altura={11} />
            <p className="text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
              Conexão feita pela Pluggy, regulada pelo Banco Central.
            </p>
          </div>

        </div>
      </div>

      {/* ---------- CONFIRMACAO DE DESCONECTAR ---------- */}
      {paraDesconectar && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", padding: 20 }}
          onClick={fecharConfirmacao}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-3xl"
            style={{
              maxWidth: 380,
              backgroundColor: "var(--bg)",
              border: "1px solid var(--card-borda)",
              padding: 22,
            }}
          >
            <p className="font-bold" style={{ color: "var(--text)", fontSize: 16.5 }}>
              Desconectar {paraDesconectar.instituicao || "este banco"}?
            </p>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                lineHeight: 1.5,
                marginTop: 8,
              }}
            >
              O Fisco para de ver as entradas novas desse banco. O que já foi
              guardado continua no app, e você pode conectar de novo quando
              quiser.
            </p>

            {erroDesconectar && (
              <div style={{ marginTop: 12 }}>
                <AuthError>{erroDesconectar}</AuthError>
              </div>
            )}

            <div className="flex gap-3" style={{ marginTop: 18 }}>
              <button
                onClick={fecharConfirmacao}
                disabled={desconectando}
                className="flex-1 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-40"
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 14.5,
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                Manter conectado
              </button>
              <button
                onClick={confirmarDesconectar}
                disabled={desconectando}
                className="flex-1 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-40"
                style={{
                  paddingTop: 12,
                  paddingBottom: 12,
                  fontSize: 14.5,
                  border: "1px solid var(--card-borda)",
                  color: "var(--danger)",
                }}
              >
                {desconectando ? "Desconectando..." : "Desconectar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
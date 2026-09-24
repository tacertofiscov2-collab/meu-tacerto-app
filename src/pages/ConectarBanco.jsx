/* CONECTARBANCO v1 — abre a Pluggy e guarda a conexao na hora */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { PluggyConnect } from "react-pluggy-connect";

import { supabase } from "@/lib/supabase";
import AuthError from "@/components/AuthError";
import { listarConexoes, salvarConexao } from "@/lib/openfinance";

/* ===================================================================
   CONECTARBANCO — a porta de entrada do Open Finance

   O CAMINHO
     1. botao "Conectar meu banco"
     2. pede o Connect Token a Edge Function `pluggy` ({ acao: "token" })
        — a chave da Pluggy NUNCA passa pelo app
     3. abre a janela da Pluggy (PluggyConnect)
     4. a pessoa escolhe o banco e autoriza LA DENTRO, no banco
     5. onSuccess devolve o item -> GRAVA NA HORA com salvarConexao

   ⚠️ POR QUE GRAVAR NA HORA
   O id do item so chega no onSuccess e a Pluggy avisa que ele nao pode
   ser recuperado depois. Se a gravacao falhar, a tela guarda o item em
   `itemPendente` e oferece "tentar de novo" — nunca perde a conexao.

   O QUE ESTA TELA AINDA NAO FAZ
   Nao busca as transacoes. Isso e o passo 2 do roteiro (ligar o
   openfinance.js na Edge Function) e o passo 5 (quando sincronizar).

   SANDBOX
   PLUGGY_SANDBOX = true mostra os bancos de teste da Pluggy. Na
   producao (passo 9 do roteiro) vira false.
   =================================================================== */

const PLUGGY_SANDBOX = true;

export default function ConectarBanco() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [conexoes, setConexoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // "inicio" | "sucesso"
  const [etapa, setEtapa] = useState("inicio");
  const [connectToken, setConnectToken] = useState("");
  const [abrindo, setAbrindo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [itemPendente, setItemPendente] = useState(null);
  const [bancoConectado, setBancoConectado] = useState("");
  const [erro, setErro] = useState("");

  /* Descobre quem esta logado e quais bancos ja estao conectados. */
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!ativo || !user) return;
        setUserId(user.id);
        const lista = await listarConexoes(user.id);
        if (ativo) setConexoes(lista);
      } catch {
        /* sem rede ou sem conexoes — a tela abre assim mesmo */
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

  /* Passo 2 e 3: pede o token e abre a janela da Pluggy. */
  async function abrirPluggy() {
    setErro("");
    if (!userId) return setErro("Entre na sua conta para conectar o banco.");

    setAbrindo(true);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy", {
        body: { acao: "token" },
      });
      setAbrindo(false);

      if (error || !data?.accessToken) {
        return setErro("Não foi possível abrir a conexão agora. Tente de novo em instantes.");
      }
      setConnectToken(data.accessToken);
    } catch {
      setAbrindo(false);
      setErro("Não foi possível abrir a conexão agora. Tente de novo em instantes.");
    }
  }

  /* Passo 5: grava a conexao. Se falhar, guarda para tentar de novo. */
  async function guardarConexao(item) {
    setSalvando(true);
    setErro("");
    try {
      const salva = await salvarConexao(userId, {
        itemId: item.id,
        instituicao: item.nome,
        numeroConta: null,
      });
      setConexoes((antes) => [salva, ...antes.filter((c) => c.id !== salva.id)]);
      setBancoConectado(item.nome || "Seu banco");
      setItemPendente(null);
      setEtapa("sucesso");
    } catch {
      setItemPendente(item);
      setErro("O banco foi conectado, mas não consegui guardar a conexão. Toque em tentar de novo.");
    } finally {
      setSalvando(false);
    }
  }

  /* A Pluggy terminou com sucesso: fecha a janela e grava. */
  function aoConectar(itemData) {
    const item = {
      id: itemData?.item?.id,
      nome: itemData?.item?.connector?.name || "",
    };
    setConnectToken("");
    if (!item.id) return setErro("A conexão não foi concluída. Tente de novo.");
    guardarConexao(item);
  }

  /* A pessoa fechou a janela sem terminar: volta ao botao, sem erro. */
  function aoFechar() {
    setConnectToken("");
  }

  /* Erro dentro da janela: a propria Pluggy mostra a mensagem la. */
  function aoErroNaJanela(e) {
    console.warn("pluggy connect:", e);
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
          Conectar banco
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-sm w-full mx-auto pt-6">

          {/* ============ INICIO ============ */}
          {etapa === "inicio" && (
            <>
              <div className="flex justify-center mb-5">
                <span
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <Landmark size={30} strokeWidth={2} style={{ color: "var(--primary)" }} />
                </span>
              </div>

              <p
                className="text-[14px] text-center leading-relaxed mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Conecte seu banco e o Fisco acompanha o que entra na sua
                conta, sem você precisar digitar nada.
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

              {/* Bancos ja conectados */}
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
                        <Landmark size={18} style={{ color: "var(--text-secondary)" }} />
                        <span className="flex-1 text-[14px] font-semibold truncate">
                          {c.instituicao || "Banco"}
                        </span>
                        <span className="text-[12px]" style={{ color: "var(--primary)" }}>
                          Conectado
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {erro && <AuthError>{erro}</AuthError>}

                {itemPendente ? (
                  <button
                    onClick={() => guardarConexao(itemPendente)}
                    disabled={salvando}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99] disabled:opacity-40"
                    style={botaoPrincipal}
                  >
                    {salvando ? "Guardando..." : "Tentar de novo"}
                  </button>
                ) : (
                  <button
                    onClick={abrirPluggy}
                    disabled={abrindo || salvando || carregando}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99] disabled:opacity-40"
                    style={botaoPrincipal}
                  >
                    {abrindo
                      ? "Abrindo..."
                      : salvando
                      ? "Guardando..."
                      : conexoes.length > 0
                      ? "Conectar outro banco"
                      : "Conectar meu banco"}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ============ SUCESSO ============ */}
          {etapa === "sucesso" && (
            <>
              <div className="flex justify-center mb-5">
                <span
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <CheckCircle2 size={32} strokeWidth={2} style={{ color: "var(--primary)" }} />
                </span>
              </div>

              <h2 className="text-lg font-bold text-center mb-2" style={{ color: "var(--text)" }}>
                {bancoConectado} conectado
              </h2>
              <p
                className="text-[14px] text-center leading-relaxed mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                O Fisco vai buscar suas entradas desde 1º de janeiro para
                conferir com você.
              </p>

              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                style={botaoPrincipal}
              >
                Voltar ao início
              </button>
            </>
          )}

        </div>
      </div>

      {/* A janela da Pluggy so existe enquanto houver token */}
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={PLUGGY_SANDBOX}
          onSuccess={aoConectar}
          onError={aoErroNaJanela}
          onClose={aoFechar}
        />
      )}
    </div>
  );
}
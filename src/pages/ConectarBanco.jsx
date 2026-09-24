/* CONECTARBANCO v3 — conecta, reconhece banco repetido e ja busca as entradas */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, ShieldCheck, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { PluggyConnect } from "react-pluggy-connect";

import { supabase } from "@/lib/supabase";
import AuthError from "@/components/AuthError";
import { listarConexoes, salvarConexao, sincronizar } from "@/lib/openfinance";

/* ===================================================================
   CONECTARBANCO — a porta de entrada do Open Finance

   O CAMINHO
     1. botao "Conectar meu banco"
     2. pede o Connect Token a Edge Function `pluggy` ({ acao: "token" })
        — a chave da Pluggy NUNCA passa pelo app
     3. abre a janela da Pluggy (PluggyConnect)
     4. a pessoa escolhe o banco e autoriza LA DENTRO, no banco
     5. onSuccess devolve o item:
          - BANCO REPETIDO -> nao guarda, apaga o repetido na Pluggy
            ({ acao: "desconectar" }) e sincroniza a conexao ANTIGA
          - BANCO NOVO     -> GRAVA NA HORA com salvarConexao
     6. SINCRONIZA: busca as entradas desde 1º de janeiro e guarda em
        `entradas` (trava de duplicata no openfinance.js)
        -> mostra "Achei X entradas"

   ⚠️ POR QUE RECONHECER BANCO REPETIDO (teste de 24/09/2026)
   Conectar o MESMO banco de novo fez a Pluggy criar uma SEGUNDA
   conexao, mesmo com `avoidDuplicates`. As mesmas transacoes voltaram
   com codigos novos e a trava de duplicata nao percebeu: 4 entradas
   viraram 8. Se a pessoa confirmasse tudo, o velocimetro dobrava.
   Tres protecoes agora, uma atras da outra:
     (a) esta tela — nao guarda a conexao repetida
     (b) a Edge Function apaga a repetida na Pluggy (libera a vaga)
     (c) nos bancos reais, a chave da entrada usa o codigo do proprio
         banco (providerId), igual em qualquer conexao

   LIMITE CONHECIDO: a comparacao e pelo NOME do banco (connector).
   Duas contas diferentes do mesmo banco com o mesmo nome seriam
   tratadas como repeticao. PF e PJ costumam ter nomes diferentes na
   Pluggy ("Itau" x "Itau Empresas"). Se virar problema, guardar o
   connector.id em `conexoes_bancarias` e comparar por ele.

   ⚠️ POR QUE GRAVAR NA HORA
   O id do item so chega no onSuccess e a Pluggy avisa que ele nao pode
   ser recuperado depois. Se a gravacao falhar, a tela guarda o item em
   `itemPendente` e oferece "tentar de novo" — nunca perde a conexao.

   SE A BUSCA DAS ENTRADAS FALHAR
   A conexao ja esta guardada. A tela so avisa e oferece "tentar de
   novo" — nao desfaz nada.

   "CONFERIR AGORA" leva para /lancar, onde hoje mora a faixa de
   pendencias (PendenciasEntradas). Quando o card do Dashboard existir
   (passo 3 do roteiro), passa a levar para la.

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
  const [jaEstavaConectado, setJaEstavaConectado] = useState(false);
  const [erro, setErro] = useState("");

  // Busca das entradas logo depois de conectar
  const [conexaoAtualId, setConexaoAtualId] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [novasEntradas, setNovasEntradas] = useState(null);
  const [erroSync, setErroSync] = useState(false);

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

  const botaoSecundario = {
    border: "1px solid var(--border)",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
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

  /* Passo 6: busca as entradas desde 1º de janeiro e guarda. */
  async function buscarEntradas(conexaoId) {
    if (!userId || !conexaoId) return;
    setSincronizando(true);
    setErroSync(false);
    setNovasEntradas(null);
    try {
      const { novas } = await sincronizar(userId, conexaoId);
      setNovasEntradas(novas);
    } catch {
      setErroSync(true);
    } finally {
      setSincronizando(false);
    }
  }

  /* Banco repetido: apaga a conexao NOVA na Pluggy. Se falhar, so
     registra — no sandbox a Pluggy limpa sozinha em 30 dias; na
     producao, a sobra ocupa uma vaga do pacote ate ser apagada. */
  async function descartarRepetida(itemId) {
    try {
      const { data, error } = await supabase.functions.invoke("pluggy", {
        body: { acao: "desconectar", itemId },
      });
      if (error || data?.error) console.warn("pluggy desconectar:", error || data.error);
    } catch (e) {
      console.warn("pluggy desconectar:", e);
    }
  }

  /* Passo 5 (banco novo): grava a conexao. Se falhar, guarda para
     tentar de novo. */
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
      setJaEstavaConectado(false);
      setItemPendente(null);
      setConexaoAtualId(salva.id);
      setEtapa("sucesso");
      buscarEntradas(salva.id);
    } catch {
      setItemPendente(item);
      setErro("O banco foi conectado, mas não consegui guardar a conexão. Toque em tentar de novo.");
    } finally {
      setSalvando(false);
    }
  }

  /* A Pluggy terminou com sucesso: fecha a janela e decide. */
  function aoConectar(itemData) {
    const item = {
      id: itemData?.item?.id,
      nome: itemData?.item?.connector?.name || "",
    };
    setConnectToken("");
    if (!item.id) return setErro("A conexão não foi concluída. Tente de novo.");

    // Mesmo banco de uma conexao que ja existe, mas com codigo novo:
    // e repeticao. Nao guarda, apaga a nova e usa a antiga.
    const existente = conexoes.find(
      (c) => item.nome && c.instituicao === item.nome && c.pluggy_item_id !== item.id,
    );

    if (existente) {
      descartarRepetida(item.id);
      setBancoConectado(item.nome);
      setJaEstavaConectado(true);
      setConexaoAtualId(existente.id);
      setEtapa("sucesso");
      buscarEntradas(existente.id);
      return;
    }

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

  const textoEntradas =
    novasEntradas === 1 ? "1 entrada" : `${novasEntradas} entradas`;

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
                {jaEstavaConectado
                  ? `${bancoConectado} já estava conectado`
                  : `${bancoConectado} conectado`}
              </h2>

              {/* Buscando */}
              {sincronizando && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Loader2 size={16} className="animate-spin" style={{ color: "var(--primary)" }} />
                  <p className="text-[14px] text-center" style={{ color: "var(--text-secondary)" }}>
                    Buscando suas entradas desde 1º de janeiro...
                  </p>
                </div>
              )}

              {/* Falhou a busca — a conexao continua guardada */}
              {!sincronizando && erroSync && (
                <div className="space-y-3">
                  <p
                    className="text-[14px] text-center leading-relaxed mb-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    O banco está conectado, mas não consegui buscar suas
                    entradas agora.
                  </p>
                  <button
                    onClick={() => buscarEntradas(conexaoAtualId)}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                    style={botaoPrincipal}
                  >
                    Tentar de novo
                  </button>
                  <button
                    onClick={() => navigate("/dashboard", { replace: true })}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                    style={botaoSecundario}
                  >
                    Voltar ao início
                  </button>
                </div>
              )}

              {/* Achou entradas novas */}
              {!sincronizando && !erroSync && novasEntradas > 0 && (
                <div className="space-y-3">
                  <p
                    className="text-[14px] text-center leading-relaxed mb-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Achei{" "}
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>
                      {textoEntradas}
                    </span>{" "}
                    {jaEstavaConectado ? "novas" : "desde 1º de janeiro"}. Vamos
                    conferir juntos o que é faturamento?
                  </p>
                  <button
                    onClick={() => navigate("/lancar", { replace: true })}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                    style={botaoPrincipal}
                  >
                    Conferir agora
                  </button>
                  <button
                    onClick={() => navigate("/dashboard", { replace: true })}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                    style={botaoSecundario}
                  >
                    Depois
                  </button>
                </div>
              )}

              {/* Nada novo */}
              {!sincronizando && !erroSync && novasEntradas === 0 && (
                <div className="space-y-3">
                  <p
                    className="text-[14px] text-center leading-relaxed mb-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {jaEstavaConectado
                      ? "Está tudo em dia: nenhuma entrada nova desde a última vez."
                      : "Nenhuma entrada nova desde 1º de janeiro."}
                  </p>
                  <button
                    onClick={() => navigate("/dashboard", { replace: true })}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                    style={botaoPrincipal}
                  >
                    Voltar ao início
                  </button>
                </div>
              )}
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
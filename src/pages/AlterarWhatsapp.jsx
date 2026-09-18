/* ALTERARWHATSAPP v2 — senha antes, depois numero novo e codigo */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import AuthError from "@/components/AuthError";
import { WHATSAPP_ATIVO } from "@/lib/flags";

/* ===================================================================
   ALTERARWHATSAPP — trocar o numero cadastrado

   POR QUE PEDIR A SENHA ANTES (decisao de 17/09/2026)

   Na entrega o app vai estar com Open Finance e emissao de nota
   ligados. Isso muda o peso do numero: as 20:30 o Fisco manda os Pix
   recebidos perguntando "devo emitir sua nota?", e quem responder Sim
   faz o app emitir nota em nome do MEI. Um numero apontado para a
   pessoa errada nao vira so um aviso perdido — vira alguem vendo o
   faturamento alheio e decidindo sobre notas fiscais alheias.

   Por isso o fluxo tem tres etapas, e nao duas:
       1) SENHA   — prova que e o dono da conta, nao alguem com o
                    celular na mao e a sessao aberta
       2) NUMERO  — o telefone novo
       3) CODIGO  — prova que o numero novo e mesmo dele

   QUEM ENTROU PELO GOOGLE NAO TEM SENHA. Para essas contas a etapa 1
   e uma reautenticacao pelo proprio Google, que cumpre o mesmo papel.
   A tela detecta isso sozinha (ver contaVeioDoGoogle) e troca o campo
   de senha por um botao.

   REAPROVEITA O QUE JA EXISTE: as etapas 2 e 3 sao o mesmo caminho B
   do Cadastro.
     - "enviar-codigo"     manda o codigo pela Z-API
     - "verificar-codigo"  confere E GRAVA o numero em `perfis`,
                           porque recebe o userId
   Por isso, no modo real, esta tela nao escreve no banco: quem grava e
   a Edge Function.

   MODO PREVIA (WHATSAPP_ATIVO = false, no src/lib/flags.js):
   nao envia nada, aceita qualquer codigo de 6 numeros e grava o numero
   direto daqui — porque a Edge Function nao foi chamada. A SENHA
   CONTINUA SENDO CONFERIDA DE VERDADE, para o fluxo ser testado como
   ele vai funcionar.

   TECLADO DO IPHONE: mesma solucao do Cadastro. Ao focar o campo do
   codigo, a tela rola ate os botoes (scrollIntoView com atraso de
   300ms), senao o teclado cobre o "Validar codigo".
   =================================================================== */

/* Formata enquanto digita: (11) 98765-4321 */
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

/* Conta sem senha propria: entrou por login social. */
function contaVeioDoGoogle(user) {
  if (!user) return false;
  if (user.app_metadata?.provider === "google") return true;
  const lista = user.app_metadata?.providers || [];
  if (Array.isArray(lista) && lista.includes("google")) return true;
  const identidades = user.identities || [];
  return identidades.some((i) => i?.provider === "google");
}

export default function AlterarWhatsapp() {
  const navigate = useNavigate();

  // "senha" | "numero" | "verificar"
  const [etapa, setEtapa] = useState("senha");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  /* Dados da conta, lidos uma vez ao abrir a tela. */
  const [email, setEmail] = useState("");
  const [ehGoogle, setEhGoogle] = useState(false);

  const acoesCodigoRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user || !ativo) return;
        setEmail(user.email || "");
        setEhGoogle(contaVeioDoGoogle(user));
      } catch {
        /* sem sessao — o botao vai avisar */
      }
    })();
    return () => { ativo = false; };
  }, []);

  /* Rola a tela para os botoes quando o teclado abre (iPhone). */
  function aoFocarCodigo() {
    setTimeout(() => {
      if (acoesCodigoRef.current) {
        acoesCodigoRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 300);
  }

  const fieldStyle = {
    backgroundColor: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  const botaoPrincipal = {
    backgroundColor: "var(--primary)",
    color: "var(--primary-contrast)",
  };

  /* ETAPA 1 — confere a senha fazendo um login silencioso com o mesmo
     e-mail. Se a senha estiver errada, o Supabase devolve erro e nada
     acontece; a sessao atual continua valendo do mesmo jeito. */
  async function conferirSenha() {
    setErro("");
    if (!senha) return setErro("Digite sua senha.");
    if (!email) return setErro("Não foi possível identificar sua conta.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      setLoading(false);
      if (error) return setErro("Senha incorreta.");
      setSenha("");
      setEtapa("numero");
    } catch {
      setLoading(false);
      setErro("Não foi possível confirmar agora. Tente de novo em instantes.");
    }
  }

  /* ETAPA 1 (contas Google) — reautentica pelo proprio Google. A volta
     cai no /auth/callback e o app retorna a esta tela. */
  async function reautenticarGoogle() {
    setErro("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/alterar-whatsapp`,
        },
      });
      if (error) setErro("Não foi possível confirmar pelo Google agora.");
    } catch {
      setErro("Não foi possível confirmar pelo Google agora.");
    }
  }

  /* Envia o codigo pela Edge Function. Em modo previa nao chama nada. */
  async function enviarCodigo() {
    if (!WHATSAPP_ATIVO) return true;
    try {
      const { data, error } = await supabase.functions.invoke("enviar-codigo", {
        body: { telefone },
      });
      if (error || data?.error) {
        setErro(
          (data && data.error) ||
            "Não foi possível enviar o código agora. Tente de novo em instantes."
        );
        return false;
      }
      return true;
    } catch {
      setErro("Não foi possível enviar o código agora. Tente de novo em instantes.");
      return false;
    }
  }

  /* Grava o numero direto. So usado no MODO PREVIA — no modo real quem
     grava e a Edge Function verificar-codigo, que recebe o userId. */
  async function gravarNumeroDireto() {
    const digitos = telefone.replace(/\D/g, "");
    if (!digitos) return;
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      await supabase
        .from("perfis")
        .update({ whatsapp: `+55${digitos}` })
        .eq("id", data.user.id);
    } catch {
      /* falha de rede — a tela volta assim mesmo */
    }
  }

  /* ETAPA 2 — valida o formato e dispara o codigo. */
  async function continuarComNumero() {
    setErro("");
    if (!telefoneValido(telefone)) {
      return setErro("Digite um número de WhatsApp válido com DDD.");
    }
    setLoading(true);
    const enviou = await enviarCodigo();
    setLoading(false);
    if (!enviou) return;
    setEtapa("verificar");
  }

  /* ETAPA 3 — confere o codigo. No modo real a Edge Function grava o
     numero; no modo previa gravamos aqui. */
  async function conferirCodigo() {
    setErro("");
    if (codigo.replace(/\D/g, "").length < 6) {
      return setErro("Digite os 6 números do código que enviamos.");
    }

    if (!WHATSAPP_ATIVO) {
      await gravarNumeroDireto();
      navigate("/editar-perfil", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data, error } = await supabase.functions.invoke("verificar-codigo", {
        body: { telefone, codigo, userId },
      });

      setLoading(false);

      if (error || data?.error) {
        return setErro((data && data.error) || "Código incorreto. Tente novamente.");
      }

      navigate("/editar-perfil", { replace: true });
    } catch {
      setLoading(false);
      setErro("Código incorreto. Tente novamente.");
    }
  }

  async function reenviarCodigo() {
    if (reenviando) return;
    setErro("");
    setReenviando(true);
    if (!WHATSAPP_ATIVO) {
      setErro("Modo demonstração: digite qualquer 6 números para continuar.");
      setTimeout(() => setReenviando(false), 5000);
      return;
    }
    const enviou = await enviarCodigo();
    if (enviou) setErro("Enviamos um novo código para o seu WhatsApp.");
    setTimeout(() => setReenviando(false), 30000);
  }

  /* A seta volta uma etapa por vez, e da primeira sai da tela. */
  function voltar() {
    setErro("");
    if (etapa === "verificar") {
      setCodigo("");
      return setEtapa("numero");
    }
    if (etapa === "numero") {
      setTelefone("");
      return setEtapa("senha");
    }
    navigate("/editar-perfil", { replace: true });
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={voltar}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Alterar WhatsApp
        </h1>
      </header>

      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-sm w-full mx-auto pt-6">

          {/* ============ ETAPA 1: CONFIRMAR QUE E VOCE ============ */}
          {etapa === "senha" && (
            <>
              <div className="flex justify-center mb-5">
                <span
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <ShieldCheck size={30} strokeWidth={2} style={{ color: "var(--primary)" }} />
                </span>
              </div>

              <p
                className="text-[14px] text-center leading-relaxed mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                O WhatsApp é por onde o Fisco fala com você sobre suas
                entradas e notas. Confirme que é você antes de trocar.
              </p>

              {ehGoogle ? (
                /* Conta sem senha propria: reautentica pelo Google. */
                <div className="space-y-3">
                  {erro && <AuthError>{erro}</AuthError>}
                  <button
                    onClick={reautenticarGoogle}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99]"
                    style={botaoPrincipal}
                  >
                    Confirmar com o Google
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showSenha ? "text" : "password"}
                      placeholder="Sua senha"
                      value={senha}
                      autoFocus
                      autoComplete="current-password"
                      onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter" && senha) conferirSenha(); }}
                      className="campo-tacerto w-full px-4 py-3.5 pr-11 rounded-2xl text-[16px] font-semibold focus:outline-none placeholder:font-normal placeholder:opacity-50"
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-secondary)" }}
                      aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {erro && <AuthError>{erro}</AuthError>}

                  <button
                    onClick={conferirSenha}
                    disabled={loading || !senha}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99] disabled:opacity-40"
                    style={botaoPrincipal}
                  >
                    {loading ? "Aguarde..." : "Continuar"}
                  </button>

                  <button
                    onClick={() => navigate("/esqueci-senha")}
                    className="w-full text-center text-sm pt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </>
          )}

          {/* ============ ETAPA 2: NUMERO NOVO ============ */}
          {etapa === "numero" && (
            <>
              <p
                className="text-[14px] leading-relaxed mb-5"
                style={{ color: "var(--text-secondary)" }}
              >
                Vamos enviar um código para confirmar que o número é seu.
              </p>

              <div className="space-y-3">
                <div className="flex items-stretch gap-2">
                  <div
                    className="flex items-center justify-center gap-1.5 px-3.5 rounded-2xl text-sm shrink-0"
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
                    autoFocus
                    onChange={(e) => {
                      setTelefone(formatarTelefone(e.target.value));
                      setErro("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && telefoneValido(telefone)) continuarComNumero();
                    }}
                    className="campo-tacerto flex-1 min-w-0 px-4 py-3.5 rounded-2xl text-[16px] font-semibold focus:outline-none placeholder:font-normal placeholder:opacity-50"
                    style={fieldStyle}
                  />
                </div>

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={continuarComNumero}
                  disabled={loading || !telefoneValido(telefone)}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99] disabled:opacity-40"
                  style={botaoPrincipal}
                >
                  {loading ? "Aguarde..." : "Enviar código"}
                </button>
              </div>
            </>
          )}

          {/* ============ ETAPA 3: CODIGO ============ */}
          {etapa === "verificar" && (
            <>
              <p
                className="text-[14px] text-center leading-relaxed mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                Enviamos um código para{" "}
                <span style={{ color: "var(--text)", fontWeight: 600 }}>+55 {telefone}</span>
              </p>

              {/* 6 quadradinhos: o input real fica invisivel por cima. */}
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={codigo}
                  maxLength={6}
                  autoFocus
                  onFocus={aoFocarCodigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setErro("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") conferirCodigo(); }}
                  className="absolute inset-0 w-full h-full opacity-0"
                  style={{ caretColor: "transparent" }}
                  aria-label="Código de verificação"
                />
                <div className="flex items-center justify-center gap-2 pointer-events-none">
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
                            atual || preenchido ? "var(--primary)" : "var(--border)"
                          }`,
                        }}
                      >
                        {codigo[i] || ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div ref={acoesCodigoRef} className="mt-5 space-y-3 scroll-mt-24">
                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={conferirCodigo}
                  disabled={loading || codigo.length < 6}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm transition active:scale-[0.99] disabled:opacity-40"
                  style={botaoPrincipal}
                >
                  {loading ? "Aguarde..." : "Validar código"}
                </button>

                <button
                  onClick={reenviarCodigo}
                  disabled={reenviando}
                  className="w-full text-center text-sm pt-1 disabled:opacity-40"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {reenviando ? "Código reenviado" : "Reenviar código"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
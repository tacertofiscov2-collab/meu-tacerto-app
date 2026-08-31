/* LANCAR v7 — tela do codigo sobe quando o teclado abre (iOS) */
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import { ArrowLeft, Eye, EyeOff, Mail, Gauge, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthError, { translateAuthError } from "@/components/AuthError";
import { adicionarConta } from "@/lib/contas";
import { setUserState } from "@/lib/userState";
import useTemaEscuroForcado from "@/hooks/useTemaEscuroForcado";

/* ===================================================================
   CADASTRO v7 — setinha volta para a Welcome (ou para o Perfil)

   CADASTRO EM DUAS ETAPAS

   1) WHATSAPP  — o caminho principal. O atendimento do TaCerto acontece
      pelo WhatsApp, então o número é pedido logo de cara.
   2) E-MAIL    — e-mail + senha, que é o que o Supabase usa de fato para
      autenticar. O WhatsApp coletado na etapa 1 é salvo no perfil.

   VERIFICACAO DE WHATSAPP — DE VERDADE (30/08/2026)
   O codigo e enviado pela Edge Function "enviar-codigo" (que chama a
   Z-API) e validado pela Edge Function "verificar-codigo".

   NOVO NA v7 — TECLADO NAO COBRE MAIS O BOTAO (so na tela do codigo):
   Quando a pessoa toca nos 6 quadradinhos, o teclado do iPhone sobe e
   cobria o botao "Validar codigo". Agora, ao focar o campo, a tela rola
   sozinha (scrollIntoView) para deixar o botao logo acima do teclado.
   Isso vale SO para a tela de codigo, como pedido.

   COMO O WHATSAPP E SALVO — SEM DUPLICAR:
   - Caminho A (comeca pelo WhatsApp): quando a pessoa verifica o codigo,
     a conta ainda nao existe. Verificamos SEM userId (a Edge Function so
     confere o codigo). O numero e gravado depois, no handleCadastrar().
   - Caminho B (comeca por e-mail e informa o WhatsApp depois): a conta ja
     existe, verificamos COM userId e a Edge Function grava o numero na
     hora. Nesse caso NAO chamamos salvarWhatsapp() de novo.

   PENDÊNCIA DE BANCO: para o número ser salvo, a tabela `perfis` precisa
   da coluna `whatsapp`. SQL:
       alter table perfis add column if not exists whatsapp text;
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

export default function Cadastro() {
  const navigate = useNavigate();
  const location = useLocation();

  /* Esta tela serve a dois fluxos:
       - Welcome → "Criar conta": usuário ainda não entrou, tema escuro
         forçado (é a vitrine da marca).
       - Perfil → "Cadastrar conta": usuário já está dentro do app, então
         a tela segue o tema que ele escolheu em Preferências.
     O Perfil marca a origem com state: { de: "perfil" }. */
  const veioDeDentro = location.state?.de === "perfil";
  useTemaEscuroForcado(!veioDeDentro);

  // "whatsapp" (etapa 1) | "email" (etapa 2)
  const [etapa, setEtapa] = useState("whatsapp");
  const [telefone, setTelefone] = useState("");
  const [contato, setContato] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  // Quando a confirmação de e-mail está LIGADA no Supabase, o cadastro não
  // loga na hora — mostramos esta tela pedindo para confirmar o e-mail.
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [emailConfirmacao, setEmailConfirmacao] = useState("");
  // Para quem criou a conta SEM ter informado o WhatsApp (entrou por
  // e-mail ou social): guardamos o destino e pedimos o número antes de
  // seguir. O WhatsApp é o canal de atendimento, então ninguém passa sem.
  const [destinoPosCadastro, setDestinoPosCadastro] = useState("/onboarding");
  const [userIdPosCadastro, setUserIdPosCadastro] = useState(null);
  // Código de verificação do WhatsApp (ver bloco "VERIFICAÇÃO" abaixo).
  const [codigo, setCodigo] = useState("");
  // Para onde ir depois de verificar o código.
  const [destinoPosVerificacao, setDestinoPosVerificacao] = useState("email");
  // Trava o botao "Reenviar" por alguns segundos para nao spammar.
  const [reenviando, setReenviando] = useState(false);

  // Referencia da area dos botoes (validar/reenviar) na tela do codigo.
  // Usada para rolar a tela e mostrar o botao acima do teclado no iPhone.
  const acoesCodigoRef = useRef(null);

  /* Quando o campo do codigo recebe o foco (teclado abrindo), rola a tela
     para o botao "Validar codigo" ficar visivel logo acima do teclado.
     O atraso deixa o teclado comecar a subir antes de a gente rolar, se
     nao a conta do espaco sai errada no iOS. So afeta a tela do codigo. */
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

  /* Fundo preto (do proprio app) com moldura clara em volta - em vez do
     cinza do --field, que deixava as barras "pesadas". */
  const fieldStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "var(--text)",
  };

  const botaoSocialStyle = {
    backgroundColor: "transparent",
    color: "var(--text)",
    border: "1px solid rgba(255,255,255,0.22)",
  };

  /* Salva o WhatsApp no perfil. Silencioso de propósito: se a coluna
     ainda não existir no banco, o cadastro não pode quebrar por causa
     disso — o número simplesmente não é gravado.
     OBS: no caminho B (WhatsApp depois da conta), quem grava e a Edge
     Function verificar-codigo. Aqui so grava no caminho A (conta nasce
     no handleCadastrar com o numero ja verificado). */
  async function salvarWhatsapp(userId) {
    const digitos = telefone.replace(/\D/g, "");
    if (!digitos || !userId) return;
    try {
      await supabase
        .from("perfis")
        .update({ whatsapp: `+55${digitos}` })
        .eq("id", userId);
    } catch {
      /* coluna ainda não criada ou falha de rede — segue o cadastro */
    }
  }

  /* Envia o codigo de verificacao pelo WhatsApp (Edge Function ->
     Z-API). Retorna true se conseguiu enviar, false se falhou. */
  async function enviarCodigoWhatsapp() {
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

  // Caminho A: valida o telefone, ENVIA o codigo e vai para a tela de
  // verificacao. So avanca se o envio der certo.
  async function irParaEmail() {
    setErro("");
    if (!telefoneValido(telefone)) {
      return setErro("Digite um número de WhatsApp válido com DDD.");
    }
    setLoading(true);
    const enviou = await enviarCodigoWhatsapp();
    setLoading(false);
    if (!enviou) return;
    setDestinoPosVerificacao("email_topo"); // depois de verificar, pede e-mail/senha
    setEtapa("verificar");
  }

  /* ===================================================================
     VERIFICAÇÃO DO WHATSAPP — AGORA DE VERDADE

     O codigo foi enviado pela Edge Function "enviar-codigo". Aqui a gente
     chama a Edge Function "verificar-codigo" para conferir. Ela devolve
     erro amigavel quando o codigo esta errado, expirado, ou teve
     tentativas demais.

     userId: so mandamos quando a conta ja existe (caminho B). No caminho
     A a conta ainda nao nasceu, entao vai sem userId e o numero e gravado
     depois, no handleCadastrar.
     =================================================================== */
  async function conferirCodigo() {
    setErro("");
    if (codigo.replace(/\D/g, "").length < 6) {
      return setErro("Digite os 6 números do código que enviamos.");
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verificar-codigo", {
        body: {
          telefone,
          codigo,
          // so vai userId quando a conta ja existe (caminho B)
          userId: userIdPosCadastro || undefined,
        },
      });
      if (error || data?.error) {
        setLoading(false);
        return setErro((data && data.error) || "Código incorreto. Tente novamente.");
      }

      setLoading(false);
      setCodigo("");

      // Caminho B: a conta ja existe e a Edge Function ja gravou o
      // WhatsApp. So navega — sem salvarWhatsapp() de novo.
      if (destinoPosVerificacao === "concluir") {
        navigate(destinoPosCadastro);
        return;
      }
      // Caminho A: segue para e-mail/senha. O numero sera gravado no
      // handleCadastrar, quando a conta nascer.
      setEtapa(destinoPosVerificacao);
    } catch {
      setLoading(false);
      setErro("Código incorreto. Tente novamente.");
    }
  }

  // Reenviar: envia um codigo novo pelo WhatsApp, com trava anti-spam.
  async function reenviarCodigo() {
    if (reenviando) return;
    setErro("");
    setReenviando(true);
    const enviou = await enviarCodigoWhatsapp();
    if (enviou) setErro("Enviamos um novo código para o seu WhatsApp.");
    // libera o botao depois de 30s
    setTimeout(() => setReenviando(false), 30000);
  }

  async function handleCadastrar() {
    setErro("");
    if (!contato || !senha) return setErro("Preencha e-mail e senha.");
    if (!contato.includes("@")) return setErro("Digite um e-mail válido.");
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    setLoading(true);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: contato,
      password: senha,
    });
    if (error) {
      setLoading(false);
      return setErro(translateAuthError(error.message));
    }

    // Detecta o modo pela resposta do Supabase:
    //  - session preenchida  → confirmação de e-mail DESLIGADA (entra direto).
    //  - session null        → confirmação de e-mail LIGADA (precisa confirmar).
    if (!signUpData?.session) {
      setLoading(false);
      setEmailConfirmacao(contato);
      setAguardandoConfirmacao(true);
      return;
    }

    // --- Confirmação desligada: fluxo normal (entra na hora) ---
    // Multi-conta: sempre APPEND ao array, nunca sobrescreve.
    // Preserva o nome já digitado (ex.: visitante que passou pelo onboarding).
    const nomeExistente = (typeof window !== "undefined" ? localStorage.getItem("tacerto_nome") : "") || "";
    const nomeFinal = nomeExistente.trim() || contato.split("@")[0];
    adicionarConta({ nome: nomeFinal, email: contato });
    setUserState({ nome: nomeFinal, email: contato, visitante: false });

    // Decide onboarding pelo BANCO, não pelo aparelho: se o perfil ainda
    // não tem tipo_mei, a pessoa nunca completou o onboarding.
    //
    // ATENÇÃO: NÃO usar mes_abertura aqui. Quem responde "Não, já faz
    // tempo" no onboarding tem mes_abertura salvo como NULL — e seria
    // mandado pro onboarding de novo a cada login. tipo_mei é sempre
    // preenchido ao concluir.
    let precisaOnboarding = true;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) {
        setUserIdPosCadastro(user.id);
        // Caminho A: o numero ja foi verificado antes da conta existir.
        // Agora que a conta nasceu, grava o WhatsApp coletado na etapa 1.
        await salvarWhatsapp(user.id);

        const { data: perfil } = await supabase
          .from("perfis")
          .select("onboarding_ok")
          .eq("id", user.id)
          .single();
        if (perfil && perfil.onboarding_ok === true) precisaOnboarding = false;
      }
    } catch {
      /* falha de rede → por segurança, mostra o onboarding */
    }

    setLoading(false);
    const destino = precisaOnboarding ? "/onboarding" : "/dashboard";

    // Sem WhatsApp ainda? Pede antes de seguir (caminho B).
    if (!telefone) {
      setDestinoPosCadastro(destino);
      setEtapa("whatsapp_depois");
      return;
    }
    navigate(destino);
  }

  // Caminho B: pessoa criou a conta por e-mail e agora informa o WhatsApp.
  // Valida, ENVIA o codigo e vai para a tela de verificacao.
  async function concluirComWhatsapp() {
    setErro("");
    if (!telefoneValido(telefone)) {
      return setErro("Digite um número de WhatsApp válido com DDD.");
    }
    setLoading(true);
    const enviou = await enviarCodigoWhatsapp();
    setLoading(false);
    if (!enviou) return;
    setDestinoPosVerificacao("concluir");
    setEtapa("verificar");
  }

  /* ===================================================================
     LOGIN SOCIAL (Google) — ativo.
     =================================================================== */
  async function entrarCom(provider) {
    setErro("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro(translateAuthError(error.message));
  }

  function handleGoogle() {
    entrarCom("google");
  }

  // Tela de "confira seu e-mail" — aparece quando a confirmação está ligada.
  if (aguardandoConfirmacao) {
    return (
      <div
        className="min-h-screen min-h-[100dvh] w-full flex flex-col"
        style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
      >
        <div className="px-4 pt-5 shrink-0">
          <button
            onClick={() => setAguardandoConfirmacao(false)}
            aria-label="Voltar"
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-80"
            style={{ color: "var(--text)" }}
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 pb-6">
          <div className="max-w-sm w-full mx-auto text-center">
            <div className="flex justify-center mb-5">
              <span
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--field)" }}
              >
                <MailCheck size={40} strokeWidth={2} style={{ color: "var(--primary)" }} />
              </span>
            </div>

            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              Confirme seu e-mail
            </h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Enviamos um link de confirmação para{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{emailConfirmacao}</span>.
              Abra seu e-mail e clique no link para ativar sua conta. Depois, é só entrar.
            </p>
            <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
              Não chegou? Verifique a caixa de spam ou lixo eletrônico.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="w-full mt-7 py-3.5 rounded-xl font-medium text-sm hover:opacity-90"
              style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const podeContinuar = telefoneValido(telefone);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="px-4 pt-5 shrink-0">
        {/* Para onde a seta volta, em ordem:
              1. etapa interna (email/verificar/whatsapp_depois) -> etapa 1
              2. quem entrou por Perfil > Cadastrar conta        -> /perfil
              3. todo o resto                                    -> / (slides)
            NAO usar navigate(-1): como Cadastro e Login apontam um para o
            outro, "voltar uma pagina" devolvia para a outra tela de acesso. */}
        <button
          onClick={() => {
            if (etapa === "email" || etapa === "verificar" || etapa === "whatsapp_depois") {
              setErro("");
              return setEtapa("whatsapp");
            }
            navigate(veioDeDentro ? "/perfil" : "/", { replace: true });
          }}
          aria-label="Voltar"
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-6">
        <div className="max-w-sm w-full mx-auto">
          <div className="flex justify-center mb-7">
            <Gauge size={44} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          </div>

          {/* ====== ETAPA 1: ENTRADA (alterna WhatsApp <-> E-mail) ======
              A mesma tela serve aos dois caminhos: o campo do topo muda e
              o botao de baixo passa a oferecer o outro caminho. Sem tela
              nova, como no fluxo de referencia. */}
          {(etapa === "whatsapp" || etapa === "email_topo") && (
            <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                {etapa === "whatsapp" ? "Comece com seu WhatsApp" : "Comece com seu e-mail"}
              </h1>

              <div className="mt-5 space-y-3">
                {etapa === "whatsapp" ? (
                  <div className="flex items-stretch gap-2">
                    {/* Prefixo do pais — fixo no Brasil por enquanto */}
                    <div
                      className="flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-sm shrink-0"
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
                      onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                      onKeyDown={(e) => { if (e.key === "Enter" && podeContinuar) irParaEmail(); }}
                      className="campo-tacerto flex-1 min-w-0 px-4 py-3.5 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                      style={fieldStyle}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      inputMode="email"
                      placeholder="E-mail"
                      value={contato}
                      onChange={(e) => setContato(e.target.value)}
                      className="campo-tacerto w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                      style={fieldStyle}
                    />
                    {/* Senha junto do e-mail, na mesma tela. */}
                    <div className="relative">
                      <input
                        type={showSenha ? "text" : "password"}
                        placeholder="Crie uma senha (mín. 8 caracteres)"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && senha.length >= 8) handleCadastrar(); }}
                        className="campo-tacerto w-full px-4 py-3.5 pr-11 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                        style={fieldStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </>
                )}

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={() => {
                    setErro("");
                    if (etapa === "whatsapp") return irParaEmail();
                    if (!contato.includes("@")) return setErro("Digite um e-mail válido.");
                    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
                    handleCadastrar();
                  }}
                  disabled={
                    loading ||
                    (etapa === "whatsapp"
                      ? !podeContinuar
                      : !(contato.includes("@") && senha.length >= 8))
                  }
                  className="w-full py-3 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                >
                  {loading ? "Aguarde..." : "Continuar"}
                </button>

                <div className="flex items-center gap-3 py-4">
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                  <span className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>ou</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                </div>

                <button
                  onClick={handleGoogle}
                  className="relative w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center hover:opacity-90"
                  style={botaoSocialStyle}
                >
                  <span className="absolute left-4 flex items-center">
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" fill="var(--primary)">
                      <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                    </svg>
                  </span>
                  Continuar com Google
                </button>

                {/* Alterna o caminho principal da tela */}
                <button
                  onClick={() => {
                    setErro("");
                    setEtapa(etapa === "whatsapp" ? "email_topo" : "whatsapp");
                  }}
                  className="relative w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center hover:opacity-90"
                  style={botaoSocialStyle}
                >
                  <span className="absolute left-4 flex items-center">
                    {etapa === "whatsapp" ? (
                      <Mail size={18} style={{ color: "var(--primary)" }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="var(--primary)">
                        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/>
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.2.84.85-3.12-.2-.32a8.2 8.2 0 01-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.23 8.23z"/>
                      </svg>
                    )}
                  </span>
                  {etapa === "whatsapp" ? "Continuar com E-mail" : "Continuar com WhatsApp"}
                </button>

                {/* Saida para quem ja tem conta — espelha o "Nao tem conta?" do Login */}
                <button
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full text-center text-sm pt-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Já tem conta?{" "}
                  <span style={{ color: "var(--primary)", fontWeight: 600 }}>Entrar</span>
                </button>
              </div>
            </>
          )}

          {/* ============ VERIFICAÇÃO DO WHATSAPP ============ */}
          {etapa === "verificar" && (
            <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Confirme seu WhatsApp
              </h1>
              <p
                className="text-sm text-center mt-2 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Enviamos um código para{" "}
                <span style={{ color: "var(--text)", fontWeight: 600 }}>+55 {telefone}</span>
              </p>

              {/* 6 quadradinhos: o input real fica invisivel por cima e
                  os quadradinhos apenas desenham o que foi digitado. */}
              <div className="mt-6">
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={codigo}
                    maxLength={6}
                    autoFocus
                    onFocus={aoFocarCodigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
                              atual || preenchido
                                ? "var(--primary)"
                                : "rgba(255,255,255,0.22)"
                            }`,
                          }}
                        >
                          {codigo[i] || ""}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Area dos botoes — a referencia aqui faz a tela rolar
                    ate este ponto quando o teclado abre (iPhone), deixando
                    o "Validar codigo" logo acima do teclado. O scroll-mt
                    reserva um respiro no topo ao rolar. */}
                <div ref={acoesCodigoRef} className="mt-5 space-y-3 scroll-mt-24">
                  {erro && <AuthError>{erro}</AuthError>}

                  <button
                    onClick={conferirCodigo}
                    disabled={loading || codigo.length < 6}
                    className="w-full py-3 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-40"
                    style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
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
              </div>
            </>
          )}

          {/* ====== ETAPA EXTRA: WHATSAPP DEPOIS DO CADASTRO ====== */}
          {etapa === "whatsapp_depois" && (
            <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Qual é o seu WhatsApp?
              </h1>

              <div className="mt-5 space-y-3">
                <div className="flex items-stretch gap-2">
                  <div
                    className="flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-sm shrink-0"
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
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    className="campo-tacerto flex-1 min-w-0 px-4 py-3.5 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                    style={fieldStyle}
                  />
                </div>

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={concluirComWhatsapp}
                  disabled={loading || !telefoneValido(telefone)}
                  className="w-full py-3 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                >
                  {loading ? "Aguarde..." : "Continuar"}
                </button>
              </div>
            </>
          )}

          {/* ============ ETAPA 2: E-MAIL E SENHA ============ */}
          {etapa === "email" && (
            <>
              <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)" }}>
                Agora seus dados de acesso
              </h1>

              <div className="mt-6 space-y-5">
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="Digite seu e-mail"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    className="campo-tacerto w-full pl-11 pr-4 py-4 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                    style={fieldStyle}
                  />
                </div>

                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"}
                    placeholder="Crie uma senha (mín. 8 caracteres)"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="campo-tacerto w-full px-4 py-4 pr-11 rounded-xl text-sm focus:outline-none placeholder:opacity-70"
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {erro && <AuthError>{erro}</AuthError>}

                <button
                  onClick={handleCadastrar}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                >
                  {loading ? "Aguarde..." : "Criar minha conta"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Termos só na tela de entrada — nas etapas seguintes some. */}
      {(etapa === "whatsapp" || etapa === "email_topo") && (
      <div className="px-6 pb-2 shrink-0">
        <p
          className="text-center text-xs leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Ao continuar, você concorda com nossos{" "}
          <button
            onClick={() => navigate("/termos")}
            className="font-medium"
            style={{ color: "var(--primary)" }}
          >
            Termos de Uso e Política de Privacidade
          </button>
        </p>
      </div>
      )}
    </div>
  );
}